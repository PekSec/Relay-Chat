import { useEffect, useRef, useState } from 'react';
import useFriendStore from '../../zustand/useFriend';
import useAuth from '../../zustand/useAuth';
import apiFetch from '../../utils/apiFetch';

// Also guards the chat header while the search modal is mounted.
const pendingTargets = new Set();
export default function useSendFriendRequest() {
    const session = useAuth(state => state.sessionVersion);
    const requests = useRef(new Map());
    const [pendingIds, setPendingIds] = useState([]);
    const [errors, setErrors] = useState({});
    useEffect(() => {
        const active = requests.current;
        setPendingIds([]); setErrors({});
        return () => { for (const controller of active.values()) controller.abort(); active.clear(); };
    }, [session]);
    const sendFriendRequest = async id => {
        const key = `${session}:${id}`;
        if (pendingTargets.has(key)) return false;
        const controller = new AbortController();
        requests.current.set(id, controller); pendingTargets.add(key);
        setPendingIds(ids => [...ids, id]); setErrors(errors => ({ ...errors, [id]: '' }));
        const current = () => !controller.signal.aborted && session === useAuth.getState().sessionVersion;
        try {
            const response = await apiFetch(`/api/friends/send/${id}`, { method: 'POST', signal: controller.signal });
            await response.json();
            if (!current()) return false;
            // Refresh even after a conflict: another tab may have changed the relationship.
            useFriendStore.getState().invalidateFriendLists();
            if (!response.ok) throw new Error(response.status === 409 ? 'conflict' : 'send failed');
            return true;
        } catch (error) {
            if (current() && error.name !== 'AbortError') setErrors(errors => ({ ...errors,
                [id]: error.message === 'conflict' ? 'Arkadaşlık durumu değişiyor. Tekrar dene.' : 'İstek gönderilemedi. Tekrar dene.' }));
            return false;
        } finally {
            pendingTargets.delete(key);
            if (requests.current.get(id) === controller) requests.current.delete(id);
            if (current()) setPendingIds(ids => ids.filter(value => value !== id));
        }
    };
    return { sendFriendRequest, loading: pendingIds.length > 0, pendingIds, errors };
}
