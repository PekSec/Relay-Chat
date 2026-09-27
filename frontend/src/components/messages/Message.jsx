import Avatar from '../ChatAvatar';
import EditIcon from '@atlaskit/icon/core/edit';
import Textarea from '@atlaskit/textarea';
import Tooltip from '@atlaskit/tooltip';
import useTheme from '../../zustand/useTheme';
import { useState, useEffect, useRef } from 'react';
import useAuth from "../../zustand/useAuth";
import useConversation from "../../zustand/useConversation";
import useEditMessage from "../../hooks/messages/useEditMessage";
import IconButton from '@atlaskit/button/icon/button';
import DeleteIcon from '@atlaskit/icon/core/delete';
import useReactToMessage from "../../hooks/messages/useReactToMessage";
import Button from '@atlaskit/button/default/button';
import SectionMessage from '@atlaskit/section-message';
import EmojiPicker from '../emoji/EmojiPicker';

// Arama terimini mesaj metni içinde vurgula.
// Kullanıcı girdisi regex'e gömüldüğü için özel karakterler kaçırılıyor.
const highlight = (text, term) => {
    if (!term) return text;
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${safe})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
            ? <mark key={i} className="hit">{part}</mark>
            : part
    );
};

const Message = ({ message, searchTerm = "", showAvatar = true, onRequestDelete }) => {

    const { authUser } = useAuth();
    const { selectedConversation } = useConversation();

    const { editMessage, loading, error: editError, clearError: clearEditError } = useEditMessage();
    const sendKey = useTheme(state => state.preferences.sendKey);
    const rowRef = useRef(null);
    const { react, loading: reactionLoading, error: reactionError, clearError } = useReactToMessage();

    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(message.message);
    const [showPicker, setShowPicker] = useState(false);
    const [showActions, setShowActions] = useState(false); // dokunmatik için
    const pickerRef = useRef(null);

    // Portal içindeki seçicinin kapanmasını kendi bileşeni yönetir.
    useEffect(() => {
        if (!showActions || showPicker) return;
        const onDown = (e) => {
            if (!pickerRef.current?.contains(e.target)) {
                setShowActions(false);
            }
        };
        const onKey = (e) => { if (e.key === "Escape") setShowActions(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [showPicker, showActions]);

    // ObjectId/string uyuşmazlığını önlemek için String() kullan
    const fromMe = String(message.senderId) === String(authUser?._id);
    const profilePic = fromMe ? authUser?.profilePic : selectedConversation?.profilePic;

    const formatTime = () => {
        const ts = message.createdAt || message.timestamp;
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const finishEdit = () => {
        setIsEditing(false);
        requestAnimationFrame(() => rowRef.current?.focus());
    };
    const handleEditSave = async () => {
        if (loading || !editedText.trim()) return;
        if (editedText.trim() === message.message) {
            finishEdit();
            return;
        }
        const success = await editMessage(message._id, editedText);
        if (success) finishEdit();
    };

    const handleEditCancel = () => {
        setEditedText(message.message);
        clearEditError();
        finishEdit();
    };

    // Aynı emojiye basanları tek rozette topla
    const grouped = (message.reactions || []).reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {});

    if (isEditing && !message.isDeleted) {
        return (
            <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'} chat-gutter py-1`}>
                <div className='flex flex-col gap-2 w-full max-w-md'>
                    <Textarea minimumRows={2} resize="smart" maxHeight="128px"
                        aria-label='Mesajı düzenle'
                        maxLength={2000}
                        value={editedText}
                        onChange={(e) => { setEditedText(e.target.value); clearEditError(); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing &&
                                (sendKey === 'enter' || e.ctrlKey || e.metaKey)) { e.preventDefault(); handleEditSave(); }
                            if (e.key === 'Escape' && !loading && !e.nativeEvent.isComposing) handleEditCancel();
                        }}
                        isDisabled={loading} isInvalid={Boolean(editError)} aria-describedby={editError ? `edit-error-${message._id}` : undefined}
                        autoFocus
                    />
                    {editError && <div id={`edit-error-${message._id}`} role="alert"><SectionMessage appearance="error">{editError}</SectionMessage></div>}
                    <div className='flex gap-2 justify-end'>
                        <Button onClick={handleEditCancel} appearance="subtle" isDisabled={loading}>Vazgeç</Button>
                        <Button onClick={handleEditSave} appearance="primary" isDisabled={loading || !editedText.trim()}>
                            {loading ? 'Kaydediliyor…' : 'Kaydet'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`group flex gap-2 chat-gutter ${showAvatar ? 'mt-3' : 'mt-0.5'} ${fromMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar yalnızca karşı taraf için gösterilir; kendi mesajlarımızda
                kim olduğumuz zaten belli, tekrar etmek yer kaplıyordu.
                Ardışık mesajlarda da tekrar edilmez, yerine boşluk bırakılır. */}
            {!fromMe && (
                <div className='w-8 flex-shrink-0'>
                    {showAvatar && (
                        <Avatar
                            name={selectedConversation?.fullName}
                            src={profilePic}
                            alt=''
                            size="medium"
                        />
                    )}
                </div>
            )}

            <div className={`flex flex-col min-w-0 max-w-[min(34rem,calc(100%-3.5rem))] md:max-w-[min(34rem,calc(100%-9rem))] ${fromMe ? 'items-end' : 'items-start'}`}>
                <div className='relative' ref={pickerRef}>
                    <div
                        ref={rowRef} tabIndex={-1}
                        className={`bubble ${fromMe ? 'bubble-out' : 'bubble-in'} ${message.isDeleted ? 'italic opacity-60' : ''}`}
                        onClick={() => setShowActions(v => !v)}
                    >
                        {message.isDeleted
                            ? "Bu mesaj silindi"
                            : highlight(message.message, searchTerm)}
                    </div>

                    {/* Eylem çubuğu: yalnızca imleç mesajın üstündeyken görünür */}
                    {!message.isDeleted && (
                        <div
                            // Dar ekranda balonun yanında yer yok; butonlar balonun
                            // üstüne alınır. Geniş ekranda yanda durmaya devam eder.
                            className={`message-actions absolute z-10 flex items-center gap-1 transition-opacity
                                        ${showActions || showPicker ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} group-hover:opacity-100 group-hover:pointer-events-auto
                                        focus-within:opacity-100 focus-within:pointer-events-auto
                                        bottom-full mb-1 md:bottom-auto md:top-1/2 md:mb-0 md:-translate-y-1/2
                                        ${fromMe ? 'right-0 md:right-full md:mr-1.5' : 'left-0 md:left-full md:ml-1.5'}`}
                        >
                            <EmojiPicker reaction isOpen={showPicker} loading={reactionLoading} error={reactionError}
                                selected={message.reactions?.find(r => String(r.userId) === String(authUser?._id))?.emoji}
                                onOpen={() => { clearError(); setShowPicker(true); }} onClose={() => setShowPicker(false)}
                                onSelect={emoji => react(message._id, emoji)} />
                            {fromMe && (
                                <>
                                    <Tooltip content="Düzenle"><IconButton icon={EditIcon} label="Düzenle" title="Düzenle" appearance="subtle"
                                        onClick={() => { setEditedText(message.message); clearEditError(); setIsEditing(true); }} /></Tooltip>
                                    <Tooltip content="Sil"><IconButton icon={DeleteIcon} label="Sil" appearance="subtle"
                                        onClick={event => onRequestDelete({ id: message._id, text: message.message,
                                            trigger: event.currentTarget, row: rowRef.current })} /></Tooltip>
                                </>
                            )}
                        </div>
                    )}

                </div>

                {/* Tepki rozetleri */}
                {!message.isDeleted && Object.keys(grouped).length > 0 && (
                    <div className='flex gap-1 mt-1 flex-wrap'>
                        {Object.entries(grouped).map(([emoji, count]) => {
                            const mine = (message.reactions || [])
                                .some(r => r.emoji === emoji && String(r.userId) === String(authUser?._id));
                            return (
                                <Button appearance="subtle" isSelected={mine} aria-pressed={mine} isDisabled={reactionLoading}
                                    key={emoji}
                                    onClick={() => react(message._id, emoji)}
                                    aria-label={`${emoji} tepkisi, ${count} kişi`}
                                >
                                    <span>{emoji}</span>
                                    {count > 1 && <span>{count}</span>}
                                </Button>
                            );
                        })}
                    </div>
                )}
                {!message.isDeleted && !showPicker && reactionError &&
                    <div role="alert"><SectionMessage appearance="error">{reactionError}</SectionMessage></div>}

                <div className='flex items-center gap-1.5 mt-0.5 px-1'>
                    <time dateTime={message.createdAt || message.timestamp} className='text-[11px]' style={{ color: 'var(--text-muted)' }}>{formatTime()}</time>

                    {message.isEdited && !message.isDeleted && (
                        <span className='text-[11px] italic' style={{ color: 'var(--text-muted)' }}>düzenlendi</span>
                    )}

                    {fromMe && !message.isDeleted && (
                        <span role="img" aria-label={message.isRead ? 'Okundu' : 'İletildi'} title={message.isRead ? 'Okundu' : 'İletildi'}>
                            {message.isRead ? (
                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 15">
                                    <path fill="var(--accent-hover)" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            ) : (
                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 15">
                                    <path fill="var(--text-muted)" d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Message;
