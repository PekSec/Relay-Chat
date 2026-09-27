import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import NotificationIcon from '@atlaskit/icon/core/notification';
import IconButton from '@atlaskit/button/icon/button';
import Tooltip from '@atlaskit/tooltip';
import ChatAvatar from '../ChatAvatar';
import SettingsIcon from '@atlaskit/icon/core/settings';
import Avatar from '../Avatar';
import useAuth from '../../zustand/useAuth';
import useFriendStore from '../../zustand/useFriend';

const SettingsModal = lazy(() => import('../modals/SettingsModal'));

export default function UserInfo({ onNotificationClick }) {
    const user = useAuth(state => state.authUser);
    const incoming = useFriendStore(state => state.incomingFriendRequests);
    const messages = useFriendStore(state => state.messageRequests);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const dropdown = useRef(null);
    const trigger = useRef(null);
    const count = incoming.length + messages.length;

    useEffect(() => {
        if (!showNotifications) return;
        const outside = event => { if (!dropdown.current?.contains(event.target)) setShowNotifications(false); };
        const escape = event => {
            if (event.key === 'Escape') { setShowNotifications(false); trigger.current?.focus(); }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [showNotifications]);

    const notifications = [
        ...incoming.map(request => ({ id: request._id, person: request.senderId, destination: 'friends', label: 'Arkadaşlık isteği gönderdi' })),
        ...messages.map(request => ({ id: request.conversationId || request._id, person: request, destination: 'requests', label: 'Mesaj isteği gönderdi' })),
    ];

    return (
        <div className="relative px-5 py-4 flex items-center gap-3">
            <ChatAvatar name={user?.fullName} src={user?.profilePic} size="medium" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-[11px] text-[color:var(--text-muted)] truncate">Arkadaş kodun: #{user?.friendCode}</p>
            </div>
            <Tooltip content="Hesap ayarları"><IconButton icon={SettingsIcon} appearance="subtle" title="Hesap ayarları" label="Hesap ayarları" onClick={() => setShowSettings(true)} /></Tooltip>
            <div className="relative" ref={dropdown}>
                <Tooltip content="Bildirimler"><IconButton ref={trigger} icon={NotificationIcon} appearance="subtle" title="Bildirimler" label={`Bildirimler${count ? ` (${count})` : ''}`} aria-expanded={showNotifications} aria-controls="notifications" onClick={() => setShowNotifications(value => !value)} /></Tooltip>
                {count > 0 && <span className="notification-count pointer-events-none" aria-hidden="true">{count}</span>}
                {showNotifications && <section id="notifications" aria-label="Bildirimler" className="notification-panel">
                    <h2 className="p-4 font-semibold text-sm border-b border-[color:var(--border-subtle)]">Bildirimler ({count})</h2>
                    <div className="max-h-[50dvh] overflow-y-auto scroll-slim">
                        {count === 0 ? <p className="p-6 text-sm text-center text-[color:var(--text-muted)]">Yeni bildirim yok</p> : notifications.map(item => <button key={`${item.destination}-${item.id}`} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[color:var(--bg-hover)]" onClick={() => { setShowNotifications(false); onNotificationClick(item.destination); }}>
                            <Avatar name={item.person?.fullName} src={item.person?.profilePic} alt="" className="w-8 h-8 avatar-ring" />
                            <span className="min-w-0"><span className="block text-sm font-medium truncate">{item.person?.fullName || item.person?.username || 'Kullanıcı'}</span><span className="block text-xs text-[color:var(--text-muted)]">{item.label}</span></span>
                        </button>)}
                    </div>
                </section>}
            </div>
            {showSettings && <Suspense fallback={<span role="status">Ayarlar yükleniyor…</span>}><SettingsModal onClose={() => setShowSettings(false)} /></Suspense>}
        </div>
    );
}
