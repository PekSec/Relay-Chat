import { readFileSync } from 'node:fs';

const base = new URL('../../frontend/public/emoji/17.0.0/en/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('data.json', base), 'utf8'));
const messages = JSON.parse(readFileSync(new URL('messages.json', base), 'utf8'));
const componentGroup = messages.groups.find(group => group.key === 'component').order;
// Preserve stored reactions when the catalog adds an emoji presentation selector.
const legacy = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const withoutPresentation = emoji => emoji.replaceAll('\uFE0F', '');
const reactions = new Map();
for (const entry of data) {
    if (entry.group === undefined || entry.group === componentGroup) continue;
    for (const { emoji } of [entry, ...(entry.skins || [])]) {
        const canonical = legacy.find(value => withoutPresentation(value) === withoutPresentation(emoji)) || emoji;
        reactions.set(emoji, canonical);
        reactions.set(withoutPresentation(emoji), canonical);
    }
}

export const reactionEmoji = value => typeof value === 'string' ? reactions.get(value) : undefined;
