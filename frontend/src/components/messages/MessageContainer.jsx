import PersonAddIcon from '@atlaskit/icon/core/person-add';
import CheckIcon from '@atlaskit/icon/core/check-mark';
import RefreshIcon from '@atlaskit/icon/core/refresh';
import Avatar from '../ChatAvatar';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import DeleteIcon from '@atlaskit/icon/core/delete';
import Messages from "./Messages";
import MessageInput from "./MessageInput";
import ChatIcon from '@atlaskit/icon/core/comment';
import SearchIcon from '@atlaskit/icon/core/search';
import ArrowLeftIcon from '@atlaskit/icon/core/arrow-left';
import CrossIcon from '@atlaskit/icon/core/cross';
import Textfield from '@atlaskit/textfield';
import Tooltip from '@atlaskit/tooltip';
import SectionMessage from '@atlaskit/section-message';
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import useListenTyping from "../../hooks/socket/useListenTyping";
import useListenMessagesRead from "../../hooks/socket/useListenMessagesRead";
import useListenEditedMessages from "../../hooks/socket/useListenEditedMessages";
import useListenDeletedMessages from "../../hooks/socket/useListenDeletedMessages";
import useListenReactions from "../../hooks/socket/useListenReactions";
import useUnread from "../../zustand/useUnread";
import useAuth from "../../zustand/useAuth";
import useRespondToMessageRequests from "../../hooks/friends/useRespondToMessageRequests";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import useFriendStore from "../../zustand/useFriend";
import useSendFriendRequest from "../../hooks/friends/useSendFriendRequest";
import useRespondToFriendRequests from "../../hooks/friends/useRespondToFriendRequests";

const DeleteMessageModal = lazy(() => import('../modals/DeleteMessageModal'));
const ClearHistoryModal = lazy(() => import('../modals/ClearHistoryModal'));

const MessageContainer = () => {

    const { selectedConversation, setSelectedConversation, conversations } = useConversation();
    const { onlineUsers, socket, isConnected, connectionVersion } = useSocket();
    const clearUnread = useUnread((s) => s.clear);
    const { isTyping } = useListenTyping();

    const { authUser } = useAuth();
    const { acceptRequest, declineRequest, loading: actionLoading } = useRespondToMessageRequests();

    const isPending = selectedConversation?.status === "pending";

    const isReceiver = selectedConversation?.lastMessage && selectedConversation?.lastMessage?.senderId !== authUser?._id;

    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [clearTarget, setClearTarget] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");   // sohbet içi mesaj arama
    const [showSearch, setShowSearch] = useState(false);
    const searchTrigger = useRef(null);
    const closeSearch = () => { setShowSearch(false); setSearchTerm(''); searchTrigger.current?.focus(); };
    const { friends, incomingFriendRequests, sentFriendRequests } = useFriendStore();
    const { sendFriendRequest, pendingIds: sendingFriendIds, errors: sendFriendErrors } = useSendFriendRequest();
    const { respondToRequest, loading: respondFriendLoading, error: respondFriendError, errorId: respondFriendErrorId } = useRespondToFriendRequests();

    useEffect(() => {
        setIsBannerDismissed(false);
        setDeleteTarget(null);
        setClearTarget(null);
        setSearchTerm("");      // sohbet değişince arama sıfırlansın
        setShowSearch(false);
    }, [selectedConversation?._id]);

    const isFriend = selectedConversation && friends.some(f => f._id === selectedConversation._id);

    const sentRequest = selectedConversation && sentFriendRequests.find(r => r.receiverId?._id === selectedConversation._id || r._id === selectedConversation._id);

    const incomingRequest = selectedConversation && incomingFriendRequests.find(r => r.senderId?._id === selectedConversation._id || r._id === selectedConversation._id);

    const handleAddFriend = async () => {
        await sendFriendRequest(selectedConversation._id);
    };

    useListenMessagesRead(); // Okundu bildirimlerini dinle
    useListenEditedMessages(); // Düzenlenen mesajları dinle
    useListenDeletedMessages(); // Silinen mesajları dinle
    useListenReactions(); // Emoji tepkilerini dinle

    useEffect(() => {
        const markVisibleChatRead = () => {
            if (document.visibilityState !== 'visible' || !socket?.connected || !selectedConversation) return;
            const isRealConversation = conversations.some(item => item._id === selectedConversation._id);
            if (!isRealConversation) return;
            socket.emit('chatOpened', { otherUserId: selectedConversation._id });
            clearUnread(selectedConversation._id);
        };
        markVisibleChatRead();
        document.addEventListener('visibilitychange', markVisibleChatRead);
        window.addEventListener('focus', markVisibleChatRead);
        return () => {
            document.removeEventListener('visibilitychange', markVisibleChatRead);
            window.removeEventListener('focus', markVisibleChatRead);
        };
    }, [selectedConversation, socket, conversations, clearUnread, connectionVersion]);

    const noChatSelected = !selectedConversation;
    const isOnline = selectedConversation && onlineUsers.includes(selectedConversation._id);

    return (
        <div className="flex flex-col h-full w-full min-w-0 panel-chat">
            {deleteTarget?.conversationId === selectedConversation?._id && deleteTarget?.userId === authUser?._id && deleteTarget &&
                <Suspense fallback={null}><DeleteMessageModal target={deleteTarget} onClose={() => setDeleteTarget(null)} /></Suspense>}
            {clearTarget?.peerId === selectedConversation?._id && clearTarget?.userId === authUser?._id && clearTarget &&
                <Suspense fallback={null}><ClearHistoryModal target={clearTarget} onClose={() => setClearTarget(null)}
                    onCleared={() => { setClearTarget(null); setSearchTerm(''); setShowSearch(false); }} /></Suspense>}

            {noChatSelected ? <NoChatSelected /> : (<>

                <div
                    className='flex items-center gap-3 chat-gutter py-3 flex-shrink-0 relative chat-header'
                    style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-panel)'
                    }}
                >

                    <span className="md:hidden"><Tooltip content="Geri"><IconButton icon={ArrowLeftIcon} label="Geri" title="Geri" appearance="subtle" onClick={() => setSelectedConversation(null)} /></Tooltip></span>

                    <div className='relative flex-shrink-0'>
                        <Avatar
                            name={selectedConversation.fullName}
                            src={selectedConversation.profilePic}
                            alt=''
                            size="large"
                        />
                        {isOnline && (
                            <span
                                className='absolute bottom-0 right-0 w-3 h-3 rounded-full'
                                style={{ background: 'var(--online)', border: '2px solid var(--bg-panel)' }}
                            />
                        )}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='font-semibold text-sm truncate' style={{ color: 'var(--text-primary)' }}>
                            {selectedConversation.fullName}
                        </div>
                        <div className='text-xs flex items-center gap-1.5' style={{ color: 'var(--text-muted)' }}>
                            {isTyping ? (
                                <span className='flex items-center gap-1' style={{ color: 'var(--accent-hover)' }}>
                                    <span className='flex gap-0.5'>
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor' }} />
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor', animationDelay: '0.2s' }} />
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor', animationDelay: '0.4s' }} />
                                    </span>
                                    yazıyor
                                </span>
                            ) : isOnline ? (
                                <span style={{ color: 'var(--online)' }}>çevrimiçi</span>
                            ) : (
                                <span>çevrimdışı</span>
                            )}
                        </div>
                    </div>

                    <Tooltip content="Mesajlarda ara"><IconButton ref={searchTrigger} icon={SearchIcon} label="Mesajlarda ara" title="Mesajlarda ara"
                        appearance="subtle" isSelected={showSearch} aria-expanded={showSearch} aria-controls="chat-search"
                        onClick={() => showSearch ? closeSearch() : setShowSearch(true)} /></Tooltip>

                    <Tooltip content="Sohbeti temizle"><IconButton icon={DeleteIcon} label="Sohbeti temizle" appearance="subtle"
                        onClick={event => setClearTarget({ peerId: selectedConversation._id, userId: authUser._id,
                            fullName: selectedConversation.fullName, profilePic: selectedConversation.profilePic,
                            trigger: event.currentTarget })} /></Tooltip>
                </div>

                {showSearch && (
                    <div id="chat-search" className='chat-gutter py-2 flex-shrink-0' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <Textfield
                            autoFocus
                            type='search'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Bu sohbette ara...'
                            aria-label='Bu sohbette ara'
                            onKeyDown={event => { if (event.key === 'Escape') closeSearch(); }}
                            aria-describedby="chat-search-scope"
                        />
                        <p id="chat-search-scope" className="mt-1 text-xs text-[color:var(--text-muted)]">Yalnızca yüklenen mesajlarda ara.</p>
                    </div>
                )}

                {!isConnected && <div className="chat-notice" role="status"><SectionMessage appearance="warning">
                    Bağlantı yeniden kuruluyor… <Button iconBefore={RefreshIcon} appearance="link" onClick={() => socket?.connect()}>Tekrar bağlan</Button>
                </SectionMessage></div>}
                {isPending && isReceiver && <div className="chat-notice"><SectionMessage title="Yeni mesaj isteği">
                    <p>{selectedConversation.fullName} seninle sohbet etmek istiyor.</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Button iconBefore={CheckIcon} onClick={() => acceptRequest(selectedConversation.conversationId)} isDisabled={actionLoading} appearance="primary">Kabul et ve sohbet et</Button>
                        <Button iconBefore={CrossIcon} onClick={() => declineRequest(selectedConversation._id)} isDisabled={actionLoading} appearance="subtle">Reddet</Button>
                    </div>
                </SectionMessage></div>}

                {!isPending && !isFriend && !isBannerDismissed && conversations.some(c => c._id === selectedConversation._id) && (
                    <div className="chat-notice"><SectionMessage>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="min-w-0 break-words">{sentRequest ? 'İstek zaten gönderildi' : incomingRequest
                                ? `${selectedConversation.fullName} sana istek gönderdi` : `Arkadaş değilsiniz: ${selectedConversation.fullName}`}</p>
                            <div className="flex items-center gap-2">
                                {respondFriendError && respondFriendErrorId === incomingRequest?._id && <p role="alert">{respondFriendError}</p>}
                                {incomingRequest && <Button iconBefore={CheckIcon} onClick={() => respondToRequest(incomingRequest._id, 'accept')} isDisabled={respondFriendLoading} appearance="primary">İsteği kabul et</Button>}
                                {sendFriendErrors[selectedConversation._id] && <p role="alert">{sendFriendErrors[selectedConversation._id]}</p>}
                                {!sentRequest && !incomingRequest && <Button iconBefore={PersonAddIcon} onClick={handleAddFriend} isDisabled={sendingFriendIds.includes(selectedConversation._id)} appearance="primary">Arkadaş ekle</Button>}
                                <Tooltip content="Kapat"><IconButton icon={CrossIcon} label="Kapat" appearance="subtle" onClick={() => setIsBannerDismissed(true)} /></Tooltip>
                            </div>
                        </div>
                    </SectionMessage></div>
                )}

                <div className="flex-1 min-h-0 flex flex-col">
                    <Messages key={selectedConversation._id} searchTerm={searchTerm}
                        onRequestDelete={target => setDeleteTarget({ ...target, conversationId: selectedConversation._id, userId: authUser._id })} />
                </div>

                <div className="flex-shrink-0">
                    <MessageInput key={selectedConversation._id} />
                </div>
            </>)}
        </div>
    );
}
export default MessageContainer;

const NoChatSelected = () => {
    const { authUser } = useAuth();
    return (
        <div className='flex flex-col items-center justify-center w-full h-full px-6'>
            <div className='px-8 py-9 text-center max-w-sm'>
                <div className='w-16 h-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4' style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                    <ChatIcon label="" size="medium" />
                </div>

                <h2 className='text-lg font-semibold mb-1.5' style={{ color: 'var(--text-primary)' }}>
                    Sohbet seç
                </h2>
                <p className='text-sm leading-relaxed' style={{ color: 'var(--text-secondary)' }}>
                    Mesajları görmek için listeden bir sohbet seç.
                </p>

                {authUser?.friendCode && (
                    <div
                        className='mt-5 pt-4 flex flex-col items-center gap-1.5'
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                    >
                        <span className='text-[11px] uppercase tracking-wider' style={{ color: 'var(--text-muted)' }}>
                            Arkadaş kodun
                        </span>
                        <span
                            className='text-lg font-semibold tracking-[0.3em] px-3 py-1 rounded-lg'
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}
                        >
                            {authUser.friendCode}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export { NoChatSelected };
