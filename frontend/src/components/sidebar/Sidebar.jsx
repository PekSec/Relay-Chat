import { useState } from 'react';
import Button from '@atlaskit/button/default/button';
import SearchIcon from '@atlaskit/icon/core/search';
import Textfield from '@atlaskit/textfield';
import SectionMessage from '@atlaskit/section-message';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import UserInfo from './UserInfo';
import Friends from './views/Friends';
import AddFriend from './views/AddFriend';
import Requests from './Requests';
import useSocket from '../../zustand/useSocket';
import useFriendStore from '../../zustand/useFriend';
import useGetMessageRequests from '../../hooks/friends/useGetMessageRequests';
import useGetFriendRequests from '../../hooks/friends/useGetFriendRequests';
import useGetFriends from '../../hooks/friends/useGetFriends';
import useGetSentRequests from '../../hooks/friends/useGetSentRequests';

export default function Sidebar() {
    const [view, setView] = useState('conversations');
    const [friendsInitialTab, setFriendsInitialTab] = useState('all');
    const [filter, setFilter] = useState('');
    const onlineUsers = useSocket(state => state.onlineUsers);
    const friends = useFriendStore(state => state.friends);
    const messageRequests = useFriendStore(state => state.messageRequests);
    const messageList = useGetMessageRequests();
    const incomingList = useGetFriendRequests();
    const friendList = useGetFriends();
    const outgoingList = useGetSentRequests();
    const failedLists = (view === 'friends' ? [messageList] : [messageList, incomingList, friendList, outgoingList]).filter(list => list.error);

    const openFriends = (tab = 'all') => { setFriendsInitialTab(tab); setView('friends'); };
    const back = () => setView('conversations');
    const titles = { conversations: 'Sohbetler', friends: 'Kişiler', requests: 'Mesaj istekleri', addFriend: 'Yeni sohbet' };

    return (
        <aside className="relay-sidebar" aria-label="Sohbet ve kişi listesi">
            <div className="relay-brand"><img src="/favicon.svg" alt="" width="28" height="28" /><span>Relay</span></div>
            <div className="sidebar-heading"><h1>{titles[view]}</h1><Button appearance="subtle" onClick={() => setView('addFriend')}>Yeni sohbet</Button></div>
            <nav className="sidebar-nav" aria-label="Ana gezinme">
                <Button appearance="subtle" aria-current={view === 'conversations' ? 'page' : undefined} onClick={back}>Sohbetler</Button>
                <Button appearance="subtle" aria-current={view === 'friends' ? 'page' : undefined} onClick={() => openFriends()}>Kişiler</Button>
                <Button appearance="subtle" aria-current={view === 'requests' ? 'page' : undefined} onClick={() => setView('requests')}>İstekler{messageRequests.length > 0 && <span className="count-badge">{messageRequests.length}</span>}</Button>
            </nav>
            {view === 'conversations' && <>
                <div className="px-5 pt-4 pb-2"><div><Textfield elemBeforeInput={<span className="pl-2 flex"><SearchIcon label="" /></span>} type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Sohbetlerde ara…" aria-label="Sohbetlerde ara" /></div></div>
                <div className="sidebar-list-label"><span>TÜM SOHBETLER</span><span>{friends.filter(user => onlineUsers.includes(user._id)).length} çevrimiçi</span></div>
            </>}
            {failedLists.length > 0 && <div role="alert" className="px-5 py-3 text-sm" style={{ color: 'var(--danger)' }}><SectionMessage appearance="error">Bazı listeler yüklenemedi. <Button appearance="link" onClick={() => failedLists.forEach(list => list.refresh())}>Tekrar dene</Button></SectionMessage></div>}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className={view === 'conversations' ? 'h-full flex flex-col' : 'hidden'}><Conversations filter={filter} /></div>
                {view === 'requests' && <div className="h-full overflow-y-auto scroll-slim"><Requests /></div>}
                {view === 'friends' && <Friends key={friendsInitialTab} onBack={back} initialTab={friendsInitialTab} lists={[friendList, incomingList, outgoingList]} />}
                {view === 'addFriend' && <AddFriend onBack={back} />}
            </div>
            <footer className="sidebar-account">
                <UserInfo onNotificationClick={destination => destination === 'friends' ? openFriends('pending') : setView('requests')} />
                <div className="sidebar-preferences"><LogoutButton /></div>
            </footer>
        </aside>
    );
}
