import { useState } from 'react';
import Button from '@atlaskit/button/new';
import { FiMessageSquare, FiUserMinus } from 'react-icons/fi';
import Avatar from '../../Avatar';
import useFriendStore from '../../../zustand/useFriend';
import useSocket from '../../../zustand/useSocket';
import useConversation from '../../../zustand/useConversation';
import useRemoveFriend from '../../../hooks/friends/useRemoveFriend';
import useRespondToFriendRequests from '../../../hooks/friends/useRespondToFriendRequests';
import useCancelRequest from '../../../hooks/friends/useCancelRequest';

export default function Friends({ onBack, initialTab, loading, loadingIncoming, loadingOutgoing }) {
    const [tab, setTab] = useState(initialTab === 'pending' ? 'incoming' : 'all');
    const [query, setQuery] = useState('');
    const { friends, incomingFriendRequests, sentFriendRequests } = useFriendStore();
    const onlineUsers = useSocket(state => state.onlineUsers);
    const { conversations, setSelectedConversation } = useConversation();
    const { handleRemoveFriend, loading: removing } = useRemoveFriend();
    const { respondToRequest, loading: responding } = useRespondToFriendRequests();
    const { cancelRequest, loading: canceling } = useCancelRequest();
    const items = tab === 'all' ? friends : tab === 'incoming' ? incomingFriendRequests : sentFriendRequests;
    const busy = tab === 'all' ? loading : tab === 'incoming' ? loadingIncoming : loadingOutgoing;
    const personFor = item => tab === 'all' ? item : tab === 'incoming' ? item.senderId : item.receiverId;
    const visible = items.filter(item => {
        const person = personFor(item);
        return `${person?.fullName || ''} ${person?.username || ''}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'));
    });

    return (
        <section className="h-full flex flex-col min-h-0" aria-label="Arkadaşlar">
            <div className="px-4 pt-4 pb-2 flex gap-1 flex-wrap">
                {[['all', 'Tümü'], ['incoming', 'Gelen'], ['outgoing', 'Giden']].map(([key, label]) => <Button key={key} appearance="subtle" spacing="compact" isSelected={tab === key} onClick={() => setTab(key)}>{label}</Button>)}
            </div>
            <div className="px-5 py-2"><input type="search" className="field" aria-label="Arkadaşlarda ara" placeholder="İsim veya kullanıcı adı" value={query} onChange={event => setQuery(event.target.value)} /></div>
            <div className="flex-1 overflow-y-auto scroll-slim px-3 py-2">
                {busy ? <p role="status" className="empty-note">Liste yükleniyor…</p> : visible.length === 0 ? <p className="empty-note">{query ? 'Eşleşen kişi yok.' : tab === 'all' ? 'Henüz arkadaşın yok. Yeni sohbet ile birini bulabilirsin.' : 'Bu listede bekleyen istek yok.'}</p> : visible.map(item => {
                    const person = personFor(item);
                    if (!person) return null;
                    return <article key={item._id} className="person-card">
                        <div className="flex items-center gap-3 min-w-0"><Avatar name={person.fullName} src={person.profilePic} alt="" className="w-10 h-10 avatar-ring" /><div className="min-w-0"><h2 className="text-sm font-semibold truncate">{person.fullName}</h2><p className="text-xs text-[color:var(--text-muted)] truncate">@{person.username}{onlineUsers.includes(person._id) ? ' · Çevrimiçi' : ''}</p></div></div>
                        <div className="flex gap-2 justify-end mt-3">
                            {tab === 'all' ? <>
                                <Button appearance="subtle" spacing="compact" isDisabled={removing} onClick={() => handleRemoveFriend(person._id)} iconBefore={() => <FiUserMinus aria-hidden="true" />}>Çıkar</Button>
                                <Button appearance="primary" spacing="compact" iconBefore={() => <FiMessageSquare aria-hidden="true" />} onClick={() => { setSelectedConversation(conversations.find(conversation => conversation._id === person._id) || person); onBack(); }}>Mesaj</Button>
                            </> : tab === 'incoming' ? <>
                                <Button appearance="subtle" spacing="compact" isDisabled={responding} onClick={() => respondToRequest(item._id, 'reject')}>Reddet</Button>
                                <Button appearance="primary" spacing="compact" isDisabled={responding} onClick={() => respondToRequest(item._id, 'accept')}>Kabul et</Button>
                            </> : <Button appearance="subtle" spacing="compact" isDisabled={canceling} onClick={() => cancelRequest(item._id)}>İsteği iptal et</Button>}
                        </div>
                    </article>;
                })}
            </div>
        </section>
    );
}
