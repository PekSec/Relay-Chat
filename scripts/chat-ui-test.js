import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { MongoClient, ObjectId } from 'mongodb';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5030, production: true });
const mongo = new MongoClient(process.env.MONGO_URI);
let browser, page, checks = 0;
const check = (label, value) => { assert.ok(value, label); console.log(`PASS ${label}`); checks++; };
const visible = locator => locator.waitFor({ state: 'visible' });
async function api(context, path, method = 'GET', data) {
    const res = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(res.ok(), `${path}: ${res.status()} ${await res.text()}`); return res.json();
}
async function signup(context, fullName) {
    return (await api(context, '/auth/signup', 'POST', { fullName, username: `chat_${randomBytes(5).toString('hex')}`,
        password: 'Chat-test-2026!', confirmPassword: 'Chat-test-2026!', gender: 'female' })).user;
}
async function layout(page) {
    return page.evaluate(() => document.documentElement.scrollWidth <= innerWidth &&
        [...document.querySelectorAll('.bubble, .composer, .chat-header')].every(el => {
            const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1;
        }));
}
try {
    await mongo.connect();
    browser = await chromium.launch();
    await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const a = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        let transport;
        await a.routeWebSocket('**/socket.io/**', socket => { transport = socket; socket.connectToServer(); });
        const b = await browser.newContext();
        const c = await browser.newContext();
        const sender = await signup(a, 'Deniz Yılmaz');
        const receiver = await signup(b, 'Ece Demir');
        const other = await signup(c, 'Başka Sohbet');
        await api(a, `/messages/send/${receiver._id}`, 'POST', { message: 'İlk mesaj' });
        // Seed only the explicitly supplied disposable database; exercise pagination through HTTP/UI.
        const history = Array.from({ length: 65 }, (_, i) => ({ _id: new ObjectId(),
            senderId: new ObjectId(i % 2 ? sender._id : receiver._id),
            receiverId: new ObjectId(i % 2 ? receiver._id : sender._id),
            message: `Geçmiş mesaj ${String(i).padStart(2, '0')} — görüşme notları`, timestamp: new Date(),
            isRead: false, isEdited: false, isDeleted: false, reactions: [], reactionVersion: 0, clearedBy: [] }));
        await mongo.db().collection('messages').insertMany(history);
        await mongo.db().collection('conversations').updateOne({ participants: { $all: [new ObjectId(sender._id), new ObjectId(receiver._id)] } },
            { $set: { status: 'active' }, $push: { messages: { $each: history.map(m => m._id) } } });
        await api(a, `/messages/send/${other._id}`, 'POST', { message: 'Diğer görüşme' });
        page = await a.newPage(); page.setDefaultTimeout(8000);
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(server.base);
        await page.locator('.conversation-row').filter({ hasText: receiver.fullName }).click();
        await visible(page.locator('.bubble').last());
        check(`${device}: initial cursor page has 50 messages`, await page.locator('.bubble').count() === 50);
        const list = page.getByLabel('Mesaj geçmişi', { exact: true });
        await list.evaluate(el => { el.scrollTop = 0; });
        let olderCalls = 0; const cursors = [];
        await page.route(`**/api/messages/${receiver._id}?before=*`, async route => {
            cursors.push(new URL(route.request().url()).searchParams.get('before'));
            if (++olderCalls === 1) await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
            else await route.continue();
        });
        await page.getByRole('button', { name: 'Önceki mesajları yükle' }).click();
        await visible(page.getByRole('alert').filter({ hasText: 'Önceki mesajlar yüklenemedi' }));
        check(`${device}: older failure keeps loaded history`, await page.locator('.bubble').count() === 50);
        const anchor = page.locator('.bubble').first();
        const anchorText = await anchor.textContent();
        const beforeY = (await anchor.boundingBox()).y - (await list.boundingBox()).y;
        await page.getByRole('alert').getByRole('button', { name: 'Tekrar dene' }).click();
        await page.waitForFunction(() => document.querySelectorAll('.bubble').length === 66);
        check(`${device}: retry repeats the failed older cursor`, olderCalls === 2 && cursors[0] === cursors[1]);
        check(`${device}: prepend keeps reading position`, Math.abs((await page.locator('.bubble').filter({ hasText: anchorText }).boundingBox()).y - (await list.boundingBox()).y - beforeY) < 3);
        const scrollBefore = await list.evaluate(el => el.scrollTop);
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Okurken gelen mesaj' });
        await visible(page.locator('.bubble').filter({ hasText: 'Okurken gelen mesaj' }));
        check(`${device}: incoming message does not jump from history`, Math.abs(await list.evaluate(el => el.scrollTop) - scrollBefore) < 3);
        await page.getByRole('button', { name: 'Son mesaja git' }).click();

        // Lose the transport, change a page outside the newest 50, then reconnect.
        await a.setOffline(true); transport.close();
        await visible(page.getByText('Bağlantı yeniden kuruluyor…', { exact: false }));
        await mongo.db().collection('messages').updateOne({ _id: history[0]._id },
            { $set: { message: 'Çevrimdışıyken düzenlenen eski kayıt', isEdited: true, editedAt: new Date() } });
        await mongo.db().collection('messages').updateOne({ _id: history[2]._id },
            { $set: { message: 'Bu mesaj silindi', isDeleted: true } });
        await page.route(`**/api/messages/${receiver._id}?limit=50`, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await a.setOffline(false);
        await visible(page.getByRole('alert').filter({ hasText: 'Mesajlar yüklenemedi' }));
        check(`${device}: failed reconnect keeps all loaded messages`, await page.locator('.bubble').count() === 67);
        await page.unroute(`**/api/messages/${receiver._id}?limit=50`);
        await page.getByRole('alert').getByRole('button', { name: 'Tekrar dene' }).click();
        await visible(page.locator('.bubble').filter({ hasText: 'Çevrimdışıyken düzenlenen eski kayıt' }));
        check(`${device}: reconnect refreshes edits and deletions beyond newest 50`, await page.locator('.bubble').filter({ hasText: 'Bu mesaj silindi' }).count() === 1);

        const searchTrigger = page.getByRole('button', { name: 'Mesajlarda ara', exact: true });
        await searchTrigger.click();
        const search = page.getByRole('searchbox', { name: 'Bu sohbette ara' });
        await search.fill('olmayan sonuç');
        await visible(page.getByText('Bu aramayla eşleşen mesaj yok'));
        await search.press('Escape');
        check(`${device}: search Escape clears filter and restores focus`, await searchTrigger.evaluate(el => el === document.activeElement) && await page.locator('.bubble').count() === 67);

        const input = page.getByRole('textbox', { name: 'Mesaj', exact: true });
        await input.fill('İlk satır'); await input.press('Shift+Enter'); await input.press('a');
        await input.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })));
        check(`${device}: Shift+Enter and IME preserve draft`, await input.inputValue() === 'İlk satır\na');
        await page.route('**/api/messages/send/*', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await input.press('Enter');
        await visible(page.getByRole('alert').filter({ hasText: 'Mesaj gönderilemedi' }));
        check(`${device}: send error is inline and preserves multiline draft`, await input.inputValue() === 'İlk satır\na');
        await page.unroute('**/api/messages/send/*');
        await page.getByRole('button', { name: 'Gönder', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('textarea[aria-label="Mesaj"]').value === '');
        const sent = page.locator('.bubble').filter({ hasText: 'İlk satır' });
        await sent.hover(); await sent.click();
        await page.getByRole('button', { name: 'Düzenle', exact: true }).last().click();
        const edit = page.getByRole('textbox', { name: 'Mesajı düzenle', exact: true });
        await edit.fill('Düzenlenen'); await edit.press('Shift+Enter'); await edit.press('a');
        await edit.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })));
        check(`${device}: edit supports multiline, IME and 2000 limit`, await edit.inputValue() === 'Düzenlenen\na' && await edit.getAttribute('maxlength') === '2000');
        await page.route('**/api/messages/edit/*', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
        await edit.press('Enter');
        await visible(page.getByRole('alert').filter({ hasText: 'Mesaj düzenlenemedi' }));
        check(`${device}: edit failure keeps draft`, await edit.inputValue() === 'Düzenlenen\na');
        await page.unroute('**/api/messages/edit/*');
        await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
        await edit.waitFor({ state: 'hidden' });
        await visible(page.locator('.bubble').filter({ hasText: /^Düzenlenen\na$/ }));
        check(`${device}: edit updates sidebar preview`, await page.locator('.conversation-row').filter({ hasText: receiver.fullName }).textContent().then(t => t.includes('Düzenlenen')));

        let releaseSend, sentRequest;
        const sentPending = new Promise(resolve => { sentRequest = resolve; });
        const sendGate = new Promise(resolve => { releaseSend = resolve; });
        await page.route('**/api/messages/send/*', async route => {
            const response = await route.fetch(); sentRequest(); await sendGate; await route.fulfill({ response });
        });
        await input.fill('Geciken gönderim yanıtı'); await page.getByRole('button', { name: 'Gönder', exact: true }).click(); await sentPending;
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Daha yeni gelen mesaj' });
        await visible(page.locator('.bubble').filter({ hasText: 'Daha yeni gelen mesaj' }));
        releaseSend();
        await page.waitForFunction(() => document.querySelector('textarea[aria-label="Mesaj"]').value === '');
        check(`${device}: delayed send cannot roll back newer preview`, (await page.locator('.conversation-row').filter({ hasText: receiver.fullName }).textContent()).includes('Daha yeni gelen mesaj'));
        await page.unroute('**/api/messages/send/*');

        // A delayed response from the previous peer cannot populate the next chat.
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await page.locator('.conversation-row').filter({ hasText: other.fullName }).click();
        await visible(page.locator('.bubble').filter({ hasText: 'Diğer görüşme' }));
        let release, requested;
        const pending = new Promise(resolve => { requested = resolve; });
        const gate = new Promise(resolve => { release = resolve; });
        await page.route(`**/api/messages/${receiver._id}?limit=50`, async route => {
            const response = await route.fetch(); requested(); await gate;
            await route.fulfill({ response }).catch(() => {});
        });
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await page.locator('.conversation-row').filter({ hasText: receiver.fullName }).click(); await pending;
        if (device === 'mobile') await page.getByRole('button', { name: 'Geri', exact: true }).click();
        await page.locator('.conversation-row').filter({ hasText: other.fullName }).click(); release();
        await visible(page.locator('.bubble').filter({ hasText: 'Diğer görüşme' }));
        check(`${device}: late history does not leak across chat switch`, await page.locator('.bubble').count() === 1);
        await page.unroute(`**/api/messages/${receiver._id}?limit=50`);

        await api(a, '/auth/preferences', 'PATCH', { sendKey: 'mod-enter', accent: 'purple', fontSize: 'large', density: 'compact' });
        await page.reload(); await page.locator('.conversation-row').filter({ hasText: receiver.fullName }).click();
        await visible(page.locator('.bubble').last());
        await input.fill('Tercihli gönderim'); await input.press('Enter');
        check(`${device}: Mod+Enter preference keeps plain Enter multiline`, await input.inputValue() === 'Tercihli gönderim\n');
        await input.press('Control+Enter');
        await visible(page.locator('.bubble').filter({ hasText: 'Tercihli gönderim' }));
        await input.fill('Uzun satır\n'.repeat(30));
        check(`${device}: growing composer capped at 128px`, (await input.boundingBox()).height <= 129);
        await input.fill('');
        for (const theme of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: theme });
            await page.waitForFunction(t => document.documentElement.dataset.colorMode === t, theme);
            check(`${device} ${theme}: compact, purple, large text layout`, await layout(page));
            await page.screenshot({ path: `test-results/chat-${device}-${theme}-preferences.png`, animations: 'disabled' });
        }
        if (device === 'mobile') {
            await page.setViewportSize({ width: 320, height: 500 }); await input.focus();
            check('mobile: narrow keyboard-height viewport fits composer', await layout(page) && (await input.boundingBox()).y + (await input.boundingBox()).height <= 500);
        }
        const longName = 'Ece ' + 'Uzun'.repeat(11);
        await api(b, '/auth/profile', 'PUT', { fullName: longName });
        await page.reload(); await page.locator('.conversation-row').filter({ hasText: longName }).click();
        await visible(page.locator('.bubble').last());
        check(`${device}: long name fits header and notice`, await layout(page));
        await input.fill('x'.repeat(2000));
        await page.getByRole('button', { name: 'Gönder', exact: true }).click();
        await visible(page.locator('.bubble').filter({ hasText: /^x{2000}$/ }));
        check(`${device}: maximum unbroken message wraps without overflow`, await layout(page));
        check(`${device}: no browser errors`, errors.length === 0);
        await a.close(); await b.close(); await c.close();
    }
    console.log(`${checks} chat checks passed`);
} catch (error) {
    await page?.screenshot({ path: 'test-results/chat-failure.png' }).catch(() => {});
    console.error(error); process.exitCode = 1;
} finally { await browser?.close(); await mongo.close(); await server.stop(); }
