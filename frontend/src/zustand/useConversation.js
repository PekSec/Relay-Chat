import { create } from 'zustand';

const markDeleted = (message, ids) => ids.has(message?._id) ?
    { ...message, message: 'Bu mesaj silindi', isDeleted: true } : message;
const visibleAfterClear = (message, boundary) => !message || !boundary || message._id > boundary;
const applyReaction = (message, updates) => !message.isDeleted && updates[message._id]?.reactionVersion > (message.reactionVersion || 0) ?
    { ...message, reactions: updates[message._id].reactions, reactionVersion: updates[message._id].reactionVersion } : message;
const applyEdit = (message, updates) => message && !message.isDeleted &&
    updates[message._id]?.editedAt > (message.editedAt || '') ? {
        ...message, message: updates[message._id].newMessage, isEdited: true, editedAt: updates[message._id].editedAt,
    } : message;
const normalizePreview = (conversation, ids, clearedThrough, edits, previous) => {
    if (!conversation) return conversation;
    const boundary = clearedThrough[conversation._id];
    const incoming = conversation.lastMessage;
    const newer = previous?.lastMessage;
    const message = newer && ((incoming && newer._id > incoming._id) ||
        (boundary && (!incoming || incoming._id <= boundary) && newer._id > boundary)) ? newer : incoming;
    return { ...conversation, lastMessage: visibleAfterClear(message, boundary) ? markDeleted(applyEdit(message, edits), ids) : null };
};

const useConversation = create((set) => ({
    // Keep deletion events until session reset, including messages not loaded yet.
    deletedMessageIds: new Set(),
    editUpdates: {},
    setMessageEdited: (update) => set(state => {
        if (!update.editedAt || update.editedAt <= (state.editUpdates[update.messageId]?.editedAt || '')) return state;
        const editUpdates = { ...state.editUpdates, [update.messageId]: update };
        const preview = item => normalizePreview(item, state.deletedMessageIds, state.clearedThrough, editUpdates);
        return { editUpdates, messages: state.messages.map(message => applyEdit(message, editUpdates)),
            conversations: state.conversations.map(preview), selectedConversation: preview(state.selectedConversation) };
    }),
    reactionUpdates: {},
    setMessageReactions: (update) => set(state => {
        if (update.reactionVersion <= (state.reactionUpdates[update.messageId]?.reactionVersion || 0)) return state;
        const reactionUpdates = { ...state.reactionUpdates, [update.messageId]: update };
        return { reactionUpdates, messages: state.messages.map(message => applyReaction(message, reactionUpdates)) };
    }),
    clearedThrough: {},
    clearHistory: (peerId, boundary) => set(state => {
        if (!boundary || boundary <= (state.clearedThrough[peerId] || '')) return state;
        const clearedThrough = { ...state.clearedThrough, [peerId]: boundary };
        return {
            clearedThrough,
            messages: state.selectedConversation?._id === peerId ?
                state.messages.filter(message => visibleAfterClear(message, boundary)) : state.messages,
            conversations: state.conversations.map(item => normalizePreview(item, state.deletedMessageIds, clearedThrough, state.editUpdates))
                .filter(item => item.status !== 'pending' || item.lastMessage),
            selectedConversation: normalizePreview(state.selectedConversation, state.deletedMessageIds, clearedThrough, state.editUpdates),
        };
    }),
    selectedConversation: null,
    setSelectedConversation: (conversation) => set((state) => ({
        selectedConversation: normalizePreview(conversation, state.deletedMessageIds, state.clearedThrough, state.editUpdates,
            state.selectedConversation?._id === conversation?._id ? state.selectedConversation : undefined),
        ...(state.selectedConversation?._id !== conversation?._id ? { messages: [] } : {}),
    })),
    messages: [],
    markMessageDeleted: (id) => set(state => {
        const deletedMessageIds = new Set(state.deletedMessageIds).add(id);
        return {
            deletedMessageIds,
            messages: state.messages.map(message => markDeleted(message, deletedMessageIds)),
            conversations: state.conversations.map(conversation => normalizePreview(conversation, deletedMessageIds, state.clearedThrough, state.editUpdates)),
            selectedConversation: normalizePreview(state.selectedConversation, deletedMessageIds, state.clearedThrough, state.editUpdates),
        };
    }),
    setMessages: (messages) => set((state) => ({
        messages: (typeof messages === 'function' ? messages(state.messages) : messages)
            .filter(message => visibleAfterClear(message, state.clearedThrough[state.selectedConversation?._id]))
            .map(message => applyReaction(message, state.reactionUpdates))
            .map(message => applyEdit(message, state.editUpdates))
            .map(message => markDeleted(message, state.deletedMessageIds)),
    })),
    conversations: [],
    setConversations: (conversations) => set((state) => {
        const previous = new Map(state.conversations.map(item => [item._id, item]));
        return { conversations: (typeof conversations === 'function' ? conversations(state.conversations) : conversations)
            .map(conversation => normalizePreview(conversation, state.deletedMessageIds, state.clearedThrough, state.editUpdates, previous.get(conversation._id)))
            .filter(item => item.status !== 'pending' || item.lastMessage)
            .sort((a, b) => (b.lastMessage?._id || '').localeCompare(a.lastMessage?._id || '')) };
    }),
    isConversationsLoaded: false,
    setIsConversationsLoaded: (value) => set({ isConversationsLoaded: value }),
    reset: () => set({ selectedConversation: null, messages: [], conversations: [], isConversationsLoaded: false, deletedMessageIds: new Set(), clearedThrough: {}, reactionUpdates: {}, editUpdates: {} }),
}));
export default useConversation;
