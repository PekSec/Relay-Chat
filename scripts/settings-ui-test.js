import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';
import { ACCENTS } from '../frontend/src/utils/preferences.js';

const server = await startTestServer({ defaultPort: 5012, production: true });
let browser;
let checks = 0;
let activePage;
const check = (name, value) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const contrastEvidence = [];
const luminance = rgb => rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
    const [lo, hi] = [luminance(a), luminance(b)].sort((a, b) => a - b);
    return (hi + 0.05) / (lo + 0.05);
};
async function api(context, path, method = 'GET', data) {
    const res = await context.request.fetch(`${server.base}/api${path}`, { method, data });
    assert.ok(res.ok(), `${path}: ${res.status()} ${await res.text()}`);
    return res.json();
}
async function signup(context, name) {
    return (await api(context, '/auth/signup', 'POST', {
        fullName: name, username: `prefs_${randomBytes(5).toString('hex')}`,
        gender: 'male', password: 'Preferences-2026!', confirmPassword: 'Preferences-2026!',
    })).user;
}
async function choose(page, label, value) {
    await page.getByRole('combobox', { name: label, exact: true }).focus();
    await page.getByRole('combobox', { name: label, exact: true }).press('ArrowDown');
    await page.getByRole('option', { name: value, exact: true }).click();
}
async function section(page, label, mobile) {
    if (mobile) await choose(page, 'Ayarlar bölümü', label);
    else await page.getByRole('navigation', { name: 'Ayarlar bölümleri' }).getByRole('button', { name: label, exact: true }).click();
}
async function toggle(page, label, checked) {
    const input = page.getByLabel(label, { exact: true });
    if (await input.isChecked() !== checked) await page.getByText(label, { exact: true }).click();
    assert.equal(await input.isChecked(), checked);
}
try {
    browser = await chromium.launch();
    await mkdir('test-results', { recursive: true });
    for (const [name, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const mobile = name === 'mobile';
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const user = await signup(context, 'Ayarlar Testi');
        const page = await context.newPage();
        // Observe the real sound-call boundary without requiring browser autoplay permission.
        await page.addInitScript(() => {
            window.playedSounds = [];
            window.Audio = class { constructor(src) { this.src = src; } play() { window.playedSounds.push(this.src); return Promise.resolve(); } };
        });
        activePage = page;
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(server.base);
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Görünüm', mobile);
        if (!mobile) {
            for (const [mode, label] of [['light', 'Açık'], ['dark', 'Koyu']]) {
                await choose(page, 'Tema', label);
                await page.waitForFunction(mode => document.documentElement.dataset.colorMode === mode, mode);
                for (const [accent, label] of ACCENTS) {
                    await page.getByRole('button', { name: label, exact: true }).click();
                    const button = page.getByRole('button', { name: 'Örnek buton', exact: true });
                    const values = [];
                    for (const state of ['normal', 'hover', 'pressed']) {
                        if (state === 'normal') await page.mouse.move(0, 0);
                        if (state === 'hover') await button.hover();
                        if (state === 'pressed') await page.mouse.down();
                        const colors = await button.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, text: getComputedStyle(el).color }));
                        values.push(contrast(colors.bg, colors.text));
                    }
                    await page.mouse.up();
                    const colors = await page.locator('.settings-preview').evaluate(el => {
                        const link = el.querySelector('a');
                        const selected = el.querySelector('.settings-preview-message');
                        return {
                            bg: getComputedStyle(el).backgroundColor, link: getComputedStyle(link).color,
                            selectedBg: getComputedStyle(selected).backgroundColor, selectedText: getComputedStyle(selected).color,
                        };
                    });
                    values.push(contrast(colors.bg, colors.link), contrast(colors.selectedBg, colors.selectedText));
                    contrastEvidence.push({ mode, accent, normal: values[0], hover: values[1], pressed: values[2], link: values[3], selected: values[4] });
                    check(`${mode}/${accent}: button, link and selection contrast >= 4.5`, values.every(value => value >= 4.5));
                    const link = page.getByRole('link', { name: 'Görünümü ayarla' });
                    await link.focus();
                    const focus = await link.evaluate(el => ({ color: getComputedStyle(el).outlineColor, width: getComputedStyle(el).outlineWidth }));
                    check(`${mode}/${accent}: visible accent focus`, parseFloat(focus.width) >= 2 && contrast(focus.color, colors.bg) >= 3);
                }
            }
        }
        await choose(page, 'Tema', 'Koyu');
        await page.getByRole('button', { name: 'İris', exact: true }).click();
        await page.waitForFunction(() => document.documentElement.dataset.colorMode === 'dark' && document.documentElement.dataset.accent === 'relay-iris');
        check(`${name}: preview does not persist`, (await api(context, '/auth/me')).user.preferences.accent === 'blue');
        await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'blue');
        check(`${name}: cancel restores focus`, await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).evaluate(el => el === document.activeElement));
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Görünüm', mobile);
        await choose(page, 'Tema', 'Koyu');
        await page.getByRole('button', { name: 'İris', exact: true }).click();
        await choose(page, 'Yoğunluk', 'Kompakt');
        await choose(page, 'Yazı boyutu', 'Büyük');
        await page.route('**/api/auth/preferences', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Test: kayıt başarısız"}' }));
        await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Test: kayıt başarısız' }).waitFor();
        check(`${name}: failed save keeps draft`, await page.getByRole('button', { name: 'İris', exact: true }).getAttribute('aria-pressed') === 'true');
        await page.unroute('**/api/auth/preferences');
        await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Tercihler kaydedildi' }).first().waitFor();
        check(`${name}: account persisted`, (await api(context, '/auth/me')).user.preferences.accent === 'relay-iris');
        await page.screenshot({ path: `test-results/settings-${name}.png` });
        check(`${name}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'relay-iris');
        check(`${name}: reload retains density and font`, await page.evaluate(() => document.documentElement.dataset.density === 'compact' && document.documentElement.dataset.fontSize === 'large'));
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Görünüm', mobile);
        await page.getByRole('button', { name: 'Bakır', exact: true }).click();
        for (let index = 0; index < 25; index++) {
            await page.keyboard.press('Tab');
            assert.ok(await page.getByRole('dialog').evaluate(el => el.contains(document.activeElement)), 'focus remains in modal');
        }
        check(`${name}: keyboard focus stays in modal`, true);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'relay-iris');
        check(`${name}: Escape discards preview`, true);
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Görünüm', mobile);
        await choose(page, 'Tema', 'Açık');
        await choose(page, 'Tema', 'Sistem');
        await choose(page, 'Tema', 'Açık');
        await page.getByRole('button', { name: 'Kapat', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.documentElement.dataset.colorMode === 'dark');
        check(`${name}: rapid theme preview and close restore saved theme`, true);
        if (!mobile) {
            await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
            await section(page, 'Görünüm', false);
            await page.getByRole('button', { name: 'Çam', exact: true }).click();
            await page.mouse.click(10, 10);
            await page.getByRole('dialog').waitFor({ state: 'hidden' });
            check('desktop: overlay discards preview', await page.locator('html').getAttribute('data-accent') === 'relay-iris');
        }
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Mesaj ve ses', mobile);
        await choose(page, 'Mesaj gönderme', 'Ctrl / ⌘ + Enter');
        for (const label of ['Sohbet içi ses', 'Bildirim sesi', 'Mesaj önizlemeleri']) await toggle(page, label, false);
        await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Tercihler kaydedildi' }).first().waitFor();
        await page.keyboard.press('Escape');
        const peerContext = await browser.newContext();
        const peer = await signup(peerContext, 'Sohbet Arkadaşı');
        await api(context, '/messages/send/' + peer._id, 'POST', { message: 'Sohbet başlangıcı' });
        await api(peerContext, '/messages/send/' + user._id, 'POST', { message: 'Gizlenecek önizleme' });
        await page.reload();
        const conversation = page.locator('.conversation-row').filter({ hasText: peer.fullName });
        await conversation.waitFor();
        check(`${name}: previews hide content`, !(await conversation.innerText()).includes('Gizlenecek önizleme'));
        check(`${name}: density changes row spacing`, await conversation.evaluate(el => getComputedStyle(el).paddingTop) === '8px');
        await conversation.click();
        await page.getByText('Gizlenecek önizleme', { exact: true }).waitFor();
        check(`${name}: large text reaches messages`, await page.locator('.bubble').last().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) > 14);
        const composer = page.getByRole('textbox', { name: 'Mesaj', exact: true });
        await composer.fill('Kontrollü gönderim');
        await composer.press('Enter');
        check(`${name}: plain Enter adds a line in modifier mode`, await composer.inputValue() === 'Kontrollü gönderim\n');
        await composer.press('Shift+Enter');
        check(`${name}: Shift+Enter adds a line`, await composer.inputValue() === 'Kontrollü gönderim\n\n');
        await composer.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', ctrlKey: true, isComposing: true });
        check(`${name}: IME does not submit`, await composer.inputValue() !== '');
        await composer.press('Control+Enter');
        await page.getByText('Kontrollü gönderim', { exact: true }).last().waitFor();
        await page.waitForFunction(() => document.querySelector('textarea[aria-label="Mesaj"]')?.value === '');
        check(`${name}: Ctrl+Enter sends`, await composer.inputValue() === '');
        await composer.fill('Mac gönderimi');
        await composer.press('Meta+Enter');
        await page.getByText('Mac gönderimi', { exact: true }).last().waitFor();
        await page.waitForFunction(() => document.querySelector('textarea[aria-label="Mesaj"]')?.value === '');
        check(`${name}: Cmd+Enter sends`, await composer.inputValue() === '');
        await api(peerContext, '/messages/send/' + user._id, 'POST', { message: 'Sessiz açık sohbet' });
        await page.getByText('Sessiz açık sohbet', { exact: true }).last().waitFor();
        check(`${name}: chat sound off`, await page.evaluate(() => window.playedSounds.length) === 0);
        if (mobile) await page.getByTitle('Geri', { exact: true }).click();
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Mesaj ve ses', mobile);
        await choose(page, 'Mesaj gönderme', 'Enter');
        await toggle(page, 'Sohbet içi ses', true);
        await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Tercihler kaydedildi' }).first().waitFor();
        await page.keyboard.press('Escape');
        if (mobile) await conversation.click();
        await composer.fill('Enter gönderimi');
        await composer.press('Enter');
        await page.getByText('Enter gönderimi', { exact: true }).last().waitFor();
        await api(peerContext, '/messages/send/' + user._id, 'POST', { message: 'Sesli açık sohbet' });
        await page.waitForFunction(() => window.playedSounds.includes('/message.mp3'));
        check(`${name}: enabled chat sound plays`, true);
        await page.reload();
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).waitFor();
        await api(peerContext, '/messages/send/' + user._id, 'POST', { message: 'Sessiz bildirim' });
        await page.waitForFunction(() => document.querySelector('.conversation-row')?.textContent.includes('Sohbet Arkadaşı'));
        // An HTTP read orders this assertion after persistence; wait for realtime unread delivery too.
        await page.locator('.conversation-row').filter({ hasText: peer.fullName }).getByText('1', { exact: true }).waitFor();
        check(`${name}: notification sound off`, await page.evaluate(() => window.playedSounds.length) === 0);
        await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
        await section(page, 'Mesaj ve ses', mobile);
        await toggle(page, 'Bildirim sesi', true);
        await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Tercihler kaydedildi' }).first().waitFor();
        await page.keyboard.press('Escape');
        await api(peerContext, '/messages/send/' + user._id, 'POST', { message: 'Sesli bildirim' });
        await page.waitForFunction(() => window.playedSounds.includes('/notification.mp3'));
        check(`${name}: enabled notification sound plays`, true);
        await peerContext.close();
        await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
        await page.waitForURL('**/login');
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'blue');
        check(`${name}: logout restores guest defaults`, await page.locator('html').getAttribute('data-font-size') === 'standard');
        await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('dark');
        await signup(context, 'Diğer Hesap');
        await page.goto(server.base);
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'blue');
        check(`${name}: new account has its own defaults`, (await api(context, '/auth/me')).user.preferences.sendKey === 'enter');
        if (!mobile) {
            await page.getByRole('button', { name: 'Hesap ayarları', exact: true }).click();
            await section(page, 'Görünüm', false);
            await page.getByRole('button', { name: 'Bakır', exact: true }).click();
            let releaseSave;
            let observedSave;
            const released = new Promise(resolve => { releaseSave = resolve; });
            const persisted = new Promise(resolve => { observedSave = resolve; });
            await page.route('**/api/auth/preferences', async route => {
                const response = await route.fetch();
                observedSave();
                await released;
                await route.fulfill({ response });
            });
            try {
                await page.getByRole('button', { name: 'Tercihleri kaydet', exact: true }).click();
                await persisted;
                await api(context, '/auth/logout', 'POST');
                const nextUser = await signup(context, 'Üçüncü Hesap');
                const otherTab = await context.newPage();
                await otherTab.goto(server.base);
                await otherTab.evaluate(() => localStorage.setItem('chat-session-change', String(Date.now())));
                await page.getByText('Üçüncü Hesap', { exact: true }).first().waitFor();
                releaseSave();
                await page.waitForFunction(() => document.documentElement.dataset.accent === 'blue');
                check('late preference save cannot overwrite a different account', (await api(context, '/auth/me')).user._id === nextUser._id);
                await otherTab.close();
            } finally {
                releaseSave();
                await page.unrouteAll({ behavior: 'wait' });
            }
        }
        check(`${name}: no browser errors`, errors.length === 0);
        await context.close();
    }
    console.log(`${checks} settings checks passed`);
    await writeFile('test-results/settings-contrast.json', JSON.stringify(contrastEvidence, null, 2));
} catch (error) {
    if (activePage && !activePage.isClosed()) {
        await activePage.screenshot({ path: 'test-results/settings-failure.png' });
        console.error((await activePage.locator('body').innerText()).slice(0, 5000));
    }
    throw error;
} finally {
    await browser?.close();
    await server.stop();
}
