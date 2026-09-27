import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5027, production: true });
let browser;
let checks = 0;
const check = (name, value) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const visible = locator => locator.waitFor({ state: 'visible' });
async function api(context, path, method = 'GET', data) {
    const res = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(res.ok(), `${path}: ${res.status()}`); return res.json();
}
async function signup(context, fullName) {
    return (await api(context, '/auth/signup', 'POST', { fullName, username: `del_${randomBytes(5).toString('hex')}`,
        password: 'Delete-test-2026!', confirmPassword: 'Delete-test-2026!', gender: 'female' })).user;
}
try {
    browser = await chromium.launch();
    await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const a = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const b = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const sender = await signup(a, 'Gönderen'); const receiver = await signup(b, 'Alıcı');
        await api(a, `/messages/send/${receiver._id}`, 'POST', { message: 'İlk mesaj' });
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Yanıt' });
        const text = '👩🏽‍💻'.repeat(241);
        await api(a, `/messages/send/${receiver._id}`, 'POST', { message: text });
        const page = await a.newPage(); const peer = await b.newPage(); const tab = await a.newPage();
        page.setDefaultTimeout(7000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(server.base); await page.getByText('Alıcı', { exact: true }).first().click();
        await peer.goto(server.base); await peer.getByText('Gönderen', { exact: true }).first().click();
        await tab.goto(server.base); await tab.getByText('Alıcı', { exact: true }).first().click();
        const bubble = page.locator('.bubble').filter({ hasText: text });
        const trigger = page.getByRole('button', { name: 'Sil', exact: true }).last();
        const modal = page.getByRole('dialog', { name: 'Mesaj silinsin mi?' });
        async function open() { await bubble.click(); await trigger.click(); await visible(modal); }
        await open();
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Yeni gelen mesaj' });
        check(`${device}: list updates keep the captured preview`, await modal.locator('blockquote').textContent() === '👩🏽‍💻'.repeat(240) + '…');
        check(`${device}: preview truncates on grapheme boundary`, await modal.locator('blockquote').textContent() === '👩🏽‍💻'.repeat(240) + '…');
        await page.waitForFunction(() => document.activeElement?.textContent === 'Vazgeç');
        check(`${device}: safe initial focus`, true);
        await page.keyboard.press('Shift+Tab');
        check(`${device}: focus stays in dialog`, await modal.evaluate(el => el.contains(document.activeElement)));
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(el => document.activeElement === el, await trigger.elementHandle());
        check(`${device}: cancel restores trigger focus`, await bubble.isVisible());
        if (device === 'desktop') {
            await open(); await page.mouse.click(2, 2); await modal.waitFor({ state: 'hidden' });
            check(`${device}: overlay cancels`, true);
        }
        await open();
        await page.route('**/api/messages/*', route => route.request().method() === 'DELETE' ? route.fulfill({ status: 500, body: 'failure' }) : route.continue());
        await modal.getByRole('button', { name: 'Sil', exact: true }).click();
        await visible(modal.getByRole('alert'));
        check(`${device}: failure keeps target and dialog`, await bubble.isVisible() && await modal.locator('blockquote').isVisible());
        await page.unroute('**/api/messages/*');
        for (const [status, message] of [[403, 'Bu mesajı silme yetkin yok.'], [404, 'Mesaj bulunamadı.']]) {
            await page.route('**/api/messages/*', route => route.request().method() === 'DELETE' ? route.fulfill({ status }) : route.continue());
            await modal.getByRole('button', { name: 'Sil', exact: true }).click();
            await visible(modal.getByText(message, { exact: true }));
            check(`${device}: ${status} keeps dialog with specific error`, true);
            await page.unroute('**/api/messages/*');
        }
        await page.route('**/api/messages/*', route => route.request().method() === 'DELETE' ? route.abort('internetdisconnected') : route.continue());
        await modal.getByRole('button', { name: 'Sil', exact: true }).click();
        await visible(modal.getByText('Bağlantı kurulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: network failure allows retry`, true);
        await page.unroute('**/api/messages/*');
        for (const mode of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: mode });
            await page.waitForFunction(mode => document.documentElement.dataset.colorMode === mode, mode);
            await page.screenshot({ path: `test-results/delete-${device}-${mode}.png`, fullPage: true });
            check(`${device}: ${mode} fits viewport`, await modal.evaluate(el => el.getBoundingClientRect().width <= innerWidth));
        }
        await page.evaluate(() => { document.documentElement.dataset.fontSize = 'large'; });
        check(`${device}: large text keeps actions visible`, await modal.getByRole('button', { name: 'Sil', exact: true }).evaluate(el => {
            const rect = el.getBoundingClientRect(); return rect.bottom <= innerHeight && rect.right <= innerWidth;
        }));
        let requests = 0; let release;
        await tab.locator('.bubble').filter({ hasText: text }).click();
        await tab.getByTitle('Düzenle', { exact: true }).last().click();
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/messages/*', async route => {
            if (route.request().method() !== 'DELETE') return route.continue();
            requests++; await gate; await route.continue();
        });
        await modal.getByRole('button', { name: 'Sil', exact: true }).evaluate(el => { el.click(); el.click(); });
        await visible(modal.getByText('Siliniyor', { exact: true }));
        await page.keyboard.press('Escape');
        check(`${device}: in-flight action cannot close`, await modal.isVisible());
        release();
        await modal.waitFor({ state: 'hidden' });
        check(`${device}: only one delete request`, requests === 1);
        await visible(peer.locator('.bubble').filter({ hasText: 'Bu mesaj silindi' }));
        await visible(tab.locator('.bubble').filter({ hasText: 'Bu mesaj silindi' }));
        check(`${device}: receiver and sender second tab update`, true);
        await page.waitForFunction(() => document.activeElement?.textContent === 'Bu mesaj silindi');
        check(`${device}: successful delete focuses its row`, true);
        check(`${device}: deleting an older message preserves latest preview`, (await page.locator('.relay-sidebar').innerText()).includes('Yeni gelen mesaj'));
        await page.unroute('**/api/messages/*');
        await page.getByRole('textbox', { name: 'Mesaj', exact: true }).fill('Son mesajı sil');
        await page.getByRole('button', { name: 'Gönder', exact: true }).click();
        await visible(page.locator('.bubble').filter({ hasText: 'Son mesajı sil' }));
        await page.locator('.bubble').filter({ hasText: 'Son mesajı sil' }).click();
        await page.getByRole('button', { name: 'Sil', exact: true }).last().click();
        await modal.getByRole('button', { name: 'Sil', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.querySelector('.relay-sidebar').textContent.includes('Bu mesaj silindi'));
        await peer.waitForFunction(() => document.querySelector('.relay-sidebar').textContent.includes('Bu mesaj silindi'));
        check(`${device}: latest message previews update on both accounts`, true);
        await page.getByRole('textbox', { name: 'Mesaj', exact: true }).fill('Filtreli hedef');
        await page.getByRole('button', { name: 'Gönder', exact: true }).click();
        await page.getByTitle('Mesajlarda ara').click();
        await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).fill('Filtreli hedef');
        await page.locator('.bubble').filter({ hasText: 'Filtreli hedef' }).click();
        await page.getByRole('button', { name: 'Sil', exact: true }).last().click();
        // No socket delivery: prove HTTP-only success restores focus after the filtered row disappears.
        const filtered = (await api(a, `/messages/${receiver._id}`)).at(-1);
        await page.route(`**/api/messages/${filtered._id}`, route => route.fulfill({ status: 200, json: {
            deletedMessage: { ...filtered, isDeleted: true, message: 'This message was deleted' }
        } }));
        await modal.getByRole('button', { name: 'Sil', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Mesaj');
        check(`${device}: filtered deletion focuses composer without socket delivery`, true);
        await page.unroute(`**/api/messages/${filtered._id}`);
        await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).fill('');
        await page.locator('.bubble').filter({ hasText: 'İlk mesaj' }).click();
        await page.getByRole('button', { name: 'Sil', exact: true }).first().click();
        await visible(modal);
        let releaseLate;
        const lateGate = new Promise(resolve => { releaseLate = resolve; });
        const first = (await api(a, `/messages/${receiver._id}`))[0];
        await page.route(`**/api/messages/${first._id}`, async route => {
            await lateGate;
            await route.fulfill({ status: 200, json: { deletedMessage: { ...first, isDeleted: true } } });
        });
        await modal.getByRole('button', { name: 'Sil', exact: true }).click();
        await visible(modal.getByText('Siliniyor', { exact: true }));
        await page.getByTitle('Geri', { exact: true }).evaluate(el => el.click());
        await modal.waitFor({ state: 'hidden' });
        check(`${device}: conversation change dismisses captured target`, true);
        await page.getByText('Alıcı', { exact: true }).first().click();
        await page.locator('.bubble').filter({ hasText: 'İlk mesaj' }).click();
        await page.getByRole('button', { name: 'Sil', exact: true }).first().click();
        await visible(modal);
        releaseLate();
        await page.unrouteAll({ behavior: 'wait' });
        check(`${device}: aborted response cannot close the next dialog`, await modal.isVisible() && await modal.locator('blockquote').textContent() === 'İlk mesaj');
        await api(a, '/auth/logout', 'POST');
        await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'chat-session-change' })));
        await page.waitForURL('**/login');
        check(`${device}: account change dismisses dialog`, await page.getByRole('dialog').count() === 0);
        check(`${device}: no browser exceptions`, errors.length === 0);
        await a.close(); await b.close();
    }
    console.log(`${checks} delete dialog checks passed`);
} finally { await browser?.close(); await server.stop(); }
