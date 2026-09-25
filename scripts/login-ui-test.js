import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';
import { startTestServer } from './test-server.js';

const server = await startTestServer({ defaultPort: 5013, production: true });
const browser = await chromium.launch();
let checks = 0;
const check = (name, value) => { assert.ok(value, name); console.log(`PASS ${name}`); checks++; };
const visible = locator => locator.waitFor({ state: 'visible' });
try {
    await mkdir('test-results', { recursive: true });
    for (const [device, width, height] of [['desktop', 1440, 960], ['mobile', 390, 844]]) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        // Fault injection only at the HTTP boundary; the app and form run unchanged.
        let releaseSession;
        const sessionGate = new Promise(resolve => { releaseSession = resolve; });
        await page.route('**/api/auth/me', async route => {
            await sessionGate;
            await route.fulfill({ status: 503, json: {} });
        });
        await page.goto(`${server.base}/login`);
        await visible(page.getByText('Oturum kontrol ediliyor…', { exact: true }));
        check(`${device}: checking session never flashes the form`, await page.locator('form').count() === 0);
        releaseSession();
        await visible(page.getByText('Sunucuya şu anda ulaşılamıyor.', { exact: true }));
        check(`${device}: 503 does not show the login form`, await page.locator('input[name=username]').count() === 0);
        await page.unroute('**/api/auth/me');
        await page.route('**/api/auth/me', route => route.abort('internetdisconnected'));
        await page.getByRole('button', { name: 'Tekrar dene' }).click();
        await visible(page.getByText('Bağlantı kurulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: offline session check remains retryable`, await page.locator('form').count() === 0);
        await page.unroute('**/api/auth/me');
        await page.getByRole('button', { name: 'Tekrar dene' }).click();
        await visible(page.getByRole('heading', { name: 'Giriş yap' }));
        check(`${device}: 401 shows login after retry`, await page.locator('input[name=username]').isVisible());
        const submit = page.locator('button[type=submit]');
        await submit.click();
        await visible(page.getByText('Kullanıcı adını gir.', { exact: true }));
        await visible(page.getByText('Parolanı gir.', { exact: true }));
        check(`${device}: first invalid field is focused`, await page.locator('input[name=username]').evaluate(el => el === document.activeElement));
        const username = `login_${randomBytes(5).toString('hex')}`;
        const password = 'Login-test-2026!';
        await page.getByRole('textbox', { name: /Kullanıcı adı/ }).fill(username);
        await page.getByLabel(/^Parola/).fill(password);
        await page.getByRole('button', { name: 'Parolayı göster', exact: true }).click();
        check(`${device}: shows password`, await page.locator('input[name=password]').getAttribute('type') === 'text');
        await page.getByRole('button', { name: 'Parolayı gizle', exact: true }).click();
        check(`${device}: hides password`, await page.locator('input[name=password]').getAttribute('type') === 'password');
        await submit.click();
        await visible(page.getByRole('alert').getByText('Kullanıcı adı veya parola hatalı.', { exact: true }));
        check(`${device}: failed login preserves input`, await page.locator('input[name=password]').inputValue() === password);
        for (const [status, message] of [[429, 'Çok fazla giriş denemesi. Bir süre sonra tekrar dene.'], [500, 'Giriş yapılamadı. Tekrar dene.']]) {
            await page.route('**/api/auth/login', route => route.fulfill({ status, body: 'upstream failure' }));
            await submit.click();
            await visible(page.getByRole('alert').getByText(message, { exact: true }));
            check(`${device}: ${status} has a local error`, true);
            await page.unroute('**/api/auth/login');
        }
        await page.route('**/api/auth/login', route => route.abort('internetdisconnected'));
        await submit.click();
        await visible(page.getByRole('alert').getByText('Bağlantı kurulamadı. Tekrar dene.', { exact: true }));
        check(`${device}: offline login can retry`, await submit.isEnabled());
        await page.unroute('**/api/auth/login');
        let submissions = 0;
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/auth/login', async route => {
            submissions++;
            await gate;
            await route.fulfill({ status: 500, json: {} });
        });
        await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
        await visible(page.getByText('Giriş yapılıyor', { exact: true }));
        check(`${device}: submit disabled during request`, await submit.isDisabled());
        release();
        await visible(page.getByRole('alert').getByText('Giriş yapılamadı. Tekrar dene.', { exact: true }));
        check(`${device}: duplicate submit sends one request`, submissions === 1);
        await page.unroute('**/api/auth/login');

        for (const [theme, mode] of [['Koyu', 'dark'], ['Açık', 'light']]) {
            const select = page.getByRole('combobox', { name: 'Tema', exact: true });
            await select.focus();
            await select.press('ArrowDown');
            await page.getByRole('option', { name: theme, exact: true }).click();
            await page.waitForFunction(mode => document.documentElement.dataset.colorMode === mode, mode);
            await page.getByRole('textbox', { name: /Kullanıcı adı/ }).focus();
            check(`${device}: ${theme} keyboard focus`, await page.locator('input[name=username]').evaluate(el => el.matches(':focus-visible')));
            check(`${device}: ${theme} no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await page.screenshot({ path: `test-results/login-${device}-${mode}.png`, fullPage: true });
        }
        await page.reload();
        await visible(submit);
        check(`${device}: no product slogans or vendor names`, !/Atlassian|Atlaskit|ADS|Hoş geldin|senin renklerinle/i.test(await page.locator('body').innerText()));
        await page.screenshot({ path: `test-results/login-${device}.png`, fullPage: true });
        await page.getByRole('link', { name: 'Kayıt ol', exact: true }).click();
        await page.waitForURL('**/signup');
        await visible(page.getByRole('combobox', { name: 'Tema', exact: true }));
        check(`${device}: signup keeps guest theme`, await page.locator('html').getAttribute('data-color-mode') === 'light');
        await page.goto(`${server.base}/login`);
        await page.getByRole('textbox', { name: /Kullanıcı adı/ }).fill(username);
        await page.getByLabel(/^Parola/).fill(password);
        const signup = await context.request.post(`${server.base}/api/auth/signup`, { data: {
            username, password, confirmPassword: password, fullName: 'Giriş Testi', gender: 'male'
        } });
        assert.ok(signup.ok());
        await context.request.patch(`${server.base}/api/auth/preferences`, { data: { theme: 'dark', accent: 'relay-iris' } });
        await context.request.post(`${server.base}/api/auth/logout`);
        await page.getByLabel(/^Parola/).press('Enter');
        await page.waitForURL(server.base + '/');
        await page.waitForFunction(() => document.documentElement.dataset.accent === 'relay-iris');
        check(`${device}: successful login loads account preferences`, true);
        await page.reload();
        await visible(page.getByRole('button', { name: 'Sohbetler', exact: true }));
        check(`${device}: reload retains session`, true);
        if (device === 'desktop') {
            const otherTab = await context.newPage();
            await otherTab.goto(server.base);
            await visible(otherTab.getByRole('button', { name: 'Sohbetler', exact: true }));
            await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
            await otherTab.waitForURL('**/login');
            check('tabs: logout is reflected in the other tab', await otherTab.locator('html').getAttribute('data-accent') === 'blue');
            const otherAccount = await browser.newContext();
            const secondUsername = `login_${randomBytes(5).toString('hex')}`;
            assert.ok((await otherAccount.request.post(`${server.base}/api/auth/signup`, { data: {
                username: secondUsername, password, confirmPassword: password, fullName: 'İkinci Hesap', gender: 'male'
            } })).ok());
            await otherAccount.close();
            await page.getByRole('textbox', { name: /Kullanıcı adı/ }).fill(secondUsername);
            await page.getByLabel(/^Parola/).fill(password);
            await submit.click();
            await otherTab.waitForURL(server.base + '/');
            await otherTab.waitForFunction(() => document.documentElement.dataset.accent === 'blue');
            check('tabs: second account does not inherit first account preferences', true);
            await otherTab.close();
        }
        // Server-revoked cookie and tab notification use the same session-check path.
        await context.request.post(`${server.base}/api/auth/logout`);
        await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'chat-session-change' })));
        await page.waitForURL('**/login');
        check(`${device}: expired session resets account accent`, await page.locator('html').getAttribute('data-accent') === 'blue');
        check(`${device}: no browser exceptions`, errors.length === 0);
        await context.close();
    }
    console.log(`${checks} login checks passed`);
} finally {
    await browser.close();
    await server.stop();
}
