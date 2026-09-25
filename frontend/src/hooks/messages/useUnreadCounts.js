import { useEffect } from 'react';
import useUnread from '../../zustand/useUnread';
import useAuth from '../../zustand/useAuth';
import useSocket from '../../zustand/useSocket';
import apiFetch from '../../utils/apiFetch';
import useConversation from '../../zustand/useConversation';

const useUnreadCounts = () => {
    const userId = useAuth(state => state.authUser?._id);
    const connectionVersion = useSocket(state => state.connectionVersion);
    const clearedThrough = useConversation(state => state.clearedThrough);
    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();
        (async () => {
            try {
                while (!controller.signal.aborted) {
                    const before = useUnread.getState().counts;
                    const response = await apiFetch('/api/messages/unread/counts', { signal: controller.signal });
                    if (!response.ok) return;
                    const counts = await response.json();
                    if (controller.signal.aborted) return;
                    // A socket message/read changed counts during the request; fetch a fresh snapshot.
                    if (useUnread.getState().counts !== before) continue;
                    useUnread.getState().setCounts(counts);
                    return;
                }
            } catch { /* A reconnect refreshes unread counts again. */ }
        })();
        return () => controller.abort();
    }, [userId, connectionVersion, clearedThrough]);
};
export default useUnreadCounts;
