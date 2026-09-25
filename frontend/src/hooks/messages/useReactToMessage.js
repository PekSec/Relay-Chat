import apiFetch from '../../utils/apiFetch';
import { useEffect, useRef, useState } from 'react';
import useConversation from '../../zustand/useConversation';

export default function useReactToMessage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);
    const react = async (messageId, emoji) => {
        if (pending.current) return false;
        const controller = new AbortController();
        pending.current = controller;
        setLoading(true); setError('');
        try {
            const response = await apiFetch(`/api/messages/react/${messageId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji }), signal: controller.signal,
            });
            if (!response.ok) {
                setError(response.status === 400 || response.status === 404 ?
                    'Bu mesaja tepki verilemiyor.' : 'Tepki kaydedilemedi. Tekrar dene.');
                return false;
            }
            const data = await response.json();
            if (!Array.isArray(data.reactions) || !Number.isInteger(data.reactionVersion)) {
                setError('Tepki kaydedilemedi. Tekrar dene.'); return false;
            }
            if (controller.signal.aborted) return false;
            useConversation.getState().setMessageReactions({ messageId, ...data });
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') setError(err instanceof SyntaxError ?
                'Tepki kaydedilemedi. Tekrar dene.' : 'Bağlantı kurulamadı. Tekrar dene.');
            return false;
        } finally {
            pending.current = null;
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return { react, loading, error, clearError: () => setError('') };
}
