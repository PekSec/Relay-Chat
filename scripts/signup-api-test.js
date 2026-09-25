import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../backend/models/user.model.js';
import Session from '../backend/models/session.model.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI to a disposable database.');
const { signup } = await import('../backend/controller/auth.controller.js');
process.env.JWT_SECRET = 'signup-regression-only';
await mongoose.connect(process.env.MONGO_URI);
await User.init();
let checks = 0;
const check = (name, value) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const input = () => ({ fullName: 'Kayıt Testi', username: `reg_${randomBytes(5).toString('hex')}`,
    password: 'Signup-test-2026!', confirmPassword: 'Signup-test-2026!', gender: 'female' });
async function register(body) {
    const result = { status: 200, cookie: false };
    await signup({ body }, {
        status(value) { result.status = value; return this; },
        send(value) { result.body = value; return this; },
        cookie() { result.cookie = true; }
    });
    return result;
}
const originalInsert = User.collection.insertOne;
const originalSession = Session.create;
try {
    let inserts = 0;
    // Inject only the DB collision; retry still persists a real document.
    User.collection.insertOne = function (...args) {
        if (++inserts === 1) return Promise.reject(Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { friendCode: 1 } }));
        return originalInsert.apply(this, args);
    };
    const recovered = await register(input());
    check('friend-code collision retries and creates account', recovered.status === 201 && inserts === 2);
    check('retry creates one account and issues cookie', recovered.cookie && Boolean(await User.exists({ _id: recovered.body.user._id })));
    User.collection.insertOne = async () => { inserts++; throw Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { friendCode: 1 } }); };
    inserts = 0;
    const exhaustedInput = input();
    const exhausted = await register(exhaustedInput);
    check('friend-code collisions stop after five saves', exhausted.status === 503 && inserts === 5 && !exhausted.cookie);
    check('exhausted retries leave no account', !await User.exists({ username: exhaustedInput.username }));
    User.collection.insertOne = async () => { throw Object.assign(new Error('other duplicate'), { code: 11000, keyPattern: { _id: 1 } }); };
    const other = await register(input());
    check('other duplicate keys are not username conflicts', other.status === 500 && other.body.code !== 'USERNAME_TAKEN');
    User.collection.insertOne = originalInsert;

    const orphan = input();
    Session.create = async () => { throw new Error('session storage unavailable'); };
    const interrupted = await register(orphan);
    check('saved account with session failure has explicit recovery', interrupted.status === 503 && interrupted.body.code === 'ACCOUNT_CREATED_LOGIN_REQUIRED' && !interrupted.cookie);
    check('session failure preserves the saved account', Boolean(await User.exists({ username: orphan.username })));
    Session.create = originalSession;

    const duplicate = await register(orphan);
    check('existing username has stable error code', duplicate.status === 400 && duplicate.body.code === 'USERNAME_TAKEN');
    const concurrent = input();
    const pair = await Promise.all([register(concurrent), register(concurrent)]);
    check('concurrent username produces one account and one conflict', pair.filter(x => x.status === 201).length === 1 && pair.filter(x => x.body.code === 'USERNAME_TAKEN').length === 1);
    check('concurrent signup persists once', await User.countDocuments({ username: concurrent.username }) === 1);

    for (const [label, changes, status] of [
        ['empty name', { fullName: '   ' }, 400], ['non-string name', { fullName: {} }, 400],
        ['50 character name', { fullName: 'a'.repeat(50) }, 201], ['51 character name', { fullName: 'a'.repeat(51) }, 400],
        ['short username', { username: 'ab' }, 400], ['long username', { username: 'a'.repeat(21) }, 400],
        ['3 character username', { username: randomBytes(2).toString('hex').slice(0, 3) }, 201],
        ['20 character username', { username: randomBytes(10).toString('hex') }, 201],
        ['username Unicode', { username: 'çağrı' }, 400], ['username object', { username: {} }, 400],
        ['7 character password', { password: 'a'.repeat(7), confirmPassword: 'a'.repeat(7) }, 400],
        ['8 character password', { password: 'a'.repeat(8), confirmPassword: 'a'.repeat(8) }, 201],
        ['72 byte password', { password: 'ş'.repeat(36), confirmPassword: 'ş'.repeat(36) }, 201],
        ['73 byte password', { password: 'ş'.repeat(36) + 'a', confirmPassword: 'ş'.repeat(36) + 'a' }, 400],
        ['password mismatch', { confirmPassword: 'different' }, 400], ['missing gender', { gender: '' }, 400],
        ['invalid gender', { gender: 'other' }, 400], ['male accepted', { gender: 'male' }, 201],
        ['trimmed name', { fullName: '  Ada  ' }, 201]
    ]) {
        const result = await register({ ...input(), ...changes });
        check(label, result.status === status);
        if (status === 201) {
            assert.equal(result.body.user.preferences.accent, 'blue');
            assert.equal(result.body.user.preferences.theme, 'system');
            assert.equal('password' in result.body.user, false);
            assert.match(result.body.user.friendCode, /^[A-Z0-9]{4}$/);
        }
        if (label === 'trimmed name') assert.equal(result.body.user.fullName, 'Ada');
    }
    console.log(`${checks} signup API checks passed`);
} finally {
    User.collection.insertOne = originalInsert;
    Session.create = originalSession;
    await mongoose.disconnect();
}
