import Conversation from './Conversation';
import useGetConversations from '../../hooks/conversation/useGetConversations';
import useUnread from '../../zustand/useUnread';
import useGlobalTyping from '../../hooks/socket/useGlobalTyping';
import Spinner from '@atlaskit/spinner';
import SectionMessage from '@atlaskit/section-message';
import Button from '@atlaskit/button/default/button';

const Conversations = ({ filter = '' }) => {
    const { loading, conversations, error, retry } = useGetConversations();
    const { counts } = useUnread();
    const { isUserTyping } = useGlobalTyping();
    const query = filter.toLocaleLowerCase('tr');
    const visible = conversations.filter(c => !query ||
        c.fullName?.toLocaleLowerCase('tr').includes(query) || c.username?.toLocaleLowerCase('tr').includes(query));
    if (loading && !conversations.length) return <div className="flex justify-center py-6"><Spinner label="Sohbetler yükleniyor" /></div>;
    return <>
        {error && <div role="alert" className="p-3"><SectionMessage appearance="error">
            Sohbetler yüklenemedi. <Button appearance="link" onClick={retry}>Tekrar dene</Button>
        </SectionMessage></div>}
        {!visible.length ? <div className="px-4 py-8 text-center text-sm text-[color:var(--text-secondary)]">
            <p>{filter ? 'Eşleşen sohbet yok' : 'Henüz sohbet yok'}</p>
            {!filter && <p className="mt-1 text-xs">Yeni sohbet ile birini bul ve mesaj gönder.</p>}
        </div> : <div className="flex flex-col gap-0.5 px-2 py-2 overflow-y-auto scroll-slim">
            {visible.map(conversation => <Conversation key={conversation._id} conversation={conversation}
                isTyping={isUserTyping(conversation._id)} unreadCount={counts[conversation._id] || 0} />)}
        </div>}
    </>;
};
export default Conversations;
