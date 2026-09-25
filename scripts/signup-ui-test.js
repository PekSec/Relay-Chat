import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5020, production: true });
let browser;
let checks = 0;
const check = (name, value) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const visible = locator => locator.waitFor({ state: 'visible' });
try {
    browser = await chromium.launch();
    await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        const exceptions = [];
        page.on('pageerror', error => exceptions.push(error.message));
        await page.goto(`${server.base}/signup`);
        const field = name => page.getByRole('textbox', { name });
        const password = page.getByLabel(/^Parola\s*\*/);
        const repeat = page.getByLabel(/^Parola tekrar/);
        const submit = page.locator('button[type=submit]');
        await submit.click();
        await visible(page.getByText('Ad soyadını gir.', { exact: true }));
        check(`${device}: first invalid input has focus`, await field(/Ad soyad/).evaluate(el => el === document.activeElement));
        await field(/Ad soyad/).fill('   ');
        await submit.click();
        await visible(page.getByText('Ad soyadını gir.', { exact: true }));
        await field(/Ad soyad/).fill('Kayıt Testi');
        await field(/Kullanıcı adı/).fill('çağrı');
        await submit.click();
        await visible(page.getByText('3–20 karakter; yalnızca A–Z, a–z, rakam ve alt çizgi.', { exact: true }));
        const username = `ui_${randomBytes(6).toString('hex')}`;
        await field(/Kullanıcı adı/).fill(username);
        await password.fill('short');
        await submit.click();
        await visible(page.getByText('Parola en az 8 karakter olmalı.', { exact: true }));
        await password.fill('ş'.repeat(37));
        await submit.click();
        await visible(page.getByText('Parola çok uzun; daha az karakter kullan.', { exact: true }));
        await password.fill('Signup-test-2026!');
        await repeat.fill('Signup-test-2026!');
        await password.fill('Signup-changed-2026!');
        await repeat.focus();
        await repeat.press('Tab');
        await visible(page.getByText('Parolalar eşleşmiyor.', { exact: true }));
        check(`${device}: password edit revalidates confirmation`, true);
        await repeat.fill('Signup-changed-2026!');
        await page.getByRole('button', { name: 'Parolayı göster', exact: true }).click();
        check(`${device}: password is visible`, await password.getAttribute('type') === 'text');
        await page.getByRole('button', { name: 'Parolayı gizle', exact: true }).click();
        await page.getByRole('button', { name: 'Parola tekrarını göster', exact: true }).click();
        check(`${device}: confirmation is visible`, await repeat.getAttribute('type') === 'text');
        await page.getByRole('button', { name: 'Parola tekrarını gizle', exact: true }).click();
        await submit.click();
        await visible(page.getByText('Cinsiyet seç.', { exact: true }));
        check(`${device}: missing gender focuses its first radio`, await page.evaluate(() => document.activeElement.name === 'gender'));
        const male = page.getByRole('radio', { name: 'Erkek', exact: true });
        const female = page.getByRole('radio', { name: 'Kadın', exact: true });
        await male.focus();
        await male.press('Space');
        await male.press('ArrowDown');
        check(`${device}: gender supports keyboard single selection`, await female.isChecked() && !await male.isChecked());
        for (const [status, code, text] of [
            [400, 'USERNAME_TAKEN', 'Bu kullanıcı adı kullanılıyor.'],
            [429, '', 'Çok fazla kayıt denemesi. Bir süre sonra tekrar dene.'],
            [500, '', 'Hesap oluşturulamadı. Tekrar dene.'],
            [503, 'ACCOUNT_CREATED_LOGIN_REQUIRED', 'Hesap oluşturuldu. Oturum açılamadı; giriş yap.']
        ]) {
            await page.route('**/api/auth/signup', route => route.fulfill({ status, json: { code } }));
            await submit.click();
            await visible(page.getByText(text, { exact: true }));
            check(`${device}: ${status} ${code} preserves values`, await password.inputValue() === 'Signup-changed-2026!');
            await page.unroute('**/api/auth/signup');
            // Editing clears the server field error without changing the chosen username.
            await field(/Kullanıcı adı/).fill(username + 'x');
            await field(/Kullanıcı adı/).fill(username);
        }
        await page.route('**/api/auth/signup', route => route.abort('internetdisconnected'));
        await submit.click();
        await visible(page.getByText('Bağlantı kurulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: offline retry is available`, await submit.isEnabled());
        await page.unroute('**/api/auth/signup');
        let requests = 0;
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/auth/signup', async route => {
            requests++; await gate; await route.fulfill({ status: 500, body: 'upstream failure' });
        });
        await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
        await visible(page.getByText('Oluşturuluyor', { exact: true }));
        check(`${device}: pending submission disables button`, await submit.isDisabled());
        release();
        await visible(page.getByText('Hesap oluşturulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: double submit sends one request`, requests === 1);
        await page.unroute('**/api/auth/signup');
        for (const [label, mode] of [['Koyu', 'dark'], ['Açık', 'light']]) {
            const theme = page.getByRole('combobox', { name: 'Tema', exact: true });
            await theme.focus(); await theme.press('ArrowDown');
            await page.getByRole('option', { name: label, exact: true }).click();
            await page.waitForFunction(mode => document.documentElement.dataset.colorMode === mode, mode);
            check(`${device}: ${mode} no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await page.screenshot({ path: `test-results/signup-${device}-${mode}.png`, fullPage: true });
        }
        if (device === 'mobile') {
            await page.setViewportSize({ width: 320, height: 480 });
            await submit.scrollIntoViewIfNeeded();
            check('short mobile: submit reachable', await submit.isVisible() && await submit.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
            await field(/Ad soyad/).scrollIntoViewIfNeeded();
            check('short mobile: first field reachable', await field(/Ad soyad/).evaluate(el => el.getBoundingClientRect().top >= 0));
            await page.setViewportSize({ width, height });
        }
        await submit.click();
        await page.waitForURL(server.base + '/');
        const res = await context.request.get(`${server.base}/api/auth/me`);
        const { user } = await res.json();
        check(`${device}: successful signup persists default preferences`, user.username === username && user.preferences.theme === 'system' && user.preferences.accent === 'blue');
        await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
        await page.waitForURL('**/login');
        await page.goto(`${server.base}/signup`);
        await visible(page.getByRole('heading', { name: 'Hesap oluştur' }));
        await page.screenshot({ path: `test-results/signup-${device}.png`, fullPage: true });
        await field(/Ad soyad/).fill('Kayıt Testi');
        await field(/Kullanıcı adı/).fill(username);
        await password.fill('Signup-changed-2026!');
        await repeat.fill('Signup-changed-2026!');
        await page.getByRole('radio', { name: 'Kadın', exact: true }).check();
        await submit.click();
        await visible(page.getByText('Bu kullanıcı adı kullanılıyor.', { exact: true }));
        check(`${device}: real duplicate response focuses username`, await field(/Kullanıcı adı/).evaluate(el => el === document.activeElement));
        await page.getByRole('link', { name: 'Giriş yap', exact: true }).click();
        await page.waitForURL('**/login');
        check(`${device}: login link works and no browser errors`, exceptions.length === 0);
        await context.close();
    }
    console.log(`${checks} signup UI checks passed`);
} finally {
    await browser?.close();
    await server.stop();
}
