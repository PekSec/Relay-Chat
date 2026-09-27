import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import User from '../backend/models/user.model.js';
import FriendRequest from '../backend/models/friendRequest.model.js';
import Conversation from '../backend/models/conversation.model.js';
import { respondToFriendRequest, cancelFriendRequest, removeFriend, getFriends, getFriendRequests, getSentFriendRequests } from '../backend/controller/friend.controller.js';

assert.ok(process.env.MONGO_URI, 'Supply a disposable MONGO_URI');
await mongoose.connect(process.env.MONGO_URI, { monitorCommands: true });
const ids = [];
const call = async (handler, userId, body = {}, params = {}) => {
    const result = { code: 200 };
    const res = { status(code) { result.code = code; return this; }, json(data) { result.data = data; } };
    await handler({ userId: String(userId), body, params }, res);
    return result;
};
try {
    const suffix = randomBytes(5).toString('hex');
    const users = await User.create(['a', 'b', 'c'].map((name, i) => ({ fullName: name, username: `fr_${suffix}_${name}`,
        password: 'unused-hash', gender: 'female', friendCode: randomBytes(2).toString('hex').toUpperCase() })));
    ids.push(...users.map(u => u._id));
    const [a, b, c] = users;
    for (const opponent of ['accept', 'reject', 'cancel']) {
        for (let i = 0; i < 12; i++) {
            await User.updateMany({ _id: { $in: ids } }, { $set: { friends: [] } });
            const request = await FriendRequest.create({ senderId: a._id, receiverId: b._id });
            const args = { requestId: String(request._id), response: 'accept' };
            const results = await Promise.all([
                call(respondToFriendRequest, b._id, args),
                opponent !== 'cancel' ? call(respondToFriendRequest, b._id, { ...args, response: opponent }) :
                    call(cancelFriendRequest, a._id, {}, { requestId: args.requestId }),
            ]);
            assert.equal(results.filter(r => r.code === 200).length, 1, `only one winner: accept/${opponent}`);
            const accepted = opponent === 'accept' || results[0].code === 200;
            const saved = await User.find({ _id: { $in: [a._id, b._id] } });
            assert.ok(saved.every(u => u.friends.length === (accepted ? 1 : 0)), 'loser has no friendship side effects');
            await FriendRequest.deleteOne({ _id: request._id });
        }
    }
    const request = await FriendRequest.create({ senderId: a._id, receiverId: b._id });
    assert.equal((await call(respondToFriendRequest, c._id, { requestId: String(request._id), response: 'accept' })).code, 403);
    assert.equal((await call(cancelFriendRequest, b._id, {}, { requestId: String(request._id) })).code, 403);
    assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(request._id), response: 'invalid' })).code, 400);
    const writeUsers = User.updateMany;
    try {
        User.updateMany = async () => { throw new Error('Injected friendship write failure'); };
        assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(request._id), response: 'accept' })).code, 500);
    } finally { User.updateMany = writeUsers; }
    assert.ok((await call(getFriendRequests, b._id)).data.friendRequests.some(r => r._id.equals(request._id)), 'failed acceptance remains retryable in inbox');
    assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(request._id), response: 'reject' })).code, 400, 'claimed acceptance cannot become rejection');
    assert.equal((await call(cancelFriendRequest, a._id, {}, { requestId: String(request._id) })).code, 400, 'claimed acceptance cannot be cancelled');
    assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(request._id), response: 'accept' })).code, 200, 'accept retry finishes persisted intent');
    const recovering = await FriendRequest.create({ senderId: c._id, receiverId: b._id });
    const writeConversations = Conversation.updateMany;
    try {
        Conversation.updateMany = async () => { throw new Error('Injected conversation write failure'); };
        assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(recovering._id), response: 'accept' })).code, 500);
    } finally { Conversation.updateMany = writeConversations; }
    assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(recovering._id), response: 'accept' })).code, 200);
    assert.equal((await User.findById(b._id)).friends.filter(id => id.equals(c._id)).length, 1, 'recovery cannot duplicate friendship');
    assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(recovering._id), response: 'accept' })).code, 400, 'completed acceptance cannot run again');
    const interrupted = await FriendRequest.create({ senderId: a._id, receiverId: b._id });
    try {
        Conversation.updateMany = async () => { throw new Error('Injected late acceptance failure'); };
        assert.equal((await call(respondToFriendRequest, b._id, { requestId: String(interrupted._id), response: 'accept' })).code, 500);
    } finally { Conversation.updateMany = writeConversations; }
    assert.equal((await call(removeFriend, a._id, {}, { friendId: String(b._id) })).code, 200);
    assert.notEqual((await call(respondToFriendRequest, b._id, { requestId: String(interrupted._id), response: 'accept' })).code, 200, 'old acceptance cannot undo later removal');
    assert.ok(!(await User.findById(a._id)).friends.some(id => id.equals(b._id)));
    const running = await FriendRequest.create({ senderId: c._id, receiverId: a._id });
    let release, observed;
    const held = new Promise(resolve => { release = resolve; });
    const atWrite = new Promise(resolve => { observed = resolve; });
    try {
        Conversation.updateMany = async (...args) => { observed(); await held; return writeConversations.apply(Conversation, args); };
        const accepting = call(respondToFriendRequest, a._id, { requestId: String(running._id), response: 'accept' });
        await atWrite;
        assert.equal((await call(removeFriend, c._id, {}, { friendId: String(a._id) })).code, 409, 'remove cannot interleave an active acceptance');
        release();
        assert.equal((await accepting).code, 200);
    } finally { release(); Conversation.updateMany = writeConversations; }
    assert.equal((await call(removeFriend, c._id, {}, { friendId: String(a._id) })).code, 200);
    await FriendRequest.create({ senderId: a._id, receiverId: b._id });
    await FriendRequest.init();
    for (const [handler, account, field] of [[getFriends, a._id, 'friends'], [getFriendRequests, b._id, 'friendRequests'], [getSentFriendRequests, a._id, 'sentRequests']]) {
        let reads = 0;
        const listener = e => { if (e.commandName === 'find') reads++; };
        mongoose.connection.getClient().on('commandStarted', listener);
        const result = await call(handler, account);
        mongoose.connection.getClient().off('commandStarted', listener);
        assert.equal(result.code, 200);
        assert.ok(Array.isArray(result.data[field]));
        assert.ok(reads <= 2, 'list has at most two reads');
        assert.ok(!JSON.stringify(result.data).includes('unused-hash'));
        console.log(`PASS ${field}: ${reads} reads, ${JSON.stringify(result.data).length} JSON characters, public fields only`);
    }
    for (const key of ['senderId', 'receiverId']) {
        const explain = await FriendRequest.find({ [key]: a._id, status: 'pending' }).explain('queryPlanner');
        assert.ok(JSON.stringify(explain.queryPlanner.winningPlan).includes('IXSCAN'));
    }
    console.log('PASS 36 accept/accept/reject/cancel races, write-failure recovery, ownership, validation and list indexes');
} finally {
    await FriendRequest.deleteMany({ $or: [{ senderId: { $in: ids } }, { receiverId: { $in: ids } }] });
    await User.deleteMany({ _id: { $in: ids } });
    await mongoose.disconnect();
}
