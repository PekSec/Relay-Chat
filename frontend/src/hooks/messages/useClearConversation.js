import { useEffect, useRef, useState } from 'react';
import apiFetch from '../../utils/apiFetch';
import clearConversationHistory from '../../utils/clearConversationHistory';

export default function useClearConversation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);
    const clearConversation = async peerId => {
        if (pending.current) return false;
        const controller = new AbortController();
        pending.current = controller;
        setLoading(true); setError('');
        try {
            const response = await apiFetch(`/api/messages/clear/${peerId}`, { method: 'DELETE', signal: controller.signal });
            if (!response.ok) {
                setError(response.status === 404 ? 'Sohbet bulunamadı.' : 'Geçmiş temizlenemedi. Tekrar dene.');
                return false;
            }
            const data = await response.json();
            if (data.clearedThrough !== null && !/^[a-f\d]{24}$/.test(data.clearedThrough)) {
                setError('Geçmiş temizlenemedi. Tekrar dene.');
                return false;
            }
            if (controller.signal.aborted) return false;
            clearConversationHistory({ peerId, clearedThrough: data.clearedThrough });
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') setError(err instanceof SyntaxError ?
                'Geçmiş temizlenemedi. Tekrar dene.' : 'Bağlantı kurulamadı. Tekrar dene.');
            return false;
        } finally {
            pending.current = null;
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return { clearConversation, loading, error };
}
