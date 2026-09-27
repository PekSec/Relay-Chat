import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

let browser, server, lastPage, prefix, checks = 0;
const check = (name, value) => { assert.ok(value, name); console.log(`PASS ${name}`); checks++; };
const api = async (context, path, method = 'GET', data) => {
    const response = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(response.ok(), `${path}: ${response.status()}`); return response.json();
};
const signup = async (context, fullName) => (await api(context, '/auth/signup', 'POST', {
    fullName, username: `${prefix}_${randomBytes(3).toString('hex')}`, password: 'Newchat-test-2026!',
    confirmPassword: 'Newchat-test-2026!', gender: 'female',
})).user;
try {
    await mkdir('test-results', { recursive: true });
    browser = await chromium.launch();
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 320, 650]]) {
        prefix = `nc_${randomBytes(3).toString('hex')}`;
        server = await startTestServer({ defaultPort: 5034, production: true });
        const own = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const peer = await browser.newContext();
        const other = await browser.newContext();
        const a = await signup(own, 'Arayan Kişi');
        const b = await signup(peer, 'Uzunisim'.repeat(6));
        const c = await signup(other, 'İpek Deniz');
        const page = await own.newPage(); lastPage = page; page.setDefaultTimeout(8000);
        const errors = []; page.on('pageerror', e => { errors.push(e.message); console.log('BROWSER ERROR', e.stack); });
        await page.goto(server.base);
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        const modal = page.getByRole('dialog', { name: 'Yeni sohbet' });
        await modal.waitFor();
        const search = modal.getByRole('searchbox', { name: 'Kullanıcı adı veya arkadaş kodu' });
        check(`${device}: initial search focus`, await search.evaluate(el => el === document.activeElement));
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'detached' });
        check(`${device}: close returns focus`, await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).evaluate(el => el === document.activeElement));
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        const person = user => modal.getByRole('article').filter({ hasText: user.username });
        let searches = 0;
        page.on('request', request => { if (request.url().includes('/api/friends/search?')) searches++; });
        for (const invalid of [' ', 'a', ' a ', '#AB12', 'ışıl', 'a'.repeat(21)]) {
            await search.fill(invalid);
            await page.waitForTimeout(400);
        }
        check(`${device}: short/invalid queries never request`, searches === 0);
        await modal.getByRole('alert').filter({ hasText: '2–20 karakter' }).waitFor();
        await search.fill('zzzzzzzzzzzzzzzzzzzz');
        await modal.getByText('Kullanıcı bulunamadı. Yazdığın adı veya kodu kontrol et.').waitFor();
        check(`${device}: valid no-result state`, true);
        await search.fill(` ${b.username} `);
        await person(b).waitFor();
        check(`${device}: trimmed username search`, await person(b).isVisible());
        await search.fill(b.friendCode.toLowerCase());
        await person(b).waitFor();
        check(`${device}: friend code without #`, await person(b).isVisible());
        await search.fill(a.username);
        await modal.getByText('Kullanıcı bulunamadı. Yazdığın adı veya kodu kontrol et.').waitFor();
        check(`${device}: own account excluded`, true);
        await page.route('**/api/friends/search?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await search.fill(b.username);
        await modal.getByRole('alert').filter({ hasText: 'Arama tamamlanamadı.' }).waitFor();
        check(`${device}: search error preserves query`, await search.inputValue() === b.username);
        await page.unroute('**/api/friends/search?*');
        await modal.getByRole('button', { name: 'Tekrar dene' }).click();
        await person(b).waitFor();
        check(`${device}: search retry succeeds`, true);

        let releaseSearch, searched;
        const heldSearch = new Promise(resolve => { releaseSearch = resolve; });
        const capturedSearch = new Promise(resolve => { searched = resolve; });
        await page.route('**/api/friends/search?*', async route => {
            if (new URL(route.request().url()).searchParams.get('query') !== c.username) return route.continue();
            const response = await route.fetch(); searched(); await heldSearch;
            await route.fulfill({ response }).catch(() => {});
        });
        await search.fill(c.username); await capturedSearch;
        check(`${device}: pending search is not empty`, await modal.getByText('Kişiler aranıyor…').isVisible() && await person(b).count() === 0);
        await search.fill(b.username); await person(b).waitFor(); releaseSearch();
        await page.unrouteAll({ behavior: 'wait' });
        check(`${device}: late search cannot replace latest`, await person(c).count() === 0 && await person(b).isVisible());

        await page.route('**/api/friends/send/*', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
        await person(b).getByRole('button', { name: 'Arkadaş ekle', exact: true }).click();
        await person(b).getByRole('alert').waitFor();
        check(`${device}: send failure stays in row`, await search.inputValue() === b.username);
        await page.unroute('**/api/friends/send/*');
        let releaseSend, sending, sends = 0;
        const heldSend = new Promise(resolve => { releaseSend = resolve; });
        const capturedSend = new Promise(resolve => { sending = resolve; });
        await page.route('**/api/friends/send/*', async route => {
            sends++; sending(); await heldSend; await route.continue().catch(() => {});
        });
        await person(b).getByRole('button', { name: 'Arkadaş ekle', exact: true }).dblclick();
        await capturedSend;
        await page.keyboard.press('Escape');
        check(`${device}: pending send prevents dismissal and duplicate`, await modal.isVisible() && sends === 1 && await modal.getByRole('button', { name: 'Kapat' }).isDisabled());
        await search.fill(prefix);
        await person(c).getByRole('button', { name: 'Arkadaş ekle', exact: true }).waitFor();
        check(`${device}: other targets remain available`, await person(c).getByRole('button', { name: 'Arkadaş ekle', exact: true }).isEnabled());
        releaseSend();
        await page.unrouteAll({ behavior: 'wait' });
        await person(b).getByText('İstek gönderildi', { exact: true }).waitFor();
        check(`${device}: success retains search/results`, await search.inputValue() === prefix);
        const outgoing = (await api(own, '/friends/sentRequests')).sentRequests.find(r => r.receiverId._id === b._id);
        check(`${device}: single persisted outgoing request`, Boolean(outgoing));
        await api(peer, '/friends/respond', 'POST', { requestId: outgoing._id, response: 'accept' });
        await person(b).getByText('Arkadaşın', { exact: true }).waitFor();
        check(`${device}: live acceptance updates relationship`, await person(b).getByRole('button', { name: 'Arkadaş ekle', exact: true }).count() === 0);
        await api(other, `/friends/send/${a._id}`, 'POST');
        await person(c).getByText('Gelen istek var', { exact: true }).waitFor();
        await person(c).getByRole('button', { name: 'Gelen isteklere git' }).click();
        await modal.waitFor({ state: 'detached' });
        check(`${device}: incoming link selects Friends incoming tab`, await page.getByRole('tab', { name: 'Gelen', exact: true }).getAttribute('aria-selected') === 'true');
        await page.getByRole('tab', { name: 'Giden', exact: true }).click();
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        await search.fill(c.username); await person(c).getByRole('button', { name: 'Gelen isteklere git' }).click();
        await modal.waitFor({ state: 'detached' });
        check(`${device}: repeated incoming navigation overrides last selected tab`, await page.getByRole('tab', { name: 'Gelen', exact: true }).getAttribute('aria-selected') === 'true');
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        check(`${device}: reopening clears query`, await search.inputValue() === '');
        await search.fill(b.username); await person(b).waitFor();
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('Tab');
            check(`${device}: focus stays inside modal ${i}`, await modal.evaluate(el => el.contains(document.activeElement)));
        }
        await person(b).getByRole('button', { name: 'Sohbet aç' }).click();
        await modal.waitFor({ state: 'detached' });
        const composer = page.getByRole('textbox', { name: 'Mesaj', exact: true });
        await composer.waitFor();
        await page.waitForFunction(() => document.activeElement === document.querySelector('textarea[aria-label="Mesaj"]'));
        check(`${device}: conversation receives focus`, await composer.evaluate(el => el === document.activeElement));
        check(`${device}: opening draft creates no message`, (await api(own, `/messages/${b._id}`)).length === 0);
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        await search.fill(b.username); await person(b).waitFor();
        await person(b).getByRole('button', { name: 'Sohbet aç' }).click();
        await composer.fill('Yeni sohbetten ilk mesaj'); await composer.press('Enter');
        await page.locator('.bubble').filter({ hasText: 'Yeni sohbetten ilk mesaj' }).waitFor();
        check(`${device}: first real message sends normally`, (await api(peer, `/messages/${a._id}`)).some(m => m.message === 'Yeni sohbetten ilk mesaj'));
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        await search.fill(b.username); await person(b).waitFor();
        await person(b).getByRole('button', { name: 'Sohbet aç' }).click();
        await page.locator('.bubble').filter({ hasText: 'Yeni sohbetten ilk mesaj' }).waitFor();
        check(`${device}: existing history opens`, true);
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await api(own, '/auth/preferences', 'PATCH', { theme: device === 'mobile' ? 'dark' : 'light', accent: 'purple', density: 'compact', fontSize: 'large' });
        await page.reload();
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        await search.fill(prefix); await person(b).waitFor();
        await page.screenshot({ path: `test-results/new-chat-${device}.png` });
        check(`${device}: long name and large text do not overflow`, await modal.evaluate(el => el.scrollWidth <= el.clientWidth) && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const actionGeometry = await modal.getByRole('article').evaluateAll(rows => rows.map(row => ({
            open: [...row.querySelectorAll('button')].find(button => button.textContent.includes('Sohbet aç')).getBoundingClientRect().toJSON(),
            heights: [...row.querySelectorAll('button')].map(button => button.getBoundingClientRect().height),
        })));
        check(`${device}: aligned actions have usable target sizes`, actionGeometry.every(row =>
            row.heights.every(height => height >= (device === 'mobile' ? 44 : 40)) &&
            Math.abs(row.open.x - actionGeometry[0].open.x) < 1 && Math.abs(row.open.width - actionGeometry[0].open.width) < 1));
        if (device === 'mobile') {
            await page.setViewportSize({ width, height: 380 });
            await search.focus();
            const inputBox = await search.boundingBox();
            const closeBox = await modal.getByRole('button', { name: 'Kapat' }).boundingBox();
            check('mobile: shortened viewport keeps input and close accessible', inputBox.y >= 0 && inputBox.y + inputBox.height <= 380 && closeBox.y + closeBox.height <= 380);
            await page.setViewportSize({ width, height });
        }
        await modal.getByRole('button', { name: 'Kapat', exact: true }).click();
        await page.route('**/api/friends/list', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        await search.fill(b.username);
        await modal.getByRole('alert').filter({ hasText: 'Arkadaşlık durumu yüklenemedi.' }).waitFor();
        await person(b).waitFor();
        check(`${device}: unknown relationship cannot send`, await person(b).getByRole('button', { name: 'Arkadaş ekle' }).count() === 0);
        await page.unroute('**/api/friends/list');
        await modal.getByRole('button', { name: 'Tekrar dene' }).click();
        await person(b).getByText('Arkadaşın', { exact: true }).waitFor();
        check(`${device}: relationship retry recovers`, true);
        if (device === 'desktop') {
            const sibling = await own.newPage();
            await sibling.goto(server.base);
            await sibling.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
            await sibling.getByRole('searchbox', { name: 'Kullanıcı adı veya arkadaş kodu' }).fill(b.username);
            const siblingRow = sibling.getByRole('dialog').getByRole('article').filter({ hasText: b.username });
            await siblingRow.getByText('Arkadaşın', { exact: true }).waitFor();
            await api(own, `/friends/remove/${b._id}`, 'DELETE');
            await siblingRow.getByRole('button', { name: 'Arkadaş ekle' }).waitFor();
            await person(b).getByRole('button', { name: 'Arkadaş ekle' }).waitFor();
            check('two tabs reflect friendship removal while modal stays open', true);
            let releaseAccount, persisted;
            const heldAccount = new Promise(resolve => { releaseAccount = resolve; });
            const persistedAccount = new Promise(resolve => { persisted = resolve; });
            await page.route('**/api/friends/send/*', async route => {
                const response = await route.fetch(); persisted(); await heldAccount;
                await route.fulfill({ response }).catch(() => {});
            });
            await person(b).getByRole('button', { name: 'Arkadaş ekle' }).click();
            await persistedAccount;
            await siblingRow.getByText('İstek gönderildi', { exact: true }).waitFor();
            check('sibling reflects send before initiator HTTP response', true);
            await api(own, '/auth/logout', 'POST');
            await signup(own, 'Yeni Hesap');
            await sibling.evaluate(() => localStorage.setItem('chat-session-change', String(Date.now())));
            await page.getByText('Yeni Hesap', { exact: true }).first().waitFor();
            releaseAccount(); await page.unrouteAll({ behavior: 'wait' });
            check('account change closes modal and discards late send', await page.getByRole('dialog').count() === 0);
            await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
            check('new account starts with empty search', await search.inputValue() === '' && await modal.getByRole('article').count() === 0);
            await search.fill(b.username); await person(b).getByRole('button', { name: 'Arkadaş ekle' }).waitFor();
            check('old outgoing status does not leak to new account', true);
            await sibling.close();
        }
        await own.close(); await peer.close(); await other.close(); await server.stop(); server = null;
        check(`${device}: no browser errors`, errors.length === 0);
    }
    console.log(`PASS new-chat UI: ${checks} checks`);
} catch (error) {
    if (lastPage && !lastPage.isClosed()) {
        console.log(await lastPage.locator('body').innerText());
        await lastPage.screenshot({ path: 'test-results/new-chat-failure.png' });
    }
    throw error;
} finally { await browser?.close(); await server?.stop(); }
