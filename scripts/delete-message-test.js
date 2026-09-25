import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Message from '../backend/models/message.model.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI to a disposable database.');
const { deleteMessage, editMessage } = await import('../backend/controller/message.controller.js');
await mongoose.connect(process.env.MONGO_URI);
const senderId = new mongoose.Types.ObjectId();
const receiverId = new mongoose.Types.ObjectId();
const invoke = async (handler, id, userId = senderId, body = {}) => {
    const result = {};
    await handler({ params: { id: String(id) }, userId: String(userId), body }, {
        status(code) { result.status = code; return this; }, json(body) { result.body = body; }
    });
    return result;
};
try {
    const msg = await Message.create({ senderId, receiverId, message: 'Original' });
    assert.equal((await invoke(deleteMessage, msg._id, receiverId)).status, 403);
    assert.equal((await invoke(deleteMessage, new mongoose.Types.ObjectId())).status, 404);
    assert.equal((await invoke(deleteMessage, 'invalid')).status, 400);
    assert.equal((await invoke(deleteMessage, msg._id)).status, 200);
    assert.equal((await invoke(deleteMessage, msg._id)).status, 200, 'retry after deletion must succeed');
    assert.equal((await invoke(deleteMessage, msg._id, receiverId)).status, 403);
    assert.equal((await invoke(editMessage, msg._id, senderId, { newMessage: 'Revived' })).status, 400);
    for (let i = 0; i < 30; i++) {
        const message = await Message.create({ senderId, receiverId, message: 'Original' });
        const results = await Promise.all([
            invoke(editMessage, message._id, senderId, { newMessage: 'Late edit' }),
            invoke(deleteMessage, message._id), invoke(deleteMessage, message._id)
        ]);
        assert.ok([200, 400].includes(results[0].status));
        assert.equal(results[1].status, 200);
        assert.equal(results[2].status, 200);
        const saved = await Message.findById(message._id);
        assert.equal(saved.isDeleted, true);
        assert.equal(saved.message, 'This message was deleted', 'edit cannot overwrite deleted content');
    }
    console.log('PASS deletion ownership, missing/invalid ID, retry, and 30 edit/delete races');
} finally { await mongoose.disconnect(); }
