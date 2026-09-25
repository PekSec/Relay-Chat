import { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import Textfield from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Toggle from '@atlaskit/toggle';
import Avatar from '@atlaskit/avatar';
import { Label, HelperMessage, ErrorMessage } from '@atlaskit/form';
import CrossIcon from '@atlaskit/icon/core/cross';
import CopyIcon from '@atlaskit/icon/core/copy';
import CheckIcon from '@atlaskit/icon/core/check-mark';
import PersonIcon from '@atlaskit/icon/core/person';
import LockIcon from '@atlaskit/icon/core/lock-locked';
import PaletteIcon from '@atlaskit/icon/core/paint-palette';
import ChatIcon from '@atlaskit/icon/core/chat-widget';
import useAuth from '../../zustand/useAuth';
import useTheme from '../../zustand/useTheme';
import useUpdateProfile from '../../hooks/auth/useUpdateProfile';
import useChangePassword from '../../hooks/auth/useChangePassword';
import apiFetch from '../../utils/apiFetch';
import { passwordIsValid } from '../../utils/password';
import { ACCENTS } from '../../utils/preferences';

const sections = [
    { value: 'profile', label: 'Profil', icon: PersonIcon },
    { value: 'password', label: 'Güvenlik', icon: LockIcon },
    { value: 'appearance', label: 'Görünüm', icon: PaletteIcon },
    { value: 'messaging', label: 'Mesaj ve ses', icon: ChatIcon },
];

function PreferenceSelect({ id, label, value, options, onChange, disabled }) {
    const choices = options.map(([value, label]) => ({ value, label }));
    return <div className="settings-field">
        <Label htmlFor={id}>{label}</Label>
        <Select inputId={id} instanceId={id} options={choices} value={choices.find(option => option.value === value)}
            onChange={option => onChange(option.value)} isSearchable={false} isDisabled={disabled} />
    </div>;
}

export default function SettingsModal({ onClose }) {
    const authUser = useAuth(state => state.authUser);
    const preferences = useTheme(state => state.preferences);
    const saved = useTheme(state => state.saved);
    const preview = useTheme(state => state.preview);
    const { updateProfile, loading: savingProfile } = useUpdateProfile();
    const { changePassword, loading: savingPassword } = useChangePassword();
    const [section, setSection] = useState('profile');
    const [fullName, setFullName] = useState(authUser.fullName);
    const [profilePic, setProfilePic] = useState(authUser.profilePic || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [copyState, setCopyState] = useState('');

    // Also rolls back if logout or navigation unmounts the modal.
    useEffect(() => () => useTheme.getState().cancelPreview(), []);

    const busy = saving || savingProfile || savingPassword;
    const dirty = Object.keys(saved).some(key => saved[key] !== preferences[key]);
    const nameValid = fullName.trim().length > 0 && fullName.trim().length <= 50;
    const picValid = profilePic === '' || (/^https:\/\/\S+$/i.test(profilePic) && profilePic.length <= 2048);
    const profileChanged = fullName !== authUser.fullName || profilePic !== (authUser.profilePic || '');
    const passwordValid = passwordIsValid(newPassword);
    const passwordsMatch = newPassword === confirmPassword;
    const personalizing = section === 'appearance' || section === 'messaging';
    const close = () => { if (!busy) onClose(); };
    const changePreference = (key, value) => {
        setFeedback('');
        setError('');
        preview({ [key]: value });
    };
    const savePreferences = async () => {
        if (busy || !dirty) return;
        setSaving(true);
        setError('');
        setFeedback('');
        try {
            const changes = Object.fromEntries(Object.entries(preferences).filter(([key, value]) => value !== saved[key]));
            const response = await apiFetch('/api/auth/preferences', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Tercihler kaydedilemedi. Tekrar dene.');
            useAuth.getState().setAuthUser({ ...useAuth.getState().authUser, preferences: data.preferences });
            setFeedback('Tercihler kaydedildi.');
        } catch (error) {
            if (error.name !== 'AbortError') setError(error.message);
        } finally {
            setSaving(false);
        }
    };
    const saveProfile = async event => {
        event.preventDefault();
        if (busy || !nameValid || !picValid || !profileChanged) return;
        await updateProfile({ fullName: fullName.trim(), profilePic });
    };
    const savePassword = async event => {
        event.preventDefault();
        if (busy || !currentPassword || !passwordValid || !passwordsMatch) return;
        if (await changePassword(currentPassword, newPassword)) {
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        }
    };
    const copyCode = async () => {
        try { await navigator.clipboard.writeText(authUser.friendCode); setCopyState('Kopyalandı'); }
        catch { setCopyState('Kopyalanamadı. Kodu seçip kopyalayabilirsin.'); }
    };

    return <Modal onClose={close} width="large" testId="settings-modal">
        <ModalHeader>
            <div className="settings-header">
                <ModalTitle>Hesap ayarları</ModalTitle>
                <IconButton icon={CrossIcon} label="Kapat" appearance="subtle" onClick={close} isDisabled={busy} />
            </div>
        </ModalHeader>
        <ModalBody>
            <div className="settings-layout">
                <nav aria-label="Ayarlar bölümleri" className="settings-navigation">
                    {sections.map(item => <Button key={item.value} appearance="subtle" isSelected={section === item.value}
                        aria-current={section === item.value ? 'page' : undefined}
                        iconBefore={item.icon} onClick={() => setSection(item.value)} shouldFitContainer>
                        {item.label}
                    </Button>)}
                </nav>
                <div className="settings-mobile-section">
                    <Label htmlFor="settings-section">Ayarlar bölümü</Label>
                    <Select inputId="settings-section" instanceId="settings-section" options={sections}
                        value={sections.find(item => item.value === section)} isSearchable={false}
                        onChange={item => setSection(item.value)} />
                </div>
                <div className="settings-content">
                    {section === 'profile' && <form id="settings-profile" onSubmit={saveProfile} className="settings-form">
                        <div className="settings-intro"><h2>Profil</h2></div>
                        <div className="settings-profile-preview">
                            <Avatar name={fullName || authUser.username} src={picValid ? profilePic : ''} size="large" />
                            <div><strong>{fullName || 'İsimsiz'}</strong><p>@{authUser.username}</p></div>
                        </div>
                        <div className="settings-field">
                            <Label htmlFor="set-fullname">Görünen ad</Label>
                            <Textfield id="set-fullname" value={fullName} onChange={event => setFullName(event.target.value)}
                                maxLength={50} isRequired isInvalid={!nameValid} isDisabled={busy} aria-describedby={!nameValid ? 'name-error' : undefined} />
                            {!nameValid && <ErrorMessage><span id="name-error">Ad 1–50 karakter olmalı.</span></ErrorMessage>}
                        </div>
                        <div className="settings-field">
                            <Label htmlFor="set-pic">Avatar adresi</Label>
                            <Textfield id="set-pic" type="url" value={profilePic} onChange={event => setProfilePic(event.target.value)}
                                maxLength={2048} placeholder="https://..." isInvalid={!picValid} isDisabled={busy} aria-describedby="pic-help" />
                            <div id="pic-help">{picValid ? <HelperMessage>Boş bırakırsan varsayılan avatar kullanılır.</HelperMessage>
                                : <ErrorMessage>En fazla 2048 karakterlik bir HTTPS adresi kullan.</ErrorMessage>}</div>
                        </div>
                        <div className="settings-field">
                            <Label htmlFor="settings-username">Kullanıcı adı</Label>
                            <Textfield id="settings-username" value={authUser.username} isReadOnly />
                            <HelperMessage>Kullanıcı adı değiştirilemez.</HelperMessage>
                        </div>
                        <div className="settings-friend-code">
                            <div><p>Arkadaş kodun</p><strong>{authUser.friendCode}</strong></div>
                            <Button iconBefore={copyState === 'Kopyalandı' ? CheckIcon : CopyIcon} onClick={copyCode}>Kopyala</Button>
                        </div>
                        {copyState && <p role="status" className="settings-help">{copyState}</p>}
                    </form>}
                    {section === 'password' && <form id="settings-password" onSubmit={savePassword} className="settings-form">
                        <div className="settings-intro"><h2>Şifre değiştir</h2><p>Şifren değiştiğinde diğer oturumların kapatılır.</p></div>
                        <div className="settings-field">
                            <Label htmlFor="set-current">Mevcut şifre</Label>
                            <Textfield id="set-current" type="password" autoComplete="current-password" isRequired
                                value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} isDisabled={busy} />
                        </div>
                        <div className="settings-field">
                            <Label htmlFor="set-new">Yeni şifre</Label>
                            <Textfield id="set-new" type="password" autoComplete="new-password" isRequired
                                value={newPassword} onChange={event => setNewPassword(event.target.value)}
                                isInvalid={!!newPassword && !passwordValid} isDisabled={busy} aria-describedby="password-help" />
                            <div id="password-help"><HelperMessage>En az 8 karakter, en fazla 72 UTF-8 bayt.</HelperMessage></div>
                        </div>
                        <div className="settings-field">
                            <Label htmlFor="set-confirm">Yeni şifre tekrar</Label>
                            <Textfield id="set-confirm" type="password" autoComplete="new-password" isRequired
                                value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)}
                                isInvalid={!!confirmPassword && !passwordsMatch} isDisabled={busy}
                                aria-describedby={confirmPassword && !passwordsMatch ? 'password-error' : undefined} />
                            {confirmPassword && !passwordsMatch && <ErrorMessage><span id="password-error">Şifreler eşleşmiyor.</span></ErrorMessage>}
                        </div>
                    </form>}
                    {section === 'appearance' && <div className="settings-form">
                        <div className="settings-intro"><h2>Görünüm</h2></div>
                        <PreferenceSelect id="settings-theme" label="Tema" value={preferences.theme} disabled={busy}
                            options={[['system', 'Sistem'], ['light', 'Açık'], ['dark', 'Koyu']]} onChange={value => changePreference('theme', value)} />
                        <fieldset className="settings-colors">
                            <legend>Vurgu rengi</legend>
                            <p className="settings-help">Temel renkler</p>
                            <div className="settings-swatches" role="group" aria-label="Temel renkler">
                                {ACCENTS.slice(0, 10).map(([value, label]) => <Button key={value} shouldFitContainer
                                    appearance="subtle" isSelected={preferences.accent === value} aria-pressed={preferences.accent === value}
                                    onClick={() => changePreference('accent', value)} isDisabled={busy}
                                    iconBefore={() => <span aria-hidden="true" className="settings-swatch" style={{ background: 'var(--ds-background-accent-' + value + '-bolder)' }} />}>{label}</Button>)}
                            </div>
                            <p className="settings-help">Ek renkler</p>
                            <div className="settings-swatches" role="group" aria-label="Ek renkler">
                                {ACCENTS.slice(10).map(([value, label, color]) => <Button key={value} shouldFitContainer
                                    appearance="subtle" isSelected={preferences.accent === value} aria-pressed={preferences.accent === value}
                                    onClick={() => changePreference('accent', value)} isDisabled={busy}
                                    iconBefore={() => <span aria-hidden="true" className="settings-swatch" style={{ background: color }} />}>{label}</Button>)}
                            </div>
                        </fieldset>
                        <div className="settings-preview" aria-label="Görünüm önizlemesi">
                            <p className="settings-eyebrow">ÖNİZLEME</p>
                            <p className="settings-preview-message">Örnek mesaj</p>
                            <div><Button appearance="primary">Örnek buton</Button><a href="#settings-density">Görünümü ayarla</a></div>
                        </div>
                        <div className="settings-option-grid">
                            <PreferenceSelect id="settings-density" label="Yoğunluk" value={preferences.density} disabled={busy}
                                options={[['comfortable', 'Rahat'], ['compact', 'Kompakt']]} onChange={value => changePreference('density', value)} />
                            <PreferenceSelect id="settings-font" label="Yazı boyutu" value={preferences.fontSize} disabled={busy}
                                options={[['standard', 'Standart'], ['large', 'Büyük']]} onChange={value => changePreference('fontSize', value)} />
                        </div>
                    </div>}
                    {section === 'messaging' && <div className="settings-form">
                        <div className="settings-intro"><h2>Mesaj ve ses</h2></div>
                        <PreferenceSelect id="settings-send-key" label="Mesaj gönderme" value={preferences.sendKey} disabled={busy}
                            options={[['enter', 'Enter'], ['mod-enter', 'Ctrl / ⌘ + Enter']]} onChange={value => changePreference('sendKey', value)} />
                        <p className="settings-help">Shift + Enter her zaman yeni satır ekler.</p>
                        {[
                            ['chatSound', 'Sohbet içi ses', 'Açık sohbete gelen mesajlarda ses çal.'],
                            ['notificationSound', 'Bildirim sesi', 'Başka bir sohbete gelen mesajlarda ses çal.'],
                            ['messagePreviews', 'Mesaj önizlemeleri', 'Sohbet listesinde son mesajın içeriğini göster.'],
                        ].map(([key, label, description]) => <div className="settings-toggle" key={key}>
                            <div><Label htmlFor={'settings-' + key}>{label}</Label><p id={key + '-description'}>{description}</p></div>
                            <Toggle id={'settings-' + key} isChecked={preferences[key]} isDisabled={busy}
                                descriptionId={key + '-description'} onChange={event => changePreference(key, event.target.checked)} />
                        </div>)}
                    </div>}
                    {error && <p role="alert" className="settings-error">{error}</p>}
                    {feedback && <p role="status" className="settings-success">{feedback}</p>}
                </div>
            </div>
        </ModalBody>
        <ModalFooter>
            <div className="settings-footer">
                <p>{dirty ? 'Kaydedilmemiş tercihler var.' : 'Tercihlerin hesabında saklanır.'}</p>
                <div>
                    <Button onClick={close} isDisabled={busy}>Vazgeç</Button>
                    {personalizing ? <Button appearance="primary" onClick={savePreferences} isLoading={saving} isDisabled={busy || !dirty}>Tercihleri kaydet</Button>
                        : section === 'profile' ? <Button type="submit" form="settings-profile" appearance="primary" isLoading={savingProfile}
                            isDisabled={busy || !nameValid || !picValid || !profileChanged}>Değişiklikleri kaydet</Button>
                            : <Button type="submit" form="settings-password" appearance="primary" isLoading={savingPassword}
                                isDisabled={busy || !currentPassword || !passwordValid || !passwordsMatch}>Şifreyi değiştir</Button>}
                </div>
            </div>
        </ModalFooter>
    </Modal>;
}
