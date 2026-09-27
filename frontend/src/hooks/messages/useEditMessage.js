import apiFetch from '../../utils/apiFetch';
import { useRef, useState } from 'react';
import useConversation from '../../zustand/useConversation';

const useEditMessage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(false);
    const editMessage = async (messageId, newMessage) => {
        if (pending.current || !newMessage.trim() || newMessage.length > 2000) return false;
        pending.current = true;
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/messages/edit/${messageId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMessage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Mesaj düzenlenemedi. Tekrar dene.');
            useConversation.getState().setMessageEdited({ messageId, newMessage: data.updatedMessage.message,
                editedAt: data.updatedMessage.editedAt });
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') setError('Mesaj düzenlenemedi. Tekrar dene.');
            return false;
        } finally {
            pending.current = false;
            setLoading(false);
        }
    };
    return { editMessage, loading, error, clearError: () => setError('') };
};
export default useEditMessage;
