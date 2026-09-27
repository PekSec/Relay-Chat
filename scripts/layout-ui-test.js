import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const baseline = process.argv.includes('--baseline');
const screenshots = process.argv.includes('--screenshots');
const folder = screenshots ? 'docs/screenshots' : `test-results/layout-${baseline ? 'before' : 'after'}`;
const browser = await chromium.launch();
let server, checks = 0;
const check = (label, value) => { if (!baseline) assert.ok(value, label); checks++; console.log(`${value ? 'PASS' : 'FAIL'} ${label}`); };
try {
    await mkdir(folder, { recursive: true });
    for (const [width, height, theme, fontSize, density] of (screenshots ? [[1440, 960, 'dark', 'standard', 'comfortable'], [390, 844, 'light', 'standard', 'comfortable']] : [
        [320, 650, 'dark', 'large', 'compact'], [390, 844, 'light', 'standard', 'comfortable'],
        [768, 900, 'dark', 'standard', 'comfortable'], [1024, 600, 'light', 'large', 'compact'],
        [1440, 960, 'light', 'standard', 'comfortable'], [390, 480, 'dark', 'large', 'comfortable'],
    ])) {
        const filename = name => `${folder}/${screenshots ? `${name}-${theme}-${width < 768 ? 'mobile' : 'desktop'}` : `${width}x${height}-${name}`}.png`;
        server = await startTestServer({ defaultPort: 5035, production: true });
        const own = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const peer = await browser.newContext();
        const other = await browser.newContext();
        const outgoing = screenshots ? await browser.newContext() : null;
        const group = randomBytes(2).toString('hex');
        const api = async (ctx, path, data, method = 'POST') => {
            const response = await ctx.request.fetch(`${server.base}/api${path}`, { method, data });
            assert.ok(response.ok(), `${path}: ${response.status()}`); return response.json();
        };
        const signup = async (ctx, fullName) => (await api(ctx, '/auth/signup', { fullName,
            username: screenshots ? `${fullName.split(' ')[0].toLowerCase()}_${group}` : `layout_${randomBytes(4).toString('hex')}`, password: 'Layout-test-2026!', confirmPassword: 'Layout-test-2026!', gender: 'female' })).user;
        const a = await signup(own, 'Deniz Arslan');
        const b = await signup(peer, 'Ece Demir');
        await signup(other, 'Ada Zeynep Karahisarlıoğlu');
        if (outgoing) { const d = await signup(outgoing, 'Mert Yılmaz'); await api(own, `/friends/send/${d._id}`); }
        const request = await api(peer, `/friends/send/${a._id}`);
        await api(own, '/friends/respond', { requestId: request.friendRequest._id, response: 'accept' });
        await api(other, `/friends/send/${a._id}`);
        await api(other, `/messages/send/${a._id}`, { message: 'Merhaba Deniz!' });
        await api(own, `/messages/send/${b._id}`, { message: 'Yarın görüşmek üzere 👋' });
        await api(peer, `/messages/send/${a._id}`, { message: 'Görüşürüz, iyi akşamlar!' });
        await api(own, '/auth/preferences', { theme, fontSize, density, accent: 'relay-iris' }, 'PATCH');
        const page = await own.newPage(); page.setDefaultTimeout(8000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        const capture = async name => {
            await page.mouse.move(0, 0);
            await page.waitForTimeout(500);
            await page.screenshot({ path: filename(name) });
            if (!baseline) {
                const misaligned = await page.locator('button').evaluateAll(buttons => buttons.filter(button => {
                    const r = button.getBoundingClientRect();
                    return r.width && r.height && r.y >= 0 && r.bottom <= innerHeight && getComputedStyle(button).visibility !== 'hidden';
                }).flatMap(button => [...button.children].filter(child => child.tagName === 'SPAN' && parseFloat(getComputedStyle(child).fontSize) > 0 && getComputedStyle(child).position !== 'absolute').filter(child => {
                    const r = button.getBoundingClientRect(), c = child.getBoundingClientRect();
                    return c.height > 0 && Math.abs(c.y + c.height / 2 - r.y - r.height / 2) > 1;
                }).map(child => ({ text: child.textContent, button: button.getAttribute('aria-label') || button.textContent }))));
                check(`${width} ${name}: button text vertically centered ${JSON.stringify(misaligned)}`, misaligned.length === 0);
                const horizontal = await page.locator('.friend-actions button, .sidebar-preferences button, .settings-friend-code button, .settings-navigation button, .settings-swatches button, .sidebar-nav button, .sidebar-heading button, .new-chat-actions button, .settings-footer button, [data-testid$="--footer"] button').evaluateAll(buttons => buttons.filter(button => button.getBoundingClientRect().width > 0).every(button => {
                    const r = button.getBoundingClientRect(), slots = [...button.children].filter(child => child.tagName === 'SPAN' && getComputedStyle(child).position !== 'absolute');
                    if (!slots.length) return true;
                    if (button.closest('.settings-navigation, .settings-swatches')) {
                        const text = slots.at(-1), range = document.createRange(); range.selectNodeContents(text);
                        return Math.abs(range.getBoundingClientRect().x - text.getBoundingClientRect().x) <= 1;
                    }
                    const left = Math.min(...slots.map(slot => slot.getBoundingClientRect().x));
                    const right = Math.max(...slots.map(slot => slot.getBoundingClientRect().right));
                    return Math.abs((left + right) / 2 - r.x - r.width / 2) <= 1;
                }));
                check(`${width} ${name}: labels and icon groups horizontally aligned`, horizontal);
                check(`${width} ${name}: navigation badge stays beside its label`, await page.locator('.sidebar-nav .count-badge').evaluateAll(badges => badges.every(badge => {
                    const r = badge.getBoundingClientRect(), button = badge.closest('button').getBoundingClientRect();
                    return !r.width || Math.abs(r.y + r.height / 2 - button.y - button.height / 2) <= 2;
                })));
            }
            check(`${width}x${height} ${name}: no page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        };
        const modal = async (name, compact = false) => {
            const dialog = page.getByRole('dialog'); await dialog.waitFor(); await capture(name);
            const bounds = await dialog.boundingBox();
            if (name === 'new-chat') check(`${width}: search results retain bottom inset`, await dialog.locator('[data-testid$="--body"]').evaluate(el => el.getBoundingClientRect().bottom - el.lastElementChild.getBoundingClientRect().bottom >= (innerWidth < 768 ? 16 : 24)));
            check(`${width} ${name}: viewport gutters`, bounds.x >= 15 && bounds.y >= 15 && bounds.x + bounds.width <= width - 15 && bounds.y + bounds.height <= height - 15);
            check(`${width} ${name}: vertically centered`, Math.abs(bounds.y * 2 + bounds.height - height) <= 3);
            if (compact) check(`${width} ${name}: content sized`, bounds.height < Math.min(460, height - 31));
            if (!baseline) {
                const geometry = await dialog.evaluate(el => {
                    const header = el.querySelector('[data-testid$="--header"]'), body = el.querySelector('[data-testid$="--body"]'), footer = el.querySelector('[data-testid$="--footer"]');
                    const edge = node => node.getBoundingClientRect().left + parseFloat(getComputedStyle(node).paddingLeft);
                    return { aligned: Math.abs(edge(header) - edge(body)) < 1 && (!footer || Math.abs(edge(header) - edge(footer)) < 1),
                        targets: [...el.querySelectorAll('[data-testid$="--header"] button, [data-testid$="--footer"] button')].every(button => button.getBoundingClientRect().height >= (innerWidth < 768 ? 44 : 40)) };
                });
                check(`${width} ${name}: aligned header/body/footer`, geometry.aligned);
                check(`${width} ${name}: action target size`, geometry.targets);
            }
            await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
        };
        await page.goto(server.base); await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).waitFor();
        await capture('sidebar');
        if (!baseline) check(`${width}: shared sidebar gutter stays 16px with large text`, await page.locator('.relay-sidebar').evaluate(el => {
            const left = el.getBoundingClientRect().x;
            return ['.relay-brand', '.sidebar-heading', '.sidebar-search', '.sidebar-nav', '.sidebar-user', '.conversation-row'].every(selector => {
                const node = el.querySelector(selector); return Math.abs(node.getBoundingClientRect().x + parseFloat(getComputedStyle(node).paddingLeft) - left - 16) <= 1;
            });
        }));
        if (!baseline) check(`${width}: sidebar labels are not clipped`, await page.locator('.sidebar-nav button').evaluateAll(buttons => buttons.every(button => [...button.querySelectorAll('span')].every(span => span.scrollWidth <= span.clientWidth + 1))));
        await page.getByRole('button', { name: 'Yeni sohbet', exact: true }).click();
        if (screenshots) await capture('new-chat-empty');
        await page.getByRole('dialog').getByRole('searchbox').fill(screenshots ? group : b.username);
        await page.getByRole('dialog').getByRole('heading', { name: b.fullName, exact: true }).waitFor(); await modal('new-chat');
        await page.getByTitle('Bildirimler', { exact: true }).click();
        await page.getByRole('region', { name: 'Bildirimler', exact: true }).waitFor(); await capture('notifications');
        if (!baseline) check(`${width}: notifications has named dialog semantics`, await page.getByRole('dialog', { name: 'Bildirimler', exact: true }).isVisible() && await page.getByTitle('Bildirimler', { exact: true }).getAttribute('aria-haspopup') === 'dialog');
        check(`${width} notifications: fit viewport`, await page.locator('.notification-panel').evaluate(el => { const r = el.getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight; }));
        await page.keyboard.press('Escape');
        await page.getByRole('region', { name: 'Bildirimler', exact: true }).waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement === document.querySelector('button[title="Bildirimler"]'));
        check(`${width}: notifications restores trigger focus`, await page.getByTitle('Bildirimler', { exact: true }).evaluate(el => el === document.activeElement));
        await page.getByTitle('Hesap ayarları').click(); await modal('settings-profile');
        if (screenshots) {
            await page.getByTitle('Hesap ayarları').click();
            await page.locator('.settings-friend-code').scrollIntoViewIfNeeded(); await capture('settings-profile-details');
            await page.getByRole('button', { name: 'Kapat', exact: true }).click();
            for (const [label, name] of [['Güvenlik', 'settings-security'], ['Mesaj ve ses', 'settings-messaging']]) {
                await page.getByTitle('Hesap ayarları').click();
                if (width < 768) {
                    const select = page.getByRole('combobox', { name: 'Ayarlar bölümü', exact: true });
                    await select.focus(); await select.press('ArrowDown'); await page.getByRole('option', { name: label, exact: true }).click();
                } else await page.getByRole('button', { name: label, exact: true }).click();
                await capture(name); await page.getByRole('button', { name: 'Kapat', exact: true }).click();
            }
        }
        await page.getByTitle('Hesap ayarları').click();
        if (width < 768) {
            await page.locator('.settings-mobile-section').getByText('Profil', { exact: true }).click();
            await page.getByRole('option', { name: 'Görünüm', exact: true }).click();
        } else await page.getByRole('button', { name: 'Görünüm', exact: true }).click();
        await page.getByRole('group', { name: 'Temel renkler' }).waitFor();
        await capture('settings-appearance');
        await page.getByLabel('Tema', { exact: true }).focus(); await page.keyboard.press('ArrowDown');
        await page.getByRole('option', { name: 'Sistem', exact: true }).waitFor();
        await capture('settings-select');
        check(`${width}: select options fit viewport and are not covered`, await page.getByRole('listbox').evaluate(el => {
            const r = el.getBoundingClientRect();
            return r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight && [...el.querySelectorAll('[role="option"]')].every(option => {
                const box = option.getBoundingClientRect(); return option.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
            });
        }));
        await page.keyboard.press('Escape');
        check(`${width}: select escape keeps settings open`, await page.getByRole('dialog', { name: 'Hesap ayarları' }).isVisible());
        if (screenshots) { await page.locator('.settings-option-grid').scrollIntoViewIfNeeded(); await capture('settings-appearance-details'); }
        await page.getByRole('button', { name: 'Kapat', exact: true }).click();
        await page.getByRole('button', { name: 'Kişiler', exact: true }).click();
        await page.getByRole('article').filter({ hasText: b.fullName }).waitFor(); await capture('friends');
        await page.getByRole('button', { name: 'Çıkar', exact: true }).click(); await modal('remove-friend', true);
        if (screenshots) {
            for (const [label, name] of [['Gelen', 'friends-incoming'], ['Giden', 'friends-outgoing']]) {
                await page.getByRole('tab', { name: label, exact: true }).click(); await page.locator('.friend-row').waitFor(); await capture(name);
            }
        }
        await page.getByRole('button', { name: /^İstekler/ }).click(); await capture('requests');
        if (screenshots) {
            await page.locator('.person-card').click(); await page.getByRole('button', { name: 'Kabul et ve sohbet et', exact: true }).waitFor(); await capture('request-detail');
            if (width < 768) await page.getByRole('button', { name: 'Geri', exact: true }).click();
        }
        await page.getByRole('button', { name: 'Sohbetler', exact: true }).click();
        await page.locator('.conversation-row').filter({ hasText: b.fullName }).click();
        await page.locator('.bubble').first().waitFor(); await capture('chat');
        if (!baseline) check(`${width}: chat gutter stays 16px with large text`, await page.locator('.panel-chat .chat-gutter, .composer').evaluateAll(nodes => nodes.every(node => parseFloat(getComputedStyle(node).paddingLeft) === 16)));
        if (!baseline) check(`${width}: composer control sizes and field/help alignment`, await page.locator('.composer').evaluate(el => {
            const input = el.querySelector('textarea').getBoundingClientRect();
            const help = el.querySelector('.composer-help').getBoundingClientRect();
            return Math.abs(input.x - help.x) < 2 && Math.abs(input.right - help.right) < 2 && [...el.querySelectorAll('button')].every(button => button.getBoundingClientRect().height >= (innerWidth < 768 ? 44 : 40));
        }));
        await page.locator('.bubble-out').click(); await capture('message-actions');
        if (!baseline) check(`${width}: message actions stay inside chat`, await page.locator('.message-actions').first().evaluate(el => {
            const r = el.getBoundingClientRect(), chat = el.closest('.panel-chat').getBoundingClientRect(); return r.x >= chat.x && r.right <= chat.right;
        }));
        if (screenshots) {
            await page.getByRole('button', { name: 'Mesajlarda ara', exact: true }).click();
            await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).fill('görüş'); await capture('chat-search');
            await page.getByRole('searchbox', { name: 'Bu sohbette ara', exact: true }).press('Escape');
            await page.locator('.bubble-out').click(); await page.getByRole('button', { name: 'Düzenle', exact: true }).click();
            await page.getByRole('textbox', { name: 'Mesajı düzenle', exact: true }).waitFor(); await capture('message-edit');
            await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
        }
        await page.getByRole('button', { name: 'Sohbeti temizle', exact: true }).click(); await modal('clear-history', true);
        await page.locator('.bubble-out').click(); await page.getByRole('button', { name: 'Sil', exact: true }).click(); await modal('delete-message', true);
        await page.getByRole('button', { name: 'Emoji ekle', exact: true }).click();
        await page.locator('[frimousse-emoji]:visible').first().waitFor();
        if (width < 768) await modal('emoji');
        else { await capture('emoji'); await page.keyboard.press('Escape'); }
        await page.locator('.bubble-in').click(); await page.getByRole('button', { name: 'Tepki ver', exact: true }).last().click();
        await page.locator('[frimousse-emoji]:visible').first().waitFor(); await capture('reaction'); await page.keyboard.press('Escape');
        check(`${width}: no runtime errors`, errors.length === 0);
        const guest = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        await guest.addInitScript(value => localStorage.setItem('relay-theme', value), theme);
        const auth = await guest.newPage();
        for (const route of ['login', 'signup']) {
            await auth.goto(`${server.base}/${route}`); await auth.locator(`#${route}-title`).waitFor();
            await auth.waitForFunction(value => document.documentElement.dataset.colorMode === value, theme);
            await auth.screenshot({ path: filename(route) });
            await auth.locator('.auth-signup').scrollIntoViewIfNeeded();
            if (screenshots && route === 'signup') await auth.screenshot({ path: filename('signup-details') });
            check(`${width} ${route}: footer reachable`, await auth.locator('.auth-signup').evaluate(el => { const r = el.getBoundingClientRect(); return r.y >= 0 && r.bottom <= innerHeight; }));
            check(`${width} ${route}: no horizontal overflow`, await auth.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        }
        if (outgoing) await outgoing.close();
        await own.close(); await peer.close(); await other.close(); await guest.close(); await server.stop(); server = null;
    }
    console.log(`${checks} layout checks completed${baseline ? ' (baseline)' : ''}.`);
} finally { await browser.close(); if (server) await server.stop(); }
