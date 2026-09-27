import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5029, production: true });
let browser; let checks = 0;
const check = (label, value) => { assert.ok(value, label); checks++; console.log(`PASS ${label}`); };
const visible = locator => locator.waitFor({ state: 'visible' });
async function api(context, path, method = 'GET', data) {
    const response = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(response.ok(), `${path}: ${response.status()}`); return response.json();
}
async function signup(context, fullName) {
    return (await api(context, '/auth/signup', 'POST', { fullName, username: `emo_${randomBytes(5).toString('hex')}`,
        password: 'Emoji-test-2026!', confirmPassword: 'Emoji-test-2026!', gender: 'female' })).user;
}
try {
    browser = await chromium.launch(); await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const a = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const b = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const sender = await signup(a, 'Gönderen'); const receiver = await signup(b, 'Alıcı');
        await api(a, `/messages/send/${receiver._id}`, 'POST', { message: 'Tepki hedefi' });
        await api(b, `/messages/send/${sender._id}`, 'POST', { message: 'Yanıt' });
        const page = await a.newPage(); const tab = await a.newPage(); const peer = await b.newPage();
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        const emojiRequests = [];
        page.on('request', request => {
            if (request.url().includes('/emoji/') || request.url().includes('emojibase')) emojiRequests.push(request.url());
        });
        for (const p of [page, tab, peer]) p.setDefaultTimeout(7000);
        for (const p of [page, tab]) { await p.goto(server.base); await p.getByText('Alıcı', { exact: true }).first().click(); }
        await peer.goto(server.base); await peer.getByText('Gönderen', { exact: true }).first().click();
        const trigger = page.getByRole('button', { name: 'Emoji ekle', exact: true });
        const dialog = page.getByRole('dialog', { name: 'Emoji ekle', exact: true });
        const input = page.getByRole('textbox', { name: 'Mesaj', exact: true });
        const open = async () => { await trigger.click(); await visible(dialog); await visible(dialog.getByRole('searchbox', { name: 'Emoji ara' })); };
        check(`${device}: emoji data loads on demand`, emojiRequests.length === 0);
        await input.fill('Korunan taslak');
        await page.route('**/emoji/17.0.0/en/data.json', route => route.abort('internetdisconnected'));
        await open();
        await visible(dialog.getByText('Emojiler yüklenemedi.', { exact: true }));
        check(`${device}: data failure preserves draft`, await input.inputValue() === 'Korunan taslak');
        await page.unroute('**/emoji/17.0.0/en/data.json');
        await dialog.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
        await visible(dialog.getByTitle('😀', { exact: true }));
        check(`${device}: data retry succeeds`, true);
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
        await input.fill('');
        await open();
        for (const theme of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: theme });
            await page.waitForFunction(theme => document.documentElement.dataset.colorMode === theme, theme);
            await visible(dialog.getByTitle('😀', { exact: true }));
            await page.screenshot({ path: `test-results/emoji-${device}-${theme}.png`, fullPage: true, animations: 'disabled' });
        }
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Emoji ara');
        await dialog.getByRole('searchbox').fill('rocket');
        await visible(dialog.getByTitle('🚀', { exact: true }));
        check(`${device}: full catalog English search`, true);
        await dialog.getByRole('searchbox').fill('red heart');
        await visible(dialog.getByTitle('❤️', { exact: true }));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter'); await dialog.waitFor({ state: 'hidden' });
        assert.equal(await input.inputValue(), '❤️', `${device}: filtered keyboard selection`);
        check(`${device}: filtered keyboard selection`, true);
        await open();
        await dialog.getByRole('searchbox').fill('thumbs up');
        await dialog.getByRole('button', { name: /Ten rengini değiştir/ }).click();
        await dialog.getByTitle('👍🏻', { exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
        check(`${device}: skin tone inserts complete Unicode`, await input.inputValue() === '❤️👍🏻');
        await open();
        await dialog.getByRole('searchbox').fill('bulunamayan'); await visible(dialog.getByText('Emoji bulunamadı.'));
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(el => el === document.activeElement, await trigger.elementHandle());
        check(`${device}: escape restores trigger focus`, true);
        if (device === 'desktop') { await open(); await page.mouse.click(2, 2); await dialog.waitFor({ state: 'hidden' }); }
        else { await open(); await dialog.getByRole('button', { name: 'Vazgeç' }).click(); await dialog.waitFor({ state: 'hidden' }); }
        await input.fill('ab'); await input.evaluate(el => el.setSelectionRange(1, 1));
        await open(); await dialog.getByTitle('😀', { exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement?.tagName === 'TEXTAREA');
        check(`${device}: insert at caret and restore focus`, await input.inputValue() === 'a😀b' && await input.evaluate(el => el.selectionStart) === 3);
        const choose = async (panel, query, emoji) => {
            await panel.getByRole('searchbox', { name: 'Emoji ara' }).fill(query);
            await panel.getByTitle(emoji, { exact: true }).click();
        };
        await input.evaluate(el => el.setSelectionRange(1, 3)); await open(); await choose(dialog, 'red heart', '❤️');
        await dialog.waitFor({ state: 'hidden' }); check(`${device}: replace selection`, await input.inputValue() === 'a❤️b');
        await input.fill('x'.repeat(1999)); await open(); await dialog.getByTitle('😀', { exact: true }).click();
        await visible(dialog.getByRole('alert')); check(`${device}: length limit preserves draft and picker`, await input.inputValue() === 'x'.repeat(1999));
        for (const theme of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: theme });
            await page.waitForFunction(theme => document.documentElement.dataset.colorMode === theme, theme);
            await page.screenshot({ path: `test-results/emoji-limit-${device}-${theme}.png`, fullPage: true, animations: 'disabled' });
            check(`${device}: ${theme} fits viewport`, await dialog.evaluate(el => el.getBoundingClientRect().width <= innerWidth));
            check(`${device}: ${theme} inherits theme surface`, await dialog.locator('.emoji-panel').evaluate(el => {
                // Mobile uses the modal surface; the nested panel no longer paints a second card.
                const surface = el.closest('[data-testid="relay-modal-emoji"]') || el;
                const probe = document.createElement('span');
                probe.style.background = surface === el ? 'var(--bg-elevated)' : 'var(--ds-surface-overlay)'; el.append(probe);
                const matches = getComputedStyle(surface).backgroundColor === getComputedStyle(probe).backgroundColor;
                probe.remove(); return matches;
            }));
        }
        await page.evaluate(() => { document.documentElement.dataset.fontSize = 'large'; });
        check(`${device}: large text stays inside viewport`, await dialog.locator('[frimousse-viewport]').evaluate(el => el.getBoundingClientRect().right <= innerWidth));
        if (device === 'mobile') {
            await page.setViewportSize({ width: 320, height: 568 });
            check('mobile: narrow viewport retains 44px targets without overflow', await dialog.locator('[frimousse-viewport]').evaluate(el => {
                const buttons = [...el.querySelectorAll('[frimousse-emoji]')].filter(button => button.getBoundingClientRect().width > 0);
                return el.scrollWidth <= el.clientWidth && buttons.every(button => {
                    const bounds = button.getBoundingClientRect();
                    return bounds.width >= 44 && bounds.height >= 44;
                });
            }));
            await page.setViewportSize({ width, height });
        }
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
        await input.fill('a👩🏽‍💻b'); await input.evaluate(el => el.setSelectionRange(3, 3)); await open();
        await choose(dialog, 'fire', '🔥'); await dialog.waitFor({ state: 'hidden' });
        check(`${device}: ZWJ remains intact`, await input.inputValue() === 'a👩🏽‍💻🔥b');
        await page.getByRole('button', { name: 'Gönder', exact: true }).click();
        await visible(peer.locator('.bubble').filter({ hasText: 'a👩🏽‍💻🔥b' }));
        check(`${device}: Unicode survives API and socket`, (await api(a, `/messages/${receiver._id}`)).some(m => m.message === 'a👩🏽‍💻🔥b'));
        const row = p => p.locator('.group').filter({ has: p.locator('.bubble').filter({ hasText: 'Tepki hedefi' }) });
        const reactionTrigger = row(page).getByRole('button', { name: 'Tepki ver', exact: true });
        const reaction = page.getByRole('dialog', { name: 'Tepki ver', exact: true });
        const openReaction = async () => { await row(page).locator('.bubble').click(); await reactionTrigger.click(); await visible(reaction); };
        await openReaction();
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Emoji ara');
        await reaction.getByRole('searchbox', { name: 'Emoji ara' }).fill('fire');
        await visible(reaction.getByTitle('🔥', { exact: true }));
        for (const theme of ['light', 'dark']) {
            await page.emulateMedia({ colorScheme: theme });
            await page.waitForFunction(theme => document.documentElement.dataset.colorMode === theme, theme);
            await page.screenshot({ path: `test-results/emoji-reaction-${device}-${theme}.png`, fullPage: true, animations: 'disabled' });
        }
        await page.keyboard.press('ArrowDown');
        await visible(reaction.locator('[frimousse-emoji][data-active]'));
        check(`${device}: full reaction catalog and keyboard navigation`, true);
        for (const [failure, text] of [[500, 'Tepki kaydedilemedi. Tekrar dene.'], [404, 'Bu mesaja tepki verilemiyor.'], ['offline', 'Bağlantı kurulamadı. Tekrar dene.']]) {
            await page.route('**/api/messages/react/*', route => failure === 'offline' ? route.abort('internetdisconnected') : route.fulfill({ status: failure, body: 'failure' }));
            await reaction.getByTitle('🔥', { exact: true }).click(); await visible(reaction.getByText(text, { exact: true }));
            check(`${device}: ${failure} retains picker for retry`, await reaction.isVisible());
            await page.unroute('**/api/messages/react/*');
        }
        let requests = 0; let release; const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/messages/react/*', async route => { requests++; await gate; await route.continue(); });
        await reaction.getByTitle('🔥', { exact: true }).evaluate(el => { el.click(); el.click(); });
        await visible(reaction.getByText('Tepki kaydediliyor', { exact: true })); await page.keyboard.press('Escape');
        check(`${device}: pending stays open`, await reaction.isVisible()); release(); await reaction.waitFor({ state: 'hidden' });
        check(`${device}: duplicate request blocked`, requests === 1); await page.unroute('**/api/messages/react/*');
        const badge = p => row(p).getByRole('button', { name: '🔥 tepkisi, 1 kişi', exact: true });
        await visible(badge(peer)); await visible(badge(tab));
        await page.waitForFunction(el => el === document.activeElement, await reactionTrigger.elementHandle());
        check(`${device}: both account rooms and focus updated`, await badge(page).getAttribute('aria-pressed') === 'true');
        await badge(page).click(); await badge(peer).waitFor({ state: 'hidden' }); await badge(tab).waitFor({ state: 'hidden' });
        check(`${device}: badge toggles reaction off across sessions`, true);
        await openReaction();
        await reaction.getByRole('searchbox').fill('thumbs up');
        await reaction.getByRole('button', { name: /Ten rengini değiştir/ }).click();
        await reaction.getByTitle('👍🏻', { exact: true }).click(); await reaction.waitFor({ state: 'hidden' });
        await visible(row(peer).getByRole('button', { name: '👍🏻 tepkisi, 1 kişi', exact: true }));
        await openReaction();
        await reaction.getByRole('searchbox').fill('thumbs up');
        await reaction.getByRole('button', { name: /Ten rengini değiştir/ }).click();
        check(`${device}: current skin tone reaction is selected`, await reaction.getByRole('gridcell', { name: 'Thumbs up', selected: true }).getAttribute('title') === '👍🏻');
        check(`${device}: reaction selection uses valid grid semantics`, await reaction.locator('[role="gridcell"][aria-pressed]').count() === 0);
        const selectedBackground = await reaction.getByTitle('👍🏻', { exact: true }).evaluate(el => getComputedStyle(el).backgroundColor);
        await page.evaluate(() => { document.documentElement.dataset.accent = 'red'; });
        check(`${device}: open picker follows account accent`, await reaction.getByTitle('👍🏻', { exact: true }).evaluate((el, previous) => {
            const probe = document.createElement('span'); probe.style.background = 'var(--accent-soft)'; el.append(probe);
            const background = getComputedStyle(el).backgroundColor;
            const matches = background !== previous && background === getComputedStyle(probe).backgroundColor;
            probe.remove(); return matches;
        }, selectedBackground));
        await reaction.getByTitle('👍🏻', { exact: true }).click(); await reaction.waitFor({ state: 'hidden' });
        await row(peer).getByRole('button', { name: '👍🏻 tepkisi, 1 kişi', exact: true }).waitFor({ state: 'hidden' });
        check(`${device}: picker toggles skin tone reaction across sessions`, true);
        await openReaction(); await choose(reaction, 'red heart', '❤️'); await reaction.waitFor({ state: 'hidden' });
        await openReaction(); await choose(reaction, 'tears of joy', '😂'); await reaction.waitFor({ state: 'hidden' });
        check(`${device}: changing reaction replaces previous`, await row(page).getByRole('button', { name: '❤️ tepkisi, 1 kişi' }).count() === 0);
        await openReaction();
        const target = (await api(a, `/messages/${receiver._id}`)).find(m => m.message === 'Tepki hedefi');
        await api(a, `/messages/${target._id}`, 'DELETE'); await reaction.waitFor({ state: 'hidden' });
        check(`${device}: deletion removes open selector`, await page.getByText('Bu mesaj silindi', { exact: true }).isVisible());
        await open(); await page.getByTitle('Geri', { exact: true }).evaluate(el => el.click()); await dialog.waitFor({ state: 'hidden' });
        check(`${device}: leaving conversation removes selector`, true);
        check(`${device}: no runtime errors`, errors.length === 0);
        check(`${device}: emoji data stays same-origin under production CSP`, emojiRequests.length > 0 && emojiRequests.every(url => url.startsWith(`${server.base}/emoji/17.0.0/en/`)));
        await a.close(); await b.close();
    }
    console.log(`PASS ${checks} emoji UI checks`);
} finally { await browser?.close(); await server.stop(); }
