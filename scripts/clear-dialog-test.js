import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5028, production: true });
let browser; let checks = 0;
const check = (label, value) => { assert.ok(value, label); checks++; console.log(`PASS ${label}`); };
const visible = locator => locator.waitFor({ state: 'visible' });
async function api(context, path, method = 'GET', data) {
    const response = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(response.ok(), `${path}: ${response.status()}`); return response.json();
}
async function signup(context, fullName) {
    return (await api(context, '/auth/signup', 'POST', { fullName, username: `clr_${randomBytes(5).toString('hex')}`,
        password: 'Clear-test-2026!', confirmPassword: 'Clear-test-2026!', gender: 'female' })).user;
}
try {
    browser = await chromium.launch(); await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const a = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const b = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const sender = await signup(a, 'Gönderen'); const receiver = await signup(b, 'Alıcı');
        await api(a, `/messages/send/${receiver._id}`, 'POST', { message: 'Eski mesaj' });
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Eski yanıt' });
        const page = await a.newPage(); const tab = await a.newPage(); const peer = await b.newPage();
        for (const p of [page, tab, peer]) p.setDefaultTimeout(7000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        page.on('dialog', dialog => dialog.dismiss());
        await page.goto(server.base); await page.getByText('Alıcı', { exact: true }).first().click();
        await tab.goto(server.base); await tab.getByText('Alıcı', { exact: true }).first().click();
        await peer.goto(server.base); await peer.getByText('Gönderen', { exact: true }).first().click();
        const trigger = page.getByRole('button', { name: 'Sohbeti temizle', exact: true });
        const modal = page.getByRole('dialog', { name: 'Sohbet geçmişi temizlensin mi?' });
        const open = async () => { await trigger.click(); await visible(modal); };
        await open();
        check(`${device}: captured person and scope`, await modal.getByText('Alıcı', { exact: true }).last().isVisible() &&
            (await modal.innerText()).includes('Karşı tarafın mesajları korunacak.'));
        await page.waitForFunction(() => document.activeElement?.textContent === 'Vazgeç');
        await page.keyboard.press('Shift+Tab');
        check(`${device}: safe focus and trap`, await modal.evaluate(el => el.contains(document.activeElement)));
        await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(el => document.activeElement === el, await trigger.elementHandle());
        check(`${device}: cancel returns focus without clearing`, await page.getByText('Eski mesaj', { exact: true }).isVisible());
        await open(); await modal.getByRole('button', { name: 'Vazgeç', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        if (device === 'desktop') {
            await open(); await page.mouse.click(2, 2); await modal.waitFor({ state: 'hidden' });
            check(`${device}: overlay cancels`, true);
        }
        await open();
        for (const [status, text] of [[500, 'Geçmiş temizlenemedi. Tekrar dene.'], [404, 'Sohbet bulunamadı.']]) {
            await page.route('**/api/messages/clear/*', route => route.fulfill({ status, body: 'failure' }));
            await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
            await visible(modal.getByText(text, { exact: true }));
            check(`${device}: ${status} preserves history and retry`, await page.getByText('Eski mesaj', { exact: true }).isVisible());
            await page.unroute('**/api/messages/clear/*');
        }
        await page.route('**/api/messages/clear/*', route => route.abort('internetdisconnected'));
        await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
        await visible(modal.getByText('Bağlantı kurulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: offline error stays inside modal`, true);
        await page.unroute('**/api/messages/clear/*');
        for (const theme of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: theme });
            await page.waitForFunction(theme => document.documentElement.dataset.colorMode === theme, theme);
            await page.screenshot({ path: `test-results/clear-${device}-${theme}.png`, fullPage: true });
            check(`${device}: ${theme} fits viewport`, await modal.evaluate(el => el.getBoundingClientRect().width <= innerWidth));
        }
        await page.evaluate(() => { document.documentElement.dataset.fontSize = 'large'; });
        check(`${device}: large text keeps actions reachable`, await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true })
            .evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
        let requests = 0; let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/messages/clear/*', async route => {
            requests++; await gate;
            const response = await route.fetch();
            await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Temizlemeden sonra' });
            await visible(page.getByText('Temizlemeden sonra', { exact: true }).last());
            await route.fulfill({ response });
        });
        await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).evaluate(el => { el.click(); el.click(); });
        await visible(modal.getByText('Temizleniyor', { exact: true })); await page.keyboard.press('Escape');
        check(`${device}: pending cannot close`, await modal.isVisible());
        release(); await modal.waitFor({ state: 'hidden' });
        check(`${device}: duplicate submit blocked`, requests === 1);
        await page.getByText('Eski mesaj', { exact: true }).waitFor({ state: 'hidden' });
        await tab.getByText('Eski mesaj', { exact: true }).waitFor({ state: 'hidden' });
        await visible(page.getByText('Temizlemeden sonra', { exact: true }).last());
        check(`${device}: own tabs clear and concurrent new message survives`, await peer.getByText('Eski mesaj', { exact: true }).isVisible());
        await page.waitForFunction(el => document.activeElement === el, await trigger.elementHandle());
        check(`${device}: success restores header focus`, true);
        await page.unroute('**/api/messages/clear/*');
        await page.reload(); await page.getByText('Alıcı', { exact: true }).first().click();
        await visible(page.getByText('Temizlemeden sonra', { exact: true }).last());
        check(`${device}: cleared history stays hidden after reload`, await page.getByText('Eski mesaj', { exact: true }).count() === 0);
        await page.getByTitle('Mesajlarda ara').click();
        await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).fill('Temizlemeden sonra');
        await open(); await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        await page.locator('.bubble').waitFor({ state: 'hidden' });
        check(`${device}: empty clear resets search and preview`, await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).count() === 0 &&
            !(await page.locator('.relay-sidebar').innerText()).includes('Temizlemeden sonra'));
        await open(); await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        check(`${device}: repeat clear succeeds`, true);
        await page.getByTitle('Geri', { exact: true }).evaluate(el => el.click());
        await tab.getByTitle('Geri', { exact: true }).evaluate(el => el.click());
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Sayaç öncesi' });
        let releaseCounts; let countsStarted;
        const countsGate = new Promise(resolve => { releaseCounts = resolve; });
        const countsRequest = new Promise(resolve => { countsStarted = resolve; });
        let countReads = 0;
        await tab.route('**/api/messages/unread/counts', async route => {
            if (++countReads > 1) return route.continue();
            countsStarted(); await countsGate;
            await route.fulfill({ json: {} });
        });
        await api(a, `/messages/clear/${receiver._id}`, 'DELETE');
        await countsRequest;
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Okunmamış yeni' });
        await visible(tab.getByText('Okunmamış yeni', { exact: true }));
        releaseCounts();
        await tab.waitForFunction(() => document.title.startsWith('(1)'));
        check(`${device}: delayed unread snapshot preserves new-message count`, countReads >= 2);
        await tab.unroute('**/api/messages/unread/counts');
        const c = await browser.newContext(); const requester = await signup(c, 'İstek gönderen');
        await api(c, `/messages/send/${sender._id}`, 'POST', { message: 'Bekleyen eski mesaj' });
        await page.getByRole('button', { name: /^İstekler/ }).click();
        await page.getByText('İstek gönderen', { exact: true }).click();
        await visible(page.getByText('Bekleyen eski mesaj', { exact: true }));
        await open(); await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        await page.getByText('Bekleyen eski mesaj', { exact: true }).waitFor({ state: 'hidden' });
        check(`${device}: clearing pending request preserves sender history`, (await api(c, `/messages/${sender._id}`)).length === 1);
        await page.getByTitle('Geri', { exact: true }).evaluate(el => el.click());
        await visible(page.getByText('Bekleyen mesaj isteği yok.', { exact: true }));
        await api(c, `/messages/send/${sender._id}`, 'POST', { message: 'Yeni istek mesajı' });
        await page.getByText('İstek gönderen', { exact: true }).click();
        await visible(page.getByText('Yeni istek mesajı', { exact: true }));
        check(`${device}: new pending message reappears without cleared history`, await page.getByText('Bekleyen eski mesaj', { exact: true }).count() === 0);
        const history = await api(a, `/messages/${requester._id}`);
        let releaseLate;
        const lateGate = new Promise(resolve => { releaseLate = resolve; });
        await page.route('**/api/messages/clear/*', async route => {
            await lateGate;
            await route.fulfill({ json: { clearedThrough: history.at(-1)._id, deletedCount: 1 } });
        });
        await open();
        await modal.getByRole('button', { name: 'Geçmişi temizle', exact: true }).click();
        await visible(modal.getByText('Temizleniyor', { exact: true }));
        await page.getByTitle('Geri', { exact: true }).evaluate(el => el.click());
        await modal.waitFor({ state: 'hidden' });
        check(`${device}: conversation change drops target`, true);
        await page.getByRole('button', { name: 'Sohbetler', exact: true }).click();
        await page.getByText('Alıcı', { exact: true }).first().click(); await open();
        releaseLate(); await page.unrouteAll({ behavior: 'wait' });
        check(`${device}: aborted response leaves next target intact`, await modal.isVisible() &&
            await modal.getByText('Alıcı', { exact: true }).last().isVisible());
        await api(a, '/auth/logout', 'POST');
        await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'chat-session-change' })));
        await page.waitForURL('**/login');
        check(`${device}: logout drops modal`, await page.getByRole('dialog').count() === 0);
        check(`${device}: no browser exceptions`, errors.length === 0);
        await a.close(); await b.close(); await c.close();
    }
    console.log(`${checks} clear dialog checks passed`);
} finally { await browser?.close(); await server.stop(); }
