import ChevronRightIcon from '@atlaskit/icon/core/chevron-right';
import { lazy, Suspense, useState } from 'react';
import Popup from '@atlaskit/popup';
import PopupHeading from '../PopupHeading';
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
    const count = incoming.length + messages.length;

    const notifications = [
        ...incoming.map(request => ({ id: request._id, person: request.senderId, destination: 'friends', label: 'Arkadaşlık isteği gönderdi' })),
        ...messages.map(request => ({ id: request.conversationId || request._id, person: request, destination: 'requests', label: 'Mesaj isteği gönderdi' })),
    ];

    return (
        <div className="sidebar-user flex items-center gap-3">
            <ChatAvatar name={user?.fullName} src={user?.profilePic} size="medium" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-[11px] text-[color:var(--text-muted)] truncate">Arkadaş kodun: #{user?.friendCode}</p>
            </div>
            <Tooltip content="Hesap ayarları"><IconButton icon={SettingsIcon} appearance="subtle" title="Hesap ayarları" label="Hesap ayarları" onClick={() => setShowSettings(true)} /></Tooltip>
            <div className="relative">
                <Popup role="dialog" label="Bildirimler" isOpen={showNotifications} onClose={() => setShowNotifications(false)} placement="top-end" shouldFitViewport
                    content={() => <section id="notifications" aria-label="Bildirimler" className="notification-panel">
                        <PopupHeading icon={NotificationIcon} onClose={() => setShowNotifications(false)}><h2>Bildirimler <span className="count-badge">{count}</span></h2></PopupHeading>
                        <div className="notification-list scroll-slim">
                            {count === 0 ? <div className="notification-empty"><NotificationIcon label="" /><p>Yeni bildirim yok</p></div> : notifications.map(item => <button key={`${item.destination}-${item.id}`} className="notification-row" onClick={() => { setShowNotifications(false); onNotificationClick(item.destination); }}>
                                <Avatar name={item.person?.fullName} src={item.person?.profilePic} alt="" className="w-8 h-8 avatar-ring" />
                                <span className="min-w-0"><span className="block text-sm font-medium break-words">{item.person?.fullName || item.person?.username || 'Kullanıcı'}</span><span className="block text-xs text-[color:var(--text-muted)]">{item.label}</span></span>
                                <ChevronRightIcon label="" />
                            </button>)}
                        </div>
                    </section>}
                    trigger={props => <Tooltip content="Bildirimler"><IconButton {...props} icon={NotificationIcon} appearance="subtle" title="Bildirimler" label={`Bildirimler${count ? ` (${count})` : ''}`} aria-expanded={showNotifications} aria-haspopup="dialog" onClick={() => setShowNotifications(value => !value)} /></Tooltip>} />
                {count > 0 && <span className="notification-count pointer-events-none" aria-hidden="true">{count}</span>}
            </div>
            {showSettings && <Suspense fallback={<span role="status">Ayarlar yükleniyor…</span>}><SettingsModal onClose={() => setShowSettings(false)} /></Suspense>}
        </div>
    );
}
