import assert from 'node:assert/strict';
import useConversation from '../frontend/src/zustand/useConversation.js';

const store = useConversation;
const original = { _id: 'message-1', message: 'Original', isDeleted: false };
const conversation = { _id: 'peer', lastMessage: original };
const assertDeleted = message => {
    assert.equal(message.isDeleted, true);
    assert.equal(message.message, 'Bu mesaj silindi');
};
store.getState().reset();
store.getState().markMessageDeleted(original._id);
// The socket event can arrive before history or an older page has loaded.
store.getState().setMessages([original]);
assertDeleted(store.getState().messages[0]);
store.getState().setMessages(() => [original]);
assertDeleted(store.getState().messages[0]);
store.getState().setConversations([conversation]);
assertDeleted(store.getState().conversations[0].lastMessage);
store.getState().setSelectedConversation(conversation);
assertDeleted(store.getState().selectedConversation.lastMessage);
store.getState().setMessages([original]);
store.getState().setMessages(current => current.map(message => ({ ...message, message: 'Late edit' })));
assertDeleted(store.getState().messages[0]);
store.getState().markMessageDeleted(original._id);
assertDeleted(store.getState().conversations[0].lastMessage);
store.getState().reset();
store.getState().setMessages([original]);
assert.equal(store.getState().messages[0].isDeleted, false, 'deletion state must not cross sessions');
store.getState().reset();
console.log('PASS unloaded deletion, late history/page/list/edit, selected preview, repeated event, session reset');
