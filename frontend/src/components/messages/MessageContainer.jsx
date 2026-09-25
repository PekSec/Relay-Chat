import Avatar from '../Avatar';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import DeleteIcon from '@atlaskit/icon/core/delete';
import Messages from "./Messages";
import MessageInput from "./MessageInput";
import { TiMessages } from "react-icons/ti";
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
import { lazy, Suspense, useEffect, useState } from "react";
import { IoClose, IoSearch, IoArrowBack } from "react-icons/io5";
import useFriendStore from "../../zustand/useFriend";
import useSendFriendRequest from "../../hooks/friends/useSendFriendRequest";
import useRespondToFriendRequests from "../../hooks/friends/useRespondToFriendRequests";

// MessageContainer Bileşeni - Mesaj görüntüleme alanı
// Bu bileşen arkadaşlık sistemiyle yoğun şekilde entegre çalışır:
// 1. Mesaj isteği Banner'ı → pending conversation'da alıcıya Accept/Delete seçenekleri sunar
// 2. Arkadaşlık durumu Banner'ı → arkadaş değilse "Arkadaş ekle" / "İsteği kabul et" banner'ı gösterir
// 3. Online/offline durumu → sadece seçili sohbetin kişisi için gösterilir
// 4. chatOpened event → sadece gerçek conversation'lar için emit edilir (draft'lar için değil)

const DeleteMessageModal = lazy(() => import('../modals/DeleteMessageModal'));
const ClearHistoryModal = lazy(() => import('../modals/ClearHistoryModal'));

const MessageContainer = () => {

    const { selectedConversation, setSelectedConversation, conversations } = useConversation();
    const { onlineUsers, socket, isConnected, connectionVersion } = useSocket();
    const clearUnread = useUnread((s) => s.clear);
    const { isTyping } = useListenTyping();

    const { authUser } = useAuth();
    const { acceptRequest, declineRequest, loading: actionLoading } = useRespondToMessageRequests();

    // ═══════════ MESAJ İSTEĞİ DURUMU ═══════════
    // isPending → Conversation status'u "pending" mi? (arkadaş olmayan birinden gelen ilk mesaj)
    const isPending = selectedConversation?.status === "pending";
    // isReceiver → Son mesajı BİZ mi gönderdik, yoksa karşı taraf mı?
    // Sadece alıcıysak Accept/Delete banner'ını göster (gönderen kendi isteğini kabul edemez)
    const isReceiver = selectedConversation?.lastMessage && selectedConversation?.lastMessage?.senderId !== authUser?._id;

    // ═══════════ ARKADAŞLIK DURUMU BANNER LOGIC ═══════════
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [clearTarget, setClearTarget] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");   // sohbet içi mesaj arama
    const [showSearch, setShowSearch] = useState(false);
    const { friends, incomingFriendRequests, sentFriendRequests } = useFriendStore();
    const { sendFriendRequest, loading: sendFriendLoading } = useSendFriendRequest();
    const { respondToRequest, loading: respondFriendLoading } = useRespondToFriendRequests();

    // Sohbet değişince banner görünürlüğünü sıfırla (her kişi için yeni şans)
    useEffect(() => {
        setIsBannerDismissed(false);
        setDeleteTarget(null);
        setClearTarget(null);
        setSearchTerm("");      // sohbet değişince arama sıfırlansın
        setShowSearch(false);
    }, [selectedConversation?._id]);

    // Seçili kişi arkadaş mı? → friends dizisinde ID'si var mı kontrol et
    const isFriend = selectedConversation && friends.some(f => f._id === selectedConversation._id);
    // Seçili kişiye zaten istek göndermişiz mi? → sentFriendRequests'te kontrol et
    const sentRequest = selectedConversation && sentFriendRequests.find(r => r.receiverId?._id === selectedConversation._id || r._id === selectedConversation._id);
    // Seçili kişi bize istek göndermiş mi? → incomingFriendRequests'te kontrol et
    const incomingRequest = selectedConversation && incomingFriendRequests.find(r => r.senderId?._id === selectedConversation._id || r._id === selectedConversation._id);

    // Arkadaş ekle butonuna basıldığında
    const handleAddFriend = async () => {
        await sendFriendRequest(selectedConversation._id);
    };

    useListenMessagesRead(); // Okundu bildirimlerini dinle
    useListenEditedMessages(); // Düzenlenen mesajları dinle
    useListenDeletedMessages(); // Silinen mesajları dinle
    useListenReactions(); // Emoji tepkilerini dinle

    // ═══════════ CHAT AÇILMA BİLDİRİMİ ═══════════
    // Backend'e "bu sohbeti açtım" bilgisi gönder (okundu bilgisi için)
    // ⚠️ conversations.some kontrolü → Sadece sidebar'da OLAN (gerçek) konuşmalar için emit et
    // AddFriend'den "Mesaj Gönder" denildiğinde selectedConversation set ediliyor
    // ama henüz DB'de conversation yok. Backend'e gereksiz sinyal gitmemeli.
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

    // Sohbeti temizle butonuna tıklanınca
    const noChatSelected = !selectedConversation;
    const isOnline = selectedConversation && onlineUsers.includes(selectedConversation._id);

    return (
        <div className="flex flex-col h-full w-full min-w-0 panel-chat">
            {deleteTarget?.conversationId === selectedConversation?._id && deleteTarget?.userId === authUser?._id && deleteTarget &&
                <Suspense fallback={null}><DeleteMessageModal target={deleteTarget} onClose={() => setDeleteTarget(null)} /></Suspense>}
            {clearTarget?.peerId === selectedConversation?._id && clearTarget?.userId === authUser?._id && clearTarget &&
                <Suspense fallback={null}><ClearHistoryModal target={clearTarget} onClose={() => setClearTarget(null)}
                    onCleared={() => { setClearTarget(null); setSearchTerm(''); setShowSearch(false); }} /></Suspense>}
            {!isConnected && <div role="status" className="px-4 py-2 text-xs text-center flex-shrink-0" style={{ color: 'var(--ds-text-warning)', background: 'var(--ds-background-warning)' }}>Bağlantı yeniden kuruluyor… <button className="underline ml-2" onClick={() => socket?.connect()}>Tekrar bağlan</button></div>}
            {noChatSelected ? <NoChatSelected /> : (<> {/* Sohbet seçilmemişse NoChatSelected, seçilmişse mesaj alanı */}

                {/* ═══════════ HEADER ═══════════ */}
                <div
                    className='flex items-center gap-3 px-4 py-3 flex-shrink-0 relative chat-header'
                    style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'var(--bg-panel)'
                    }}
                >
                    {/* Dar ekranda listeye dön */}
                    <button
                        onClick={() => setSelectedConversation(null)}
                        className='md:hidden w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0'
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                        title='Geri'
                    >
                        <IoArrowBack />
                    </button>

                    <div className='relative flex-shrink-0'>
                        <Avatar
                            name={selectedConversation.fullName}
                            src={selectedConversation.profilePic}
                            alt=''
                            className="w-10 h-10 avatar-ring"
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

                    <button
                        onClick={() => setShowSearch(v => !v)}
                        className='w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0'
                        style={{
                            background: showSearch ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                            color: showSearch ? 'var(--accent-hover)' : 'var(--text-secondary)'
                        }}
                        title='Mesajlarda ara'
                    >
                        <IoSearch />
                    </button>

                    <IconButton icon={DeleteIcon} label="Sohbeti temizle" appearance="subtle"
                        onClick={event => setClearTarget({ peerId: selectedConversation._id, userId: authUser._id,
                            fullName: selectedConversation.fullName, profilePic: selectedConversation.profilePic,
                            trigger: event.currentTarget })} />
                </div>

                {/* Sohbet içi arama çubuğu */}
                {showSearch && (
                    <div className='px-4 py-2 flex-shrink-0' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <input
                            autoFocus
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Bu sohbette ara...'
                            aria-label='Bu sohbette ara'
                            onKeyDown={event => { if (event.key === 'Escape') { setShowSearch(false); setSearchTerm(''); } }}
                            className='field text-sm'
                        />
                    </div>
                )}

                {/* ═══════════ MESAJ İSTEĞİ BANNER'I ═══════════ */}
                {/* Gösterilme koşulları:
                    1. isPending → Conversation status "pending" olmalı
                    2. isReceiver → Son mesajı karşı taraf göndermiş olmalı (biz alıcıyız)
                    Bu banner sadece ALICIYA gösterilir → "Kabul et ve sohbet et" veya "Delete" */}
                {isPending && isReceiver && (
                    <div className="bg-[color:var(--bg-sunken)] p-5 border-b border-[color:var(--border-subtle)] flex flex-col items-center gap-3">
                        <div className="text-center px-4">
                            <h3 className="text-base font-semibold flex items-center gap-2 justify-center">
                                📩 Yeni mesaj isteği
                            </h3>
                            <p className="text-sm text-[color:var(--text-muted)] mt-1">
                                {selectedConversation.fullName} seninle sohbet etmek istiyor.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full max-w-xs justify-center">
                            {/* Kabul → acceptRequest(conversationId) → conversation status "active" olur */}
                            <Button
                                onClick={() => acceptRequest(selectedConversation.conversationId)}
                                isDisabled={actionLoading}
                                appearance="primary"
                            >
                                {actionLoading ? 'İşleniyor…' : "Kabul et ve sohbet et"}
                            </Button>
                            {/* İsteği yalnız kendi hesabından gizle. */}
                            <Button
                                onClick={() => declineRequest(selectedConversation._id)}
                                isDisabled={actionLoading}
                                appearance="subtle"
                            >
                                Reddet
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══════════ ARKADAŞLIK DURUMU BANNER'I ═══════════ */}
                {/* Gösterilme koşulları:
                    1. !isPending → Conversation pending DEĞİL (active veya draft)
                    2. !isFriend → Bu kişi arkadaş listende DEĞİL
                    3. !isBannerDismissed → Kullanıcı X ile kapatmamış
                    4. conversations.some → Sidebar'da olan gerçek bir conversation (draft değil)
                    
                    Banner 3 farklı durum gösterir:
                    - sentRequest var → "İstek zaten gönderildi"
                    - incomingRequest var → "X sana istek gönderdi" + Accept butonu
                    - İkisi de yok → "Arkadaş değilsiniz: X" + Add Friend butonu */}
                {!isPending && !isFriend && !isBannerDismissed && conversations.some(c => c._id === selectedConversation._id) && (
                    <div className="bg-[color:var(--accent-soft)] p-3 border-b border-[color:var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 ml-2">
                            <TiMessages className="text-[color:var(--accent-hover)] text-xl" />
                            <div>
                                <span className="text-xs font-semibold text-[color:var(--accent-hover)] block uppercase tracking-wider">Arkadaşlık durumu</span>
                                <p className="text-sm text-[color:var(--text-secondary)]">
                                    {sentRequest
                                        ? "İstek zaten gönderildi"
                                        : incomingRequest
                                            ? `${selectedConversation.fullName} sana istek gönderdi`
                                            : `Arkadaş değilsiniz: ${selectedConversation.fullName}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Gelen istek varsa → Accept Request butonu */}
                            {incomingRequest && (
                                <Button
                                    onClick={() => respondToRequest(incomingRequest._id, "accept")}
                                    isDisabled={respondFriendLoading}
                                    appearance="primary" spacing="compact"
                                >
                                    {respondFriendLoading ? "..." : "İsteği kabul et"}
                                </Button>
                            )}

                            {/* Ne gönderilen ne gelen istek varsa → Add Friend butonu */}
                            {!sentRequest && !incomingRequest && (
                                <Button
                                    onClick={handleAddFriend}
                                    isDisabled={sendFriendLoading}
                                    appearance="primary" spacing="compact"
                                >
                                    {sendFriendLoading ? "..." : "Arkadaş ekle"}
                                </Button>
                            )}

                            {/* Banner'ı kapat (X butonu) */}
                            <button
                                onClick={() => setIsBannerDismissed(true)}
                                className="p-1.5 icon-btn ml-2"
                                title="Kapat"
                            >
                                <IoClose size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════ MESAJLAR ═══════════ */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <Messages key={selectedConversation._id} searchTerm={searchTerm}
                        onRequestDelete={target => setDeleteTarget({ ...target, conversationId: selectedConversation._id, userId: authUser._id })} />
                </div>

                {/* ═══════════ MESAJ GİRİŞ ALANI ═══════════ */}
                <div className="flex-shrink-0">
                    <MessageInput key={selectedConversation._id} />
                </div>
            </>)}
        </div>
    );
}
export default MessageContainer;

// Hiçbir sohbet seçilmediğinde gösterilecek bileşen
const NoChatSelected = () => {
    const { authUser } = useAuth();
    return (
        <div className='flex flex-col items-center justify-center w-full h-full px-6'>
            <div className='px-8 py-9 text-center max-w-sm'>
                <div className='w-16 h-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4' style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                    <TiMessages />
                </div>

                <h2 className='text-lg font-semibold mb-1.5' style={{ color: 'var(--text-primary)' }}>
                    Sohbet seç
                </h2>
                <p className='text-sm leading-relaxed' style={{ color: 'var(--text-secondary)' }}>
                    Mesajları görmek için listeden bir sohbet seç.
                </p>

                {/* Kendi arkadaş kodu: paylaşması kolay olsun */}
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
