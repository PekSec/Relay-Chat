import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import Session from '../backend/models/session.model.js';
import User from '../backend/models/user.model.js';
import protectRoute from '../backend/middleware/protectRoute.js';
import { io as connect } from 'socket.io-client';
import { io, server } from '../backend/socket/socket.js';

process.env.JWT_SECRET = 'session-error-test-only';
const token = jwt.sign({ id: '507f1f77bcf86cd799439011', jti: 'test' }, process.env.JWT_SECRET, { expiresIn: '5m' });
async function status(cookie) {
    let result;
    await protectRoute({ cookies: { token: cookie } }, {
        status(code) { result = code; return this; }, json() {}
    }, () => { result = 200; });
    return result;
}
const sessionExists = Session.exists;
const userExists = User.exists;
try {
    assert.equal(await status('invalid'), 401);
    Session.exists = async () => null;
    assert.equal(await status(token), 401);
    Session.exists = async () => { throw new Error('database unavailable'); };
    assert.equal(await status(token), 503, 'database failure must not invalidate the session');
    Session.exists = async () => ({ _id: 'test' });
    User.exists = async () => { throw new Error('database unavailable'); };
    assert.equal(await status(token), 503);
    User.exists = async () => null;
    assert.equal(await status(token), 401);
    User.exists = async () => ({ _id: '507f1f77bcf86cd799439011' });
    assert.equal(await status(token), 200);
    console.log('PASS session: invalid/missing session, database errors, deleted/valid user');
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    async function socketError(cookie) {
        const socket = connect(url, { extraHeaders: { Cookie: `token=${cookie}` }, reconnection: false });
        try {
            return await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('socket handshake timed out')), 3000);
                socket.once('connect_error', error => { clearTimeout(timer); resolve(error.data?.code); });
                socket.once('connect', () => { clearTimeout(timer); reject(new Error('unverified connection accepted')); });
            });
        } finally { socket.disconnect(); }
    }
    assert.equal(await socketError('invalid'), 'UNAUTHORIZED');
    Session.exists = async () => { throw new Error('database unavailable'); };
    assert.equal(await socketError(token), 'SESSION_UNAVAILABLE');
    Session.exists = async () => ({ _id: 'test' });
    const socket = connect(url, { extraHeaders: { Cookie: `token=${token}` }, reconnection: false });
    try {
        await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
        let delivered = false;
        const connected = [...io.sockets.sockets.values()][0];
        connected.on('test-event', () => { delivered = true; });
        Session.exists = async () => { throw new Error('database unavailable'); };
        const disconnected = new Promise(resolve => socket.once('disconnect', resolve));
        socket.emit('test-event');
        await disconnected;
        assert.equal(delivered, false, 'unverified packet must not reach its handler');
    } finally { socket.disconnect(); }
    console.log('PASS socket: auth/service errors distinguished; unverified connection and packet rejected');
} finally {
    Session.exists = sessionExists;
    User.exists = userExists;
    await new Promise(resolve => io.close(resolve));
}
