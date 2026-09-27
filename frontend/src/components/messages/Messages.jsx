import ArrowUpIcon from '@atlaskit/icon/core/arrow-up';
import RefreshIcon from '@atlaskit/icon/core/refresh';
import { useLayoutEffect, useRef, useState } from 'react';
import Message from './Message';
import useGetMessages from '../../hooks/messages/useGetMessages';
import MessageSkeleton from '../skeletons/MessageSkeleton';
import useAuth from '../../zustand/useAuth';
import ArrowDownIcon from '@atlaskit/icon/core/arrow-down';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import Tooltip from '@atlaskit/tooltip';
import SectionMessage from '@atlaskit/section-message';

const dayLabel = date => {
    const today = new Date(), yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Messages = ({ searchTerm = '', onRequestDelete }) => {
    const { loading, messages, hasMore, loadingOlder, error, olderError, retry, loadOlder } = useGetMessages();
    const userId = useAuth(state => state.authUser?._id);
    const listRef = useRef(null);
    const nearBottom = useRef(true);
    const historyPosition = useRef(null);
    const [showJump, setShowJump] = useState(false);
    const lastId = messages.at(-1)?._id;
    const previousLastId = useRef(null);
    const lastSender = messages.at(-1)?.senderId;

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || loadingOlder) return;
        const ownNewMessage = lastId !== previousLastId.current && lastSender === userId;
        previousLastId.current = lastId;
        if (historyPosition.current) {
            list.scrollTop = list.scrollHeight - historyPosition.current.height + historyPosition.current.top;
            historyPosition.current = null;
        } else if (!searchTerm && (nearBottom.current || ownNewMessage)) {
            list.scrollTop = list.scrollHeight;
        }
    }, [lastId, lastSender, userId, loading, loadingOlder, searchTerm]);

    const visible = searchTerm ? messages.filter(message => message.message?.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))) : messages;
    const handleOlder = async () => {
        const list = listRef.current;
        historyPosition.current = list ? { height: list.scrollHeight, top: list.scrollTop } : null;
        await loadOlder();
    };

    if (loading && messages.length === 0) return <div className="flex-1 min-h-0 overflow-hidden py-3" role="status" aria-label="Mesajlar yükleniyor">{Array.from({ length: 4 }, (_, i) => <MessageSkeleton key={i} />)}</div>;
    return (
        <div className="relative flex-1 min-h-0 flex flex-col">
            {error && <div className="chat-gutter py-2 text-xs text-center text-[color:var(--danger)]" role="alert"><SectionMessage appearance="error">{error} <Button iconBefore={RefreshIcon} appearance="link" onClick={olderError ? handleOlder : retry} isDisabled={loading || loadingOlder}>Tekrar dene</Button></SectionMessage></div>}
            <div ref={listRef} aria-label="Mesaj geçmişi" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-slim py-3 flex flex-col"
                onScroll={event => {
                    const el = event.currentTarget;
                    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
                    setShowJump(!nearBottom.current);
                }}>
                {hasMore && <div className="self-center mb-3"><Button iconBefore={ArrowUpIcon} appearance="subtle"
                    isDisabled={loading || loadingOlder} onClick={handleOlder}>{loadingOlder ? 'Yükleniyor…' : 'Önceki mesajları yükle'}</Button></div>}
                {searchTerm && <p className="text-xs text-center mb-3 text-[color:var(--text-muted)]" role="status">{visible.length} sonuç · Yüklenen mesajlarda aranıyor</p>}
                {visible.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                        <p className="text-sm text-[color:var(--text-secondary)]">{searchTerm ? 'Bu aramayla eşleşen mesaj yok' : 'Henüz mesaj yok.'}</p>
                    </div>
                ) : <div className="mt-auto">
                    {visible.map((message, i) => {
                        const prev = visible[i - 1];
                        const date = new Date(message.createdAt || message.timestamp);
                        const prevDate = prev ? new Date(prev.createdAt || prev.timestamp) : null;
                        const newDay = !prevDate || prevDate.toDateString() !== date.toDateString();
                        const showAvatar = newDay || prev?.senderId !== message.senderId || date - prevDate >= 5 * 60 * 1000;
                        return <div key={message._id}>
                            {newDay && <div className="flex items-center gap-3 chat-gutter my-4">
                                <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[color:var(--bg-elevated)] text-[color:var(--text-muted)]">{dayLabel(date)}</span>
                                <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                            </div>}
                            <Message message={message} searchTerm={searchTerm} showAvatar={showAvatar} onRequestDelete={onRequestDelete} />
                        </div>;
                    })}
                </div>}
            </div>
            {showJump && !searchTerm && <div className="absolute bottom-3 right-4 z-20"><Tooltip content="Son mesaja git"><IconButton appearance="primary" icon={ArrowDownIcon} title="Son mesaja git" label="Son mesaja git" onClick={() => { listRef.current.scrollTop = listRef.current.scrollHeight; }} /></Tooltip></div>}
        </div>
    );
};
export default Messages;
