// Concurrent sends must not return an error after persisting their message.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { startTestServer } from "./test-server.js";

const server = await startTestServer({ defaultPort: 5017 });
const mongo = new MongoClient(process.env.MONGO_URI);
const accounts = [];
const api = (path, { method = "GET", cookie, body } = {}) => fetch(`${server.base}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
});
async function signup() {
    const response = await api("/auth/signup", { method: "POST", body: {
        fullName: "Message Race Test", username: `race_${randomBytes(5).toString("hex")}`, gender: "male",
        password: "Test-message-race-2026!", confirmPassword: "Test-message-race-2026!"
    } });
    assert.equal(response.status, 201);
    const user = (await response.json()).user;
    accounts.push(new ObjectId(user._id));
    return { ...user, cookie: response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ") };
}
try {
    await mongo.connect();
    const a = await signup();
    const b = await signup();
    const send = (sender, recipient, message) => api(`/messages/send/${recipient._id}`, { method: "POST", cookie: sender.cookie, body: { message } });
    const seed = await send(a, b, "seed request");
    assert.equal(seed.status, 201);
    const conversation = await mongo.db().collection("conversations").findOne({ participants: { $all: accounts } });
    assert.equal(conversation.status, "pending");
    const texts = ["seed request"];
    for (let wave = 0; wave < 2; wave++) {
        const calls = Array.from({ length: 20 }, (_, index) => {
            const text = `wave-${wave}-message-${index}`;
            texts.push(text);
            return index % 2 ? send(b, a, text) : send(a, b, text);
        });
        // Acceptance and sends may overlap; a stale pending sender must not downgrade it.
        const acceptance = wave === 0 ? api(`/conversations/accept/${conversation._id}`, { method: "PUT", cookie: b.cookie }) : null;
        const responses = await Promise.all(calls);
        if (acceptance) assert.equal((await acceptance).status, 200);
        const statuses = responses.map((response) => response.status);
        assert.ok(statuses.every((status) => status === 201), `Every send must succeed, received: ${statuses}`);
        const messages = await Promise.all(responses.map((response) => response.json()));
        assert.equal(new Set(messages.map((message) => message._id)).size, 20, "each send returns a unique saved message");

        const historyResponse = await api(`/messages/${b._id}`, { cookie: a.cookie });
        assert.equal(historyResponse.status, 200);
        const history = await historyResponse.json();
        assert.deepEqual(history.map((message) => message.message).sort(), [...texts].sort(), "history stores exactly one message per request");
        const savedConversation = await mongo.db().collection("conversations").findOne({ _id: conversation._id });
        const newestId = history.map((message) => message._id).sort().at(-1);
        assert.equal(savedConversation.messages.length, 1, "preview references remain bounded");
        assert.equal(String(savedConversation.messages[0]), newestId, "preview points to highest history ID despite write completion order");
        assert.equal(savedConversation.status, "active", "active conversation never downgrades to pending");
        const listed = await (await api("/conversations", { cookie: a.cookie })).json();
        assert.equal(listed.find((item) => item._id === String(conversation._id)).messages[0]._id, newestId);
    }
    console.log("PASS concurrent sends: 40 successful requests, exact history, bounded newest preview, active status preserved");
} catch (error) {
    console.error("Concurrent message regression failed:", error);
    process.exitCode = 1;
} finally {
    try {
        if (accounts.length) {
            await mongo.db().collection("messages").deleteMany({ senderId: { $in: accounts } });
            await mongo.db().collection("conversations").deleteMany({ participants: { $in: accounts } });
            await mongo.db().collection("sessions").deleteMany({ userId: { $in: accounts } });
            await mongo.db().collection("users").deleteMany({ _id: { $in: accounts } });
        }
    } finally {
        await mongo.close();
        await server.stop();
    }
}
