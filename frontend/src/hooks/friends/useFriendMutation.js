import { useEffect, useRef, useState } from 'react';
import apiFetch from '../../utils/apiFetch';
import useAuth from '../../zustand/useAuth';
import useFriendStore from '../../zustand/useFriend';
import { refreshConversationStatuses } from '../../utils/refreshConversations';

// Shared by the list and the chat header, including two mounted accept buttons.
const pendingTargets = new Set();
export default function useFriendMutation(kind) {
    const [pendingId, setPendingId] = useState(null);
    const [error, setError] = useState('');
    const [errorId, setErrorId] = useState(null);
    const request = useRef(null);
    const sessionVersion = useAuth(state => state.sessionVersion);
    useEffect(() => () => request.current?.abort(), [sessionVersion]);
    const mutate = async (id, response) => {
        const key = `${sessionVersion}:${kind === 'remove' ? 'person' : 'request'}:${id}`;
        if (request.current || pendingTargets.has(key)) return false;
        const controller = new AbortController();
        request.current = controller;
        pendingTargets.add(key);
        setPendingId(id); setError(''); setErrorId(null);
        const action = kind === 'respond' ? response : kind;
        const messages = { accept: 'İstek kabul edilemedi.', reject: 'İstek reddedilemedi.',
            cancel: 'İstek iptal edilemedi.', remove: 'Arkadaş çıkarılamadı.' };
        try {
            const result = await apiFetch(kind === 'respond' ? '/api/friends/respond' : `/api/friends/${kind}/${id}`, {
                method: kind === 'respond' ? 'POST' : 'DELETE', signal: controller.signal,
                ...(kind === 'respond' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, response }) } : {}),
            });
            if (!result.ok) throw new Error('mutation failed');
            await result.json();
            if (controller.signal.aborted) return false;
            // Re-read canonical lists: a late success must never undo a newer removal.
            useFriendStore.getState().invalidateFriendLists();
            if (action === 'accept') refreshConversationStatuses();
            return true;
        } catch (err) {
            if (!controller.signal.aborted && err.name !== 'AbortError') {
                setError(`${messages[action]} Tekrar dene.`); setErrorId(id);
            }
            return false;
        } finally {
            pendingTargets.delete(key);
            if (request.current === controller) request.current = null;
            if (!controller.signal.aborted) setPendingId(null);
        }
    };
    return { mutate, pendingId, loading: pendingId !== null, error, errorId };
}
