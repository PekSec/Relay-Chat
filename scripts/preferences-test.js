// Real HTTP regressions: account defaults, persistence, validation and isolation.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { startTestServer } from "./test-server.js";

const server = await startTestServer({ defaultPort: 5011 });
const mongo = new MongoClient(process.env.MONGO_URI);
const accounts = [];
const defaults = { theme: "system", accent: "blue", density: "comfortable", fontSize: "standard", sendKey: "enter", chatSound: true, notificationSound: true, messagePreviews: true };
const api = (path, { method = "GET", cookie, body } = {}) => fetch(`${server.base}/api/auth${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
});
async function signup() {
    const body = { fullName: "Preferences Test", username: `pref_${randomBytes(5).toString("hex")}`, gender: "male", password: "Test-preferences-2026!", confirmPassword: "Test-preferences-2026!" };
    const response = await api("/signup", { method: "POST", body });
    assert.equal(response.status, 201);
    const user = (await response.json()).user;
    accounts.push(new ObjectId(user._id));
    return { ...user, cookie: response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; "), password: body.password };
}
try {
    await mongo.connect();
    const a = await signup();
    const b = await signup();
    assert.deepEqual(a.preferences, defaults, "signup returns complete defaults");
    assert.equal((await api("/preferences", { method: "PATCH", body: { theme: "dark" } })).status, 401, "preferences require an authenticated account");

    // Legacy records have no preferences; reads must supply defaults without a backfill.
    await mongo.db().collection("users").updateOne({ _id: accounts[0] }, { $unset: { preferences: "" } });
    assert.deepEqual((await (await api("/me", { cookie: a.cookie })).json()).user.preferences, defaults);
    assert.equal((await mongo.db().collection("users").findOne({ _id: accounts[0] })).preferences, undefined, "reading a legacy account does not backfill it");
    const legacyLogin = await api("/login", { method: "POST", body: { username: a.username, password: a.password } });
    assert.equal(legacyLogin.status, 200);
    assert.deepEqual((await legacyLogin.json()).user.preferences, defaults);

    const changed = { theme: "dark", accent: "relay-bosphorus", density: "compact", fontSize: "large", sendKey: "mod-enter", chatSound: false, notificationSound: false, messagePreviews: false };
    const saved = await api("/preferences", { method: "PATCH", cookie: a.cookie, body: changed });
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), { preferences: changed });
    assert.deepEqual((await (await api("/me", { cookie: a.cookie })).json()).user.preferences, changed, "saved preferences survive a fresh account read");
    const login = await api("/login", { method: "POST", body: { username: a.username, password: a.password } });
    assert.deepEqual((await login.json()).user.preferences, changed, "a new session receives saved preferences");
    const profile = await api("/profile", { method: "PUT", cookie: a.cookie, body: { fullName: "Updated Profile" } });
    const profileUser = (await profile.json()).user;
    assert.equal(profile.status, 200);
    assert.deepEqual(profileUser.preferences, changed, "profile updates preserve account preferences");
    assert.ok(!("password" in profileUser) && !("friends" in profileUser));

    const invalid = [undefined, {}, null, [], "dark", { unknown: true }, { userId: b._id, theme: "light" }, { theme: "invalid" }, { theme: false }, { accent: "unknown" }, { density: "tiny" }, { fontSize: 20 }, { sendKey: "shift-enter" }, { chatSound: "false" }, { notificationSound: 0 }, { messagePreviews: null }, { "preferences.theme": "light" }, { $set: { theme: "light" } }, { theme: "light", unknown: true }];
    for (const body of invalid) {
        assert.equal((await api("/preferences", { method: "PATCH", cookie: a.cookie, body })).status, 400, `reject invalid update: ${JSON.stringify(body)}`);
    }
    assert.deepEqual((await (await api("/me", { cookie: a.cookie })).json()).user.preferences, changed, "invalid updates are atomic");
    assert.deepEqual((await (await api("/me", { cookie: b.cookie })).json()).user.preferences, defaults, "another account remains unchanged");

    const concurrent = await Promise.all([
        api("/preferences", { method: "PATCH", cookie: a.cookie, body: { theme: "light" } }),
        api("/preferences", { method: "PATCH", cookie: a.cookie, body: { accent: "purple" } })
    ]);
    assert.ok(concurrent.every((response) => response.status === 200));
    assert.deepEqual((await (await api("/me", { cookie: a.cookie })).json()).user.preferences, { ...changed, theme: "light", accent: "purple" }, "concurrent disjoint changes both survive");
    for (const accent of ["blue", "lime", "red", "orange", "yellow", "green", "teal", "purple", "magenta", "gray", "relay-bosphorus", "relay-iris", "relay-pine", "relay-copper"]) {
        const response = await api("/preferences", { method: "PATCH", cookie: a.cookie, body: { accent } });
        assert.equal(response.status, 200, `accept accent ${accent}`);
        assert.equal((await response.json()).preferences.accent, accent);
    }
    console.log("PASS preferences: defaults, legacy reads, sessions, persistence, profile preservation, validation, isolation, concurrent updates and all accents");
} catch (error) {
    console.error("Preferences regression failed:", error);
    process.exitCode = 1;
} finally {
    try {
        if (accounts.length) {
            await mongo.db().collection("sessions").deleteMany({ userId: { $in: accounts } });
            await mongo.db().collection("users").deleteMany({ _id: { $in: accounts } });
        }
    } finally {
        await mongo.close();
        await server.stop();
    }
}
