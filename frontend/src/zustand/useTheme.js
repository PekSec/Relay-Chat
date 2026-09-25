import { create } from 'zustand';
import { setGlobalTheme } from '@atlaskit/tokens/set-global-theme';
import toast from 'react-hot-toast';
import { DEFAULT_PREFERENCES } from '../utils/preferences';

let guestTheme = 'system';
try {
    const saved = localStorage.getItem('relay-theme');
    if (['system', 'light', 'dark'].includes(saved)) guestTheme = saved;
} catch { /* Theme switching still works when storage is unavailable. */ }

// Serialize ADS theme loads so a late preview cannot undo cancel/logout.
let themeTask = Promise.resolve();
const applyTheme = theme => {
    themeTask = themeTask.catch(() => {}).then(() => setGlobalTheme({
        light: 'light', dark: 'dark', colorMode: theme === 'system' ? 'auto' : theme,
    }));
    return themeTask;
};
const applyPreferences = preferences => {
    Object.assign(document.documentElement.dataset, {
        accent: preferences.accent, density: preferences.density, fontSize: preferences.fontSize,
    });
    return applyTheme(preferences.theme);
};
const guestPreferences = () => ({ ...DEFAULT_PREFERENCES, theme: guestTheme });
const samePreferences = (a, b) => Object.keys(DEFAULT_PREFERENCES).every(key => a[key] === b[key]);

const useTheme = create((set, get) => ({
    userId: null,
    saved: guestPreferences(),
    preferences: guestPreferences(),
    preference: guestTheme,
    changing: false,
    loadAccount: user => {
        const userId = user?._id || null;
        const preferences = user ? { ...DEFAULT_PREFERENCES, ...user.preferences } : guestPreferences();
        // Profile updates must not discard an unsaved appearance preview.
        if (userId === get().userId && samePreferences(preferences, get().saved)) return;
        set({ userId, saved: preferences, preferences, preference: preferences.theme });
        applyPreferences(preferences).catch(() => toast.error('Tema yüklenemedi. Tekrar dene.'));
    },
    preview: update => {
        const preferences = { ...get().preferences, ...update };
        set({ preferences, preference: preferences.theme });
        applyPreferences(preferences).catch(() => toast.error('Tema yüklenemedi. Tekrar dene.'));
    },
    cancelPreview: () => {
        const preferences = get().saved;
        set({ preferences, preference: preferences.theme });
        applyPreferences(preferences).catch(() => toast.error('Tema yüklenemedi. Tekrar dene.'));
    },
    setPreference: async preference => {
        if (get().userId || !['system', 'light', 'dark'].includes(preference)) return;
        set({ changing: true });
        try {
            await applyTheme(preference);
            guestTheme = preference;
            if (!get().userId) set({ preference, preferences: guestPreferences(), saved: guestPreferences() });
            try { localStorage.setItem('relay-theme', preference); } catch { /* Optional persistence. */ }
        } catch {
            toast.error('Tema değiştirilemedi. Tekrar dene.');
        } finally {
            set({ changing: false });
        }
    },
}));

export const initializeTheme = () => applyPreferences(guestPreferences());
export default useTheme;
