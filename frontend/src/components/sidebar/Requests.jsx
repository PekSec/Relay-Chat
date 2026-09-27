import Avatar from '../Avatar';
import useFriendStore from '../../zustand/useFriend';
import useConversation from '../../zustand/useConversation';

export default function Requests() {
    const requests = useFriendStore(state => state.messageRequests);
    const setSelectedConversation = useConversation(state => state.setSelectedConversation);
    return (
        <section className="requests-list" aria-label="Gelen mesaj istekleri">
            <p className="text-xs text-[color:var(--text-muted)] py-4">Arkadaşın olmayan kişilerden gelen mesajlar burada görünür.</p>
            {requests.length === 0 ? <p className="empty-note">Bekleyen mesaj isteği yok.</p> : requests.map(request => <button key={request._id} className="person-card w-full text-left hover:bg-[color:var(--bg-hover)]" onClick={() => setSelectedConversation(request)}>
                <span className="flex gap-3 items-center min-w-0"><Avatar name={request.fullName} src={request.profilePic} alt="" className="w-10 h-10 avatar-ring" /><span className="min-w-0"><span className="block text-sm font-semibold truncate">{request.fullName}</span><span className="block text-xs text-[color:var(--text-muted)]">Mesaj isteğini incele</span></span></span>
            </button>)}
        </section>
    );
}
