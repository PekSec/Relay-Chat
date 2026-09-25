// Real MongoDB regression: preview correctness and bounded database round trips.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../backend/models/user.model.js';
import Message from '../backend/models/message.model.js';
import Conversation from '../backend/models/conversation.model.js';
import { getConversations, getConversationsByStatus } from '../backend/controller/conversation.controller.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI explicitly to a disposable test database.');
const id = () => new mongoose.Types.ObjectId();
const owner = id(), outsider = id();
const peers = Array.from({ length: 12 }, id);
const userIds = [owner, outsider, ...peers];
const conversationIds = [];
const messageIds = [];
await mongoose.connect(process.env.MONGO_URI, { monitorCommands: true });
try {
    await Promise.all([User.init(), Message.init(), Conversation.init()]);
    await User.collection.insertMany(userIds.map(_id => ({ _id, username: `query_${_id}`, fullName: `User ${_id}`, password: 'private', friendCode: String(_id), profilePic: '' })));
    const conversations = [];
    const messages = [];
    for (const [index, peer] of peers.entries()) {
        const older = id(), latest = id(), conversationId = id();
        messageIds.push(older, latest);
        conversationIds.push(conversationId);
        messages.push(
            { _id: older, senderId: peer, receiverId: owner, message: 'older', clearedBy: [] },
            { _id: latest, senderId: owner, receiverId: peer, message: `latest ${index}`, clearedBy: index === 0 || index === 3 ? [owner] : [] },
        );
        // Include a legacy multi-reference conversation, an empty one, and a hidden preview.
        conversations.push({ _id: conversationId, participants: [owner, peer], status: index % 2 ? 'active' : 'pending', messages: index === 1 ? [] : index === 2 || index === 3 ? [latest, older] : [latest], updatedAt: new Date(1000 + index) });
    }
    const foreignId = id();
    conversationIds.push(foreignId);
    conversations.push({ _id: foreignId, participants: [outsider, peers[0]], messages: [], status: 'active' });
    await Message.collection.insertMany(messages);
    await Conversation.collection.insertMany(conversations);
    for (const status of [undefined, 'pending', 'active']) {
        const commands = [];
        const count = event => { if (['find', 'aggregate', 'getMore'].includes(event.commandName)) commands.push(event.commandName); };
        mongoose.connection.getClient().on('commandStarted', count);
        let body;
        const response = { status(code) { assert.equal(code, 200); return this; }, json(value) { body = JSON.parse(JSON.stringify(value)); } };
        const start = performance.now();
        await (status ? getConversationsByStatus : getConversations)({ userId: String(owner), params: { status } }, response);
        mongoose.connection.getClient().off('commandStarted', count);
        assert.equal(body.length, status ? 6 : 12);
        assert.ok(body.every(item => !status || item.status === status));
        assert.ok(body.every(item => item.participants.some(person => person._id === String(owner))));
        assert.ok(body.every(item => item.participants.every(person => !('password' in person))));
        assert.ok(body.every((item, index) => index === 0 || item.updatedAt <= body[index - 1].updatedAt));
        for (const item of body) {
            const index = peers.findIndex(peer => item.participants.some(person => person._id === String(peer)));
            assert.equal(item.messages.length, index < 2 ? 0 : 1);
            if (index >= 2) assert.equal(item.messages[0].message, index === 3 ? 'older' : `latest ${index}`);
        }
        console.log(`${status || 'all'}: ${body.length} conversations, ${commands.length} read commands, ${(performance.now() - start).toFixed(1)} ms`);
        assert.ok(commands.length <= 3, `Preview loading must not issue a read per conversation: ${commands.length}`);
    }
    console.log('PASS: scoped lists, ordering, empty/cleared/legacy previews, safe participants, bounded reads');
} finally {
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
    await Message.deleteMany({ _id: { $in: messageIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
}
