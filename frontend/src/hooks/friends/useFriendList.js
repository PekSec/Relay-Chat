import { useCallback, useEffect, useRef, useState } from 'react';
import useSocket from '../../zustand/useSocket';
import useAuth from '../../zustand/useAuth';
import useFriendStore from '../../zustand/useFriend';
import apiFetch from '../../utils/apiFetch';

// Shared cancellation and reconnect refresh for the four account-scoped lists.
const useFriendList = (endpoint, field, key) => {
    const userId = useAuth(state => state.authUser?._id);
    const connectionVersion = useSocket(state => state.connectionVersion);
    const friendListVersion = useFriendStore(state => key === 'messageRequests' ? 0 : state.friendListVersion);
    const data = useFriendStore(state => state[key]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const request = useRef(null);
    const refresh = useCallback(async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        if (!userId) return;
        setLoading(true);
        setError('');
        const version = useFriendStore.getState().friendListVersion;
        try {
            const response = await apiFetch(endpoint, { signal: controller.signal });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Liste yüklenemedi');
            let items = field ? result[field] || [] : result;
            if (key === 'messageRequests') {
                items = items.map(conversation => ({
                    ...conversation.participants.find(person => person._id !== userId),
                    conversationId: conversation._id,
                    lastMessage: conversation.messages[0] || null,
                    status: 'pending',
                })).filter(item => item._id && item.lastMessage && item.lastMessage.senderId !== userId);
            }
            if (!controller.signal.aborted) {
                if (key === 'messageRequests') useFriendStore.getState().setMessageRequests(items);
                else useFriendStore.getState().applyFriendList(key, items, version);
            }
        } catch (error) {
            if (!controller.signal.aborted && error.name !== 'AbortError') setError('Liste yüklenemedi. Tekrar dene.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [endpoint, field, key, userId]);
    useEffect(() => { refresh(); return () => request.current?.abort(); }, [refresh, connectionVersion, friendListVersion]);
    return { data, loading, error, refresh };
};
export default useFriendList;
