import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Message from '../backend/models/message.model.js';
import Conversation from '../backend/models/conversation.model.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI to a disposable database.');
const { clearConversation } = await import('../backend/controller/message.controller.js');
await mongoose.connect(process.env.MONGO_URI);
const a = new mongoose.Types.ObjectId(); const b = new mongoose.Types.ObjectId();
const invoke = async (user = b, peer = a) => {
    const result = {};
    await clearConversation({ params: { id: String(peer) }, userId: String(user) }, {
        status(code) { result.status = code; return this; }, json(body) { result.body = body; }
    });
    return result;
};
try {
    const first = await Message.create({ senderId: a, receiverId: b, message: 'Pending request' });
    const conversation = await Conversation.create({ participants: [a, b], messages: [first._id], status: 'pending' });
    const cleared = await invoke();
    assert.equal(cleared.status, 200);
    assert.ok(await Message.exists({ _id: first._id, clearedBy: { $ne: a } }), 'clearing a pending request must preserve the sender history');
    assert.equal(String(cleared.body.clearedThrough), String(first._id));
    assert.ok(await Conversation.exists({ _id: conversation._id }));
    assert.equal((await invoke()).body.deletedCount, 0, 'repeat clear is harmless');
    assert.equal((await invoke(new mongoose.Types.ObjectId())).status, 404);
    await Conversation.updateOne({ _id: conversation._id }, { status: 'active' });
    const before = await Message.create({ senderId: a, receiverId: b, message: 'Before clear' });
    const updateMany = Message.updateMany;
    let newer;
    Message.updateMany = async function (...args) {
        newer = await Message.create({ senderId: a, receiverId: b, message: 'During clear' });
        return updateMany.apply(this, args);
    };
    let result;
    try { result = await invoke(); } finally { Message.updateMany = updateMany; }
    assert.equal(String(result.body.clearedThrough), String(before._id));
    assert.ok(await Message.exists({ _id: newer._id, clearedBy: { $ne: b } }), 'newer message must survive a delayed clear');
    assert.equal(await Message.countDocuments({ receiverId: b, clearedBy: { $ne: b } }), 1);
    assert.equal(await Message.countDocuments({ receiverId: b, clearedBy: { $ne: a } }), 3);
    await invoke(); await invoke(a, b);
    assert.equal(await Message.countDocuments({ receiverId: b }), 0, 'both users cleared all records');
    assert.equal((await invoke()).status, 200);
    console.log('PASS pending/active isolation, missing conversation, repeat clear, concurrent arrival, both-side cleanup');
} finally { await mongoose.disconnect(); }
