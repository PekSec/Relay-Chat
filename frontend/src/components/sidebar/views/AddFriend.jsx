import { useState } from 'react';
import Button from '@atlaskit/button/new';
import Avatar from '../../Avatar';
import useSearchUsers from '../../../hooks/friends/useSearchUsers';
import useSendFriendRequest from '../../../hooks/friends/useSendFriendRequest';
import useConversation from '../../../zustand/useConversation';

export default function AddFriend({ onBack }) {
    const [query, setQuery] = useState('');
    const { users, loading, error } = useSearchUsers(query);
    const { sendFriendRequest, loading: sending } = useSendFriendRequest();
    const { conversations, setSelectedConversation } = useConversation();
    return (
        <section className="h-full flex flex-col min-h-0" aria-label="Kişi bul">
            <div className="px-5 pt-5 pb-3">
                <label htmlFor="find-person" className="block text-xs font-medium mb-2">Kullanıcı adı veya arkadaş kodu</label>
                <input id="find-person" type="search" maxLength={20} className="field" placeholder="Örneğin: ecedemir" value={query} onChange={event => setQuery(event.target.value)} />
                <p className="text-xs mt-2 text-[color:var(--text-muted)]">Aramak için en az 2 karakter yaz.</p>
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim px-3">
                {error ? <p role="alert" className="empty-note text-[color:var(--danger)]">{error}</p> : loading ? <p role="status" className="empty-note">Kişiler aranıyor…</p> : query.length < 2 ? <p className="empty-note">Arama sonuçları burada görünür.</p> : users.length === 0 ? <p className="empty-note">Kullanıcı bulunamadı. Yazdığın adı veya kodu kontrol et.</p> : users.map(person => <article key={person._id} className="person-card">
                    <div className="flex items-center gap-3 min-w-0"><Avatar name={person.fullName} src={person.profilePic} alt="" className="w-10 h-10 avatar-ring" /><div className="min-w-0"><h2 className="font-semibold text-sm truncate">{person.fullName}</h2><p className="text-xs text-[color:var(--text-muted)] truncate">@{person.username} · #{person.friendCode}</p></div></div>
                    <div className="flex gap-2 justify-end mt-3">
                        <Button appearance="subtle" spacing="compact" isDisabled={sending} onClick={async () => { if (await sendFriendRequest(person._id)) setQuery(''); }}>Arkadaş ekle</Button>
                        <Button appearance="primary" spacing="compact" onClick={() => { setSelectedConversation(conversations.find(item => item._id === person._id) || person); onBack(); }}>Mesaj gönder</Button>
                    </div>
                </article>)}
            </div>
        </section>
    );
}
