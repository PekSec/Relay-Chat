// Temporary Unicode choices; these are not the licensed Atlassian artwork/catalog.
export const EMOJIS = [
    ['😀', 'Gülümseme'], ['😂', 'Kahkaha'], ['🥰', 'Sevgi'], ['😎', 'Güneş gözlüğü'],
    ['🤔', 'Düşünme'], ['👍', 'Beğeni'], ['🙏', 'Teşekkür'], ['🎉', 'Kutlama'],
    ['❤️', 'Kalp'], ['🔥', 'Ateş'], ['✅', 'Onay'], ['😢', 'Üzüntü'], ['😮', 'Şaşkınlık'],
].map(([value, name]) => ({ value, name }));
export const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'].map(value => EMOJIS.find(item => item.value === value));
export const emojiName = value => EMOJIS.find(item => item.value === value)?.name || value;
export const searchText = text => text.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '');

const segmenter = new Intl.Segmenter('tr', { granularity: 'grapheme' });
export function insertEmoji(text, start, end, emoji) {
    const collapsed = start === end;
    for (const { index, segment } of segmenter.segment(text)) {
        const after = index + segment.length;
        if (start > index && start < after) start = collapsed ? after : index;
        if (end > index && end < after) end = after;
    }
    const next = text.slice(0, start) + emoji + text.slice(end);
    return next.length <= 2000 ? { text: next, caret: start + emoji.length } : null;
}
