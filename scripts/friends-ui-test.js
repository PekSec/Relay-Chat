import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

let server;
let browser, checks = 0;
const check = (label, value) => { assert.ok(value, label); console.log(`PASS ${label}`); checks++; };
async function api(ctx, path, method = 'GET', data) {
    const response = await ctx.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(response.ok(), `${path}: ${response.status()}`);
    return response.json();
}
async function signup(ctx, fullName) {
    return (await api(ctx, '/auth/signup', 'POST', { fullName, username: `fr_${randomBytes(5).toString('hex')}`,
        password: 'Friends-test-2026!', confirmPassword: 'Friends-test-2026!', gender: 'female' })).user;
}
const row = (page, name) => page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
try {
    await mkdir('test-results', { recursive: true });
    browser = await chromium.launch();
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 320, 650]]) {
        // Each device gets a fresh process; retain the production IP rate limit.
        server = await startTestServer({ defaultPort: 5033, production: true });
        const own = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        let transport;
        await own.routeWebSocket('**/socket.io/**', socket => { transport = socket; socket.connectToServer(); });
        const peer = await browser.newContext();
        const other = await browser.newContext();
        const a = await signup(own, 'Test Hesabı');
        const b = await signup(peer, 'Işıl İpek');
        const c = await signup(other, 'Uzunisim'.repeat(6));
        const request = await api(peer, `/friends/send/${a._id}`, 'POST');
        await api(own, `/friends/respond`, 'POST', { requestId: request.friendRequest._id, response: 'accept' });
        const page = await own.newPage(); page.setDefaultTimeout(8000);
        page.on('response', response => { if (response.status() === 429) console.log('RATE LIMIT', new URL(response.url()).pathname); });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(server.base);
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await page.getByRole('tab', { name: 'Tümü', exact: true }).waitFor();
        await row(page, b.fullName).waitFor();
        check(`${device}: accessible tabs and friend row`, await page.getByRole('tab').count() === 3);
        const search = page.getByRole('searchbox', { name: 'Arkadaşlarda ara' });
        await search.fill('ışıl');
        check(`${device}: Turkish search`, await row(page, b.fullName).count() === 1);
        await search.fill('eşleşmez');
        await page.getByText('Eşleşen kişi yok.', { exact: true }).waitFor();
        await search.fill('');
        await row(page, b.fullName).getByRole('button', { name: 'Çıkar', exact: true }).click();
        let modal = page.getByRole('dialog');
        await modal.waitFor();
        check(`${device}: confirmation names person and preserves history`, (await modal.textContent()).includes(b.fullName) && (await modal.textContent()).includes('Sohbet geçmişi korunacak.'));
        check(`${device}: cancel initially focused`, await modal.getByRole('button', { name: 'Vazgeç' }).evaluate(el => el === document.activeElement));
        await page.keyboard.press('Escape');
        check(`${device}: cancel returns focus`, await row(page, b.fullName).getByRole('button', { name: 'Çıkar', exact: true }).evaluate(el => el === document.activeElement));

        await api(other, `/friends/send/${a._id}`, 'POST');
        await page.getByRole('tab', { name: 'Gelen', exact: true }).click();
        await row(page, c.fullName).waitFor();
        await api(other, `/messages/send/${a._id}`, 'POST', { message: 'Korunacak geçmiş' });
        await page.route('**/api/friends/respond', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
        await row(page, c.fullName).getByRole('button', { name: 'Kabul et', exact: true }).click();
        await row(page, c.fullName).getByRole('alert').waitFor();
        check(`${device}: failed accept retains request`, await row(page, c.fullName).isVisible());
        await page.unroute('**/api/friends/respond');
        const acceptingTab = await own.newPage();
        await acceptingTab.goto(server.base);
        await acceptingTab.getByRole('button', { name: /^İstekler/ }).click();
        const pendingConversation = acceptingTab.getByRole('region', { name: 'Gelen mesaj istekleri' }).getByText(c.fullName, { exact: true });
        await pendingConversation.waitFor();
        await row(page, c.fullName).getByRole('button', { name: 'Kabul et', exact: true }).click();
        await row(page, c.fullName).waitFor({ state: 'detached' });
        await pendingConversation.waitFor({ state: 'detached' });
        check(`${device}: acceptance refreshes sibling message requests`, true);
        await acceptingTab.close();
        check(`${device}: acceptance stays in incoming`, await page.getByRole('tab', { name: 'Gelen', exact: true }).getAttribute('aria-selected') === 'true');
        await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
        await row(page, c.fullName).waitFor();
        await api(own, '/auth/preferences', 'PATCH', { theme: device === 'desktop' ? 'light' : 'dark', accent: 'purple', density: 'compact', fontSize: 'large' });
        await page.reload();
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await row(page, c.fullName).waitFor();
        check(`${device}: long name and large text fit`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `test-results/friends-${device}.png` });

        // A server-side removal must reach every tab of both accounts.
        const second = await own.newPage();
        await second.goto(server.base);
        await second.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await row(second, c.fullName).waitFor();
        await api(other, `/friends/remove/${a._id}`, 'DELETE');
        await row(page, c.fullName).waitFor({ state: 'detached' });
        await row(second, c.fullName).waitFor({ state: 'detached' });
        check(`${device}: removal reaches both own tabs`, true);
        await second.close();

        await api(other, `/friends/send/${a._id}`, 'POST');
        await page.getByRole('tab', { name: 'Gelen', exact: true }).click();
        await row(page, c.fullName).waitFor();
        await row(page, c.fullName).getByRole('button', { name: 'Reddet' }).click();
        await row(page, c.fullName).waitFor({ state: 'detached' });
        check(`${device}: reject removes only request`, !(await api(own, '/friends/list')).friends.some(u => u._id === c._id));
        const sent = await api(own, `/friends/send/${c._id}`, 'POST');
        await page.getByRole('tab', { name: 'Giden', exact: true }).click();
        await row(page, c.fullName).waitFor();
        await page.route('**/api/friends/cancel/*', route => route.abort());
        await row(page, c.fullName).getByRole('button', { name: 'İsteği iptal et' }).click();
        await row(page, c.fullName).getByRole('alert').waitFor();
        check(`${device}: failed cancellation preserves target`, await row(page, c.fullName).isVisible());
        await page.unroute('**/api/friends/cancel/*');
        await row(page, c.fullName).getByRole('button', { name: 'İsteği iptal et' }).click();
        await row(page, c.fullName).waitFor({ state: 'detached' });
        check(`${device}: outgoing cancellation persists`, !(await api(own, '/friends/sentRequests')).sentRequests.some(r => r._id === sent.friendRequest._id));

        // Offline changes arrive on reconnect through the same canonical list hooks.
        await own.setOffline(true); transport.close();
        await api(other, `/friends/send/${a._id}`, 'POST');
        await own.setOffline(false);
        await page.getByRole('tab', { name: 'Gelen', exact: true }).click();
        await row(page, c.fullName).waitFor();
        check(`${device}: reconnect refreshes missed request`, true);
        await row(page, c.fullName).getByRole('button', { name: 'Kabul et', exact: true }).click();
        await row(page, c.fullName).waitFor({ state: 'detached' });
        await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
        await row(page, c.fullName).waitFor();
        await row(page, c.fullName).getByRole('button', { name: 'Çıkar', exact: true }).click();
        modal = page.getByRole('dialog');
        await page.route('**/api/friends/remove/*', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
        await modal.getByRole('button', { name: 'Çıkar', exact: true }).click();
        await modal.getByRole('alert').waitFor();
        check(`${device}: remove error stays in modal`, await row(page, c.fullName).isVisible());
        await page.unroute('**/api/friends/remove/*');
        let releaseRemove, removeCalls = 0;
        const heldRemove = new Promise(resolve => { releaseRemove = resolve; });
        await page.route('**/api/friends/remove/*', async route => {
            removeCalls++; await heldRemove; await route.continue();
        });
        await modal.getByRole('button', { name: 'Çıkar', exact: true }).click();
        await modal.getByRole('button', { name: 'Çıkarılıyor' }).waitFor();
        await page.keyboard.press('Escape');
        check(`${device}: pending removal blocks repeat and closing`, await modal.isVisible() && await modal.getByRole('button', { name: 'Çıkarılıyor' }).isDisabled());
        releaseRemove();
        await modal.waitFor({ state: 'detached' });
        await row(page, c.fullName).waitFor({ state: 'detached' });
        check(`${device}: one remove request`, removeCalls === 1);
        await page.unroute('**/api/friends/remove/*');
        check(`${device}: removal keeps both histories`, (await api(own, `/messages/${c._id}`)).some(m => m.message === 'Korunacak geçmiş') &&
            (await api(other, `/messages/${a._id}`)).some(m => m.message === 'Korunacak geçmiş'));
        await page.waitForFunction(() => document.activeElement?.matches('.friend-row, input[aria-label="Arkadaşlarda ara"]'));
        check(`${device}: removed row has a focus fallback`, true);

        // List-specific error must not masquerade as an empty list.
        await page.route('**/api/friends/requests', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await page.reload();
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await page.getByRole('tab', { name: 'Gelen', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Gelen istekler yüklenemedi.' }).waitFor();
        check(`${device}: list error is distinct from empty`, await page.getByText('Gelen arkadaşlık isteği yok.', { exact: true }).count() === 0);
        await page.unroute('**/api/friends/requests');
        await page.getByRole('alert').getByRole('button', { name: 'Tekrar dene' }).click();
        await page.getByText('Gelen arkadaşlık isteği yok.', { exact: true }).waitFor();
        check(`${device}: list retry works`, true);
        await page.getByRole('tab', { name: 'Gelen', exact: true }).focus();
        await page.keyboard.press('ArrowRight');
        check(`${device}: arrow-key tabs`, await page.getByRole('tab', { name: 'Giden', exact: true }).getAttribute('aria-selected') === 'true');
        await search.fill('ışıl');
        await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
        check(`${device}: query survives tab switch`, await search.inputValue() === 'ışıl');
        await search.fill('');

        const late = await api(other, `/friends/send/${a._id}`, 'POST');
        let releaseList, listCaptured;
        const heldList = new Promise(resolve => { releaseList = resolve; });
        const capturedList = new Promise(resolve => { listCaptured = resolve; });
        let firstList = true;
        await page.route('**/api/friends/requests', async route => {
            if (!firstList) return route.continue();
            firstList = false;
            const response = await route.fetch(); listCaptured();
            await heldList;
            await route.fulfill({ response }).catch(() => {});
        });
        await page.reload(); await capturedList;
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await page.getByRole('tab', { name: 'Gelen', exact: true }).click();
        check(`${device}: initial load is not an empty result`, await page.getByText('Gelen arkadaşlık isteği yok.', { exact: true }).count() === 0);
        await api(other, `/friends/cancel/${late.friendRequest._id}`, 'DELETE');
        await page.getByText('Gelen arkadaşlık isteği yok.', { exact: true }).waitFor();
        releaseList();
        await page.unroute('**/api/friends/requests', undefined, { behavior: 'wait' });
        check(`${device}: cancelled request not resurrected by old snapshot`, await row(page, c.fullName).count() === 0);
        await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
        await row(page, b.fullName).waitFor();
        await row(page, b.fullName).getByRole('button', { name: 'Mesaj', exact: true }).click();
        await page.getByRole('textbox', { name: 'Mesaj', exact: true }).waitFor();
        check(`${device}: draft opens without sending`, (await api(own, `/messages/${b._id}`)).length === 0);
        await api(own, `/messages/send/${b._id}`, 'POST', { message: 'Mevcut sohbet' });
        await page.reload();
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
        await row(page, b.fullName).getByRole('button', { name: 'Mesaj', exact: true }).click();
        await page.locator('.bubble').filter({ hasText: 'Mevcut sohbet' }).waitFor().catch(async error => {
            await page.screenshot({ path: 'test-results/friends-failure.png' });
            console.log(await page.locator('body').innerText()); throw error;
        });
        check(`${device}: existing conversation opens`, true);
        if (device === 'desktop') {
            await api(own, `/friends/remove/${b._id}`, 'DELETE');
            const headerRequest = await api(peer, `/friends/send/${a._id}`, 'POST');
            await page.getByRole('button', { name: 'İsteği kabul et', exact: true }).waitFor();
            await page.route('**/api/friends/respond', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
            await page.getByRole('button', { name: 'İsteği kabul et', exact: true }).click();
            await page.getByRole('alert').filter({ hasText: 'İstek kabul edilemedi.' }).waitFor();
            await page.locator('.conversation-row').filter({ hasText: c.fullName }).click();
            check('acceptance error stays with its target chat', await page.getByRole('alert').filter({ hasText: 'İstek kabul edilemedi.' }).count() === 0);
            await page.unroute('**/api/friends/respond');
            await api(own, '/friends/respond', 'POST', { requestId: headerRequest.friendRequest._id, response: 'accept' });
            await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
            await row(page, b.fullName).getByRole('button', { name: 'Çıkar', exact: true }).click();
            let releaseAccount, persisted;
            const held = new Promise(resolve => { releaseAccount = resolve; });
            const observed = new Promise(resolve => { persisted = resolve; });
            await page.route('**/api/friends/remove/*', async route => {
                const response = await route.fetch(); persisted(); await held;
                await route.fulfill({ response }).catch(() => {});
            });
            await page.getByRole('dialog').getByRole('button', { name: 'Çıkar', exact: true }).click();
            await observed;
            await api(own, '/auth/logout', 'POST');
            await signup(own, 'Yeni Hesap');
            const accountTab = await own.newPage();
            await accountTab.goto(server.base);
            await accountTab.evaluate(() => localStorage.setItem('chat-session-change', String(Date.now())));
            await page.getByText('Yeni Hesap', { exact: true }).first().waitFor();
            releaseAccount();
            await page.unrouteAll({ behavior: 'wait' });
            await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
            await page.getByText('Henüz arkadaşın yok.', { exact: true }).waitFor();
            check('late removal cannot affect another account or retain modal', await page.getByRole('dialog').count() === 0 && await row(page, b.fullName).count() === 0);
            await accountTab.close();
        }
        check(`${device}: no browser errors`, errors.length === 0);
        await own.close(); await peer.close(); await other.close();
        await server.stop();
    }
    console.log(`${checks} friends UI checks passed`);
} finally {
    await browser?.close(); await server?.stop();
}
