import { useEffect, useRef, useState } from 'react';
import apiFetch from '../../utils/apiFetch';
import useConversation from '../../zustand/useConversation';

export default function useDeleteMessage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);
    const deleteMessage = async (id) => {
        if (pending.current) return false;
        const controller = new AbortController();
        pending.current = controller;
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch(`/api/messages/${id}`, { method: 'DELETE', signal: controller.signal });
            if (!response.ok) {
                setError(response.status === 403 ? 'Bu mesajı silme yetkin yok.' : response.status === 404 ?
                    'Mesaj bulunamadı.' : 'Mesaj silinemedi. Tekrar dene.');
                return false;
            }
            const data = await response.json();
            if (data.deletedMessage?._id !== id || !data.deletedMessage.isDeleted) {
                setError('Mesaj silinemedi. Tekrar dene.');
                return false;
            }
            useConversation.getState().markMessageDeleted(id);
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') setError(err instanceof SyntaxError ?
                'Mesaj silinemedi. Tekrar dene.' : 'Bağlantı kurulamadı. Tekrar dene.');
            return false;
        } finally {
            pending.current = null;
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return { deleteMessage, loading, error };
}
