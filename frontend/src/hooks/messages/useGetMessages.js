import { useCallback, useEffect, useRef, useState } from 'react';
import useConversation from '../../zustand/useConversation';
import useSocket from '../../zustand/useSocket';
import apiFetch from '../../utils/apiFetch';

const useGetMessages = () => {
    const { messages, setMessages, selectedConversation } = useConversation();
    const connectionVersion = useSocket(state => state.connectionVersion);
    const id = selectedConversation?._id;
    const clearedThrough = useConversation(state => state.clearedThrough[id]);
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [olderError, setOlderError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const olderRequest = useRef(false);
    const requestVersion = useRef(0);
    const retry = useCallback(() => setAttempt(value => value + 1), []);

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        requestVersion.current += 1;
        olderRequest.current = false;
        setLoadingOlder(false);
        setLoading(true);
        setError('');
        setOlderError(false);
        (async () => {
            try {
                const loaded = useConversation.getState().messages;
                const loadedIds = new Set(loaded.map(message => message._id));
                const oldest = loaded[0]?._id;
                const data = [];
                let before, more;
                // Reconnect refreshes every already-loaded page, including missed edits/deletions.
                do {
                    const response = await apiFetch(`/api/messages/${id}?${before ? `before=${before}&` : ''}limit=50`, { signal: controller.signal });
                    const page = await response.json();
                    if (!response.ok) throw new Error('Mesajlar yüklenemedi.');
                    data.push(...page);
                    more = response.headers.get('X-Has-More') === 'true';
                    before = page[0]?._id;
                } while (oldest && more && before && before > oldest && !controller.signal.aborted);
                if (controller.signal.aborted || useConversation.getState().selectedConversation?._id !== id) return;
                // Preserve messages arriving over the socket while the history is in flight.
                setMessages(current => {
                    const byId = new Map(data.map(message => [message._id, message]));
                    for (const message of current) {
                        if (!loadedIds.has(message._id) || (byId.has(message._id) && message.isDeleted)) byId.set(message._id, message);
                    }
                    return [...byId.values()].sort((a, b) => a._id.localeCompare(b._id));
                });
                setHasMore(more);
            } catch (err) {
                if (err.name !== 'AbortError' && !controller.signal.aborted) setError('Mesajlar yüklenemedi. Tekrar dene.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => { controller.abort(); requestVersion.current += 1; };
    }, [id, connectionVersion, attempt, setMessages, clearedThrough]);

    const loadOlder = async () => {
        const first = useConversation.getState().messages[0]?._id;
        if (!id || !first || loading || olderRequest.current || !hasMore) return;
        olderRequest.current = true;
        const version = requestVersion.current;
        setLoadingOlder(true);
        setError('');
        setOlderError(false);
        try {
            const response = await apiFetch(`/api/messages/${id}?before=${first}&limit=50`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Önceki mesajlar yüklenemedi.');
            if (version !== requestVersion.current || useConversation.getState().selectedConversation?._id !== id) return;
            setMessages(current => {
                const known = new Set(current.map(message => message._id));
                return [...data.filter(message => !known.has(message._id)), ...current];
            });
            setHasMore(response.headers.get('X-Has-More') === 'true');
        } catch (err) {
            if (err.name !== 'AbortError' && version === requestVersion.current) {
                setError('Önceki mesajlar yüklenemedi. Tekrar dene.');
                setOlderError(true);
            }
        } finally {
            if (version === requestVersion.current) {
                olderRequest.current = false;
                setLoadingOlder(false);
            }
        }
    };
    return { messages, loading, loadingOlder, hasMore, error, olderError, retry, loadOlder };
};
export default useGetMessages;
