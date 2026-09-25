import useTheme from '../zustand/useTheme';

export default function ThemeSelect() {
    const { preference, changing, setPreference } = useTheme();
    return (
        <label className="theme-control">
            <span>Tema</span>
            <select aria-label="Tema" value={preference} disabled={changing} onChange={event => setPreference(event.target.value)}>
                <option value="system">Sistem</option>
                <option value="light">Açık</option>
                <option value="dark">Koyu</option>
            </select>
        </label>
    );
}
