import { useEffect, useState } from 'react';
import apiFetch from '../../utils/apiFetch';
import useAuth from '../../zustand/useAuth';

export default function useSearchUsers(searchQuery) {
    const query = searchQuery.trim();
    const session = useAuth(state => state.sessionVersion);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    const validation = query && (!/^[a-zA-Z0-9_]+$/.test(query) || query.length > 20)
        ? '2–20 karakter kullan. Yalnızca A–Z harfleri, rakam ve alt çizgi yaz; arkadaş koduna # ekleme.' : '';
    const valid = query.length >= 2 && !validation;
    useEffect(() => {
        setResult(null);
        if (!valid) return;
        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                const response = await apiFetch(`/api/friends/search?query=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!response.ok) throw new Error('search failed');
                const users = await response.json();
                if (!controller.signal.aborted) setResult({ query, session, attempt, users });
            } catch (error) {
                if (!controller.signal.aborted && error.name !== 'AbortError') {
                    setResult({ query, session, attempt, error: 'Arama tamamlanamadı. Tekrar dene.' });
                }
            }
        }, 350);
        return () => { clearTimeout(timeout); controller.abort(); };
    }, [query, session, attempt, valid]);
    const current = valid && result?.query === query && result.session === session && result.attempt === attempt ? result : null;
    return { query, validation, users: current?.users || [], loading: valid && !current,
        error: current?.error || '', retry: () => setAttempt(value => value + 1) };
}
