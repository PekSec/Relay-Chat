import assert from 'node:assert/strict';
import { insertEmoji } from '../frontend/src/utils/emoji.js';

assert.deepEqual(insertEmoji('ab', 1, 1, '😀'), { text: 'a😀b', caret: 3 });
assert.deepEqual(insertEmoji('abc', 1, 2, '❤️'), { text: 'a❤️c', caret: 3 });
assert.equal(insertEmoji('a'.repeat(1999), 1999, 1999, '😀'), null);
assert.equal(insertEmoji('a'.repeat(2000), 0, 2, '😀').text.length, 2000);
const family = '👩🏽‍💻';
assert.equal(insertEmoji(family + 'x', 2, 2, '😀').text, family + '😀x');
assert.equal(insertEmoji(family + 'x', 1, 3, '😀').text, '😀x');
assert.equal(insertEmoji('a'.repeat(1998), 1998, 1998, '😀').text.length, 2000);
assert.equal(insertEmoji('e\u0301x', 1, 1, '👍').text, 'e\u0301👍x');
console.log('PASS caret, selection, 2000 UTF-16 limit, ZWJ/skin tone/combining boundaries');
