import Select from '@atlaskit/select';
import { Label } from '@atlaskit/form';
import useTheme from '../zustand/useTheme';

const options = [{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Açık' }, { value: 'dark', label: 'Koyu' }];

export default function ThemeSelect() {
    const { preference, changing, setPreference } = useTheme();
    return <div className="theme-control">
        <Label htmlFor="guest-theme">Tema</Label>
        <Select inputId="guest-theme" instanceId="guest-theme" options={options}
            value={options.find(option => option.value === preference)}
            onChange={option => setPreference(option.value)} isSearchable={false} isDisabled={changing} />
    </div>;
}
