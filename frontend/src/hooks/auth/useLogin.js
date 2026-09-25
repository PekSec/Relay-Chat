import { useEffect, useRef, useState } from 'react';
import { notifySessionChange } from '../../utils/sessionEvents';
import apiFetch from '../../utils/apiFetch';
import useAuth from '../../zustand/useAuth';

export default function useLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);

    const login = async (values) => {
        if (pending.current) return;
        const controller = new AbortController();
        pending.current = controller;
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch('/api/auth/login', {
                method: 'POST', signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            if (!response.ok) {
                setError(response.status === 429 ? 'Çok fazla giriş denemesi. Bir süre sonra tekrar dene.' :
                    [400, 401].includes(response.status) ? 'Kullanıcı adı veya parola hatalı.' :
                        'Giriş yapılamadı. Tekrar dene.');
                return;
            }
            const data = await response.json();
            const user = data.user || data;
            if (!user?._id) {
                setError('Giriş yapılamadı. Tekrar dene.');
                return;
            }
            useAuth.getState().setAuthUser(user);
            notifySessionChange();
        } catch (err) {
            if (err.name !== 'AbortError') setError(err instanceof SyntaxError ?
                'Giriş yapılamadı. Tekrar dene.' : 'Bağlantı kurulamadı. Tekrar dene.');
        } finally {
            pending.current = null;
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return { loading, error, login };
}
