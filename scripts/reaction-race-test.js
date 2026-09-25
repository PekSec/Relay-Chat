import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Message from '../backend/models/message.model.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI to a disposable database.');
const { reactToMessage, deleteMessage } = await import('../backend/controller/message.controller.js');
await mongoose.connect(process.env.MONGO_URI);
const a = new mongoose.Types.ObjectId(); const b = new mongoose.Types.ObjectId();
const invoke = async (id, userId = a, emoji = '👍', handler = reactToMessage) => {
    const result = {};
    await handler({ params: { id: String(id) }, userId: String(userId), body: { emoji } }, {
        status(code) { result.status = code; return this; }, json(body) { result.body = body; }
    });
    return result;
};
try {
    const msg = await Message.create({ senderId: a, receiverId: b, message: 'Test' });
    assert.equal((await invoke(msg._id, new mongoose.Types.ObjectId())).status, 403);
    assert.equal((await invoke('invalid')).status, 400);
    assert.equal((await invoke(new mongoose.Types.ObjectId())).status, 404);
    for (const emoji of ['', null, 1, {}, [], 'hello', '👍👍', '🔥text', '🏽']) {
        assert.equal((await invoke(msg._id, a, emoji)).status, 400);
    }
    for (const emoji of ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👩🏽‍💻', '👍🏽', '🇹🇷', '1️⃣']) {
        const result = await invoke(msg._id, a, emoji);
        assert.equal(result.status, 200, `${emoji} is a supported reaction`);
        assert.equal(result.body.reactions[0].emoji, emoji);
        assert.equal((await invoke(msg._id, a, emoji)).body.reactions.length, 0);
    }
    await invoke(msg._id, a, '👍');
    assert.equal((await invoke(msg._id, a, '👍️')).body.reactions.length, 0, 'catalog presentation selector toggles legacy thumbs up');
    await invoke(msg._id, a, '❤');
    assert.equal((await invoke(msg._id, a, '❤️')).body.reactions.length, 0, 'heart aliases use the existing stored reaction');
    for (let i = 0; i < 20; i++) {
        const message = await Message.create({ senderId: a, receiverId: b, message: 'Race' });
        const results = await Promise.all([invoke(message._id), invoke(message._id, b, '❤️')]);
        assert.ok(results.every(result => result.status === 200), 'both concurrent reactions must succeed');
        assert.equal((await Message.findById(message._id)).reactions.length, 2, 'one user cannot overwrite the other reaction');
        assert.deepEqual(results.map(result => result.body.reactionVersion).sort(), [1, 2]);
        const toggles = await Promise.all([invoke(message._id), invoke(message._id)]);
        assert.ok(toggles.every(result => result.status === 200));
        const saved = await Message.findById(message._id);
        assert.equal(saved.reactions.filter(item => String(item.userId) === String(a)).length, 1, 'two toggles return to initial state');
        assert.equal(saved.reactionVersion, 4);
        const race = await Promise.all([invoke(message._id), invoke(message._id, a, undefined, deleteMessage)]);
        assert.ok([200, 400].includes(race[0].status));
        assert.equal(race[1].status, 200);
        assert.equal((await Message.findById(message._id)).isDeleted, true);
        assert.equal((await invoke(message._id)).status, 400);
    }
    console.log('PASS full-catalog reactions/toggle, invalid input, ownership, invalid/missing/deleted messages, 20 concurrent-user and duplicate-toggle races');
} finally { await mongoose.disconnect(); }
