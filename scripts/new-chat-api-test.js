import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import User from '../backend/models/user.model.js';
import FriendRequest from '../backend/models/friendRequest.model.js';
import { sendFriendRequest, searchUsers } from '../backend/controller/friend.controller.js';

assert.ok(process.env.MONGO_URI, 'Supply a disposable MONGO_URI');
await mongoose.connect(process.env.MONGO_URI, { monitorCommands: true });
const ids = [];
const call = async (handler, userId, params = {}, query = {}) => {
    const result = { code: 200 };
    await handler({ userId: String(userId), params, query }, {
        status(code) { result.code = code; return this; }, json(data) { result.data = data; },
    });
    return result;
};
try {
    const prefix = `nc_${randomBytes(4).toString('hex')}`;
    const users = await User.create(Array.from({ length: 23 }, (_, i) => ({ fullName: `Kişi ${i}`,
        username: `${prefix}_${i}`, password: 'private-hash', gender: 'female', friendCode: i.toString(16).padStart(4, '0').toUpperCase() })));
    ids.push(...users.map(u => u._id));
    const [a, b] = users;
    const save = FriendRequest.prototype.save;
    try {
        FriendRequest.prototype.save = async () => { throw new Error('Injected request write failure'); };
        assert.equal((await call(sendFriendRequest, a._id, { receiverId: String(b._id) })).code, 500);
    } finally { FriendRequest.prototype.save = save; }
    assert.equal((await call(sendFriendRequest, a._id, { receiverId: String(b._id) })).code, 200, 'failed write releases pair for retry');
    for (const reverse of [false, true]) {
        for (let i = 0; i < 12; i++) {
            await FriendRequest.deleteMany({ senderId: { $in: ids } });
            const results = await Promise.all([
                call(sendFriendRequest, a._id, { receiverId: String(b._id) }),
                call(sendFriendRequest, reverse ? b._id : a._id, { receiverId: String(reverse ? a._id : b._id) }),
            ]);
            assert.equal(results.filter(r => r.code === 200).length, 1, 'one successful send per pair');
            assert.equal(await FriendRequest.countDocuments({ senderId: { $in: ids }, status: 'pending' }), 1);
        }
    }
    assert.equal((await call(sendFriendRequest, a._id, { receiverId: 'invalid' })).code, 400);
    assert.equal((await call(sendFriendRequest, a._id, { receiverId: String(a._id).toUpperCase() })).code, 400);
    await User.updateOne({ _id: a._id }, { $addToSet: { friends: b._id } });
    assert.equal((await call(sendFriendRequest, a._id, { receiverId: String(b._id) })).code, 400, 'already friends cannot send');
    for (const query of ['', '#AB12', 'ışıl', 'a'.repeat(21), ['ab'], 'a b']) {
        assert.equal((await call(searchUsers, a._id, {}, { query })).code, 400);
    }
    let reads = 0;
    const listener = event => { if (event.commandName === 'find') reads++; };
    mongoose.connection.getClient().on('commandStarted', listener);
    const found = await call(searchUsers, a._id, {}, { query: prefix.toUpperCase() });
    mongoose.connection.getClient().off('commandStarted', listener);
    assert.equal(found.code, 200); assert.equal(found.data.length, 20); assert.equal(reads, 1);
    assert.ok(found.data.every(u => !u._id.equals(a._id)));
    assert.ok(found.data.every(u => Object.keys(u.toObject()).every(k => ['_id', 'fullName', 'username', 'profilePic', 'friendCode'].includes(k))));
    assert.equal((await call(searchUsers, a._id, {}, { query: b.friendCode.toLowerCase() })).data[0].username, b.username);
    const explain = await User.find({ $or: [{ username: { $regex: prefix, $options: 'i' } },
        { friendCode: { $regex: prefix.toUpperCase() } }], _id: { $ne: a._id } }).limit(20).explain('queryPlanner');
    console.log(`PASS search: ${reads} read, ${JSON.stringify(found.data).length} JSON characters, plan ${JSON.stringify(explain.queryPlanner.winningPlan)}`);
    console.log('PASS new-chat API: 24 concurrent sends, validation, code/username search, limit, self exclusion and public fields');
} finally {
    await FriendRequest.deleteMany({ senderId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await mongoose.disconnect();
}
