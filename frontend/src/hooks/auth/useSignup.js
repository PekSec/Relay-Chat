import { useEffect, useRef, useState } from 'react';
import { notifySessionChange } from '../../utils/sessionEvents';
import apiFetch from '../../utils/apiFetch';
import useAuth from '../../zustand/useAuth';

export default function useSignup() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);

    const signUp = async (values) => {
        if (pending.current) return;
        const controller = new AbortController();
        pending.current = controller;
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch('/api/auth/signup', {
                method: 'POST', signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            // A proxy may return HTML; never expose upstream response text.
            let data;
            try { data = await response.json(); }
            catch (err) { if (!(err instanceof SyntaxError)) throw err; }
            if (!response.ok) {
                if (response.status === 400 && data?.code === 'USERNAME_TAKEN') {
                    return { username: 'Bu kullanıcı adı kullanılıyor.' };
                }
                setError(response.status === 503 && data?.code === 'ACCOUNT_CREATED_LOGIN_REQUIRED' ?
                    'Hesap oluşturuldu. Oturum açılamadı; giriş yap.' : response.status === 429 ?
                        'Çok fazla kayıt denemesi. Bir süre sonra tekrar dene.' : 'Hesap oluşturulamadı. Tekrar dene.');
                return;
            }
            const user = data?.user || data;
            if (!user?._id) {
                setError('Hesap oluşturulamadı. Tekrar dene.');
                return;
            }
            useAuth.getState().setAuthUser(user);
            notifySessionChange();
        } catch (err) {
            if (err.name !== 'AbortError') setError('Bağlantı kurulamadı. Tekrar dene.');
        } finally {
            pending.current = null;
            if (!controller.signal.aborted) setLoading(false);
        }
    };
    return { loading, error, signUp };
}
