import { useEffect, useRef, useState } from 'react';
import useSendMessage from '../../hooks/messages/useSendMessage';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import Textarea from '@atlaskit/textarea';
import IconButton from '@atlaskit/button/icon/button';
import SendIcon from '@atlaskit/icon/core/send';
import Tooltip from '@atlaskit/tooltip';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import EmojiPicker from '../emoji/EmojiPicker';
import { insertEmoji } from '../../utils/emoji';
import useTheme from '../../zustand/useTheme';

const MAX_LENGTH = 2000;

const MessageInput = () => {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const { loading, sendMessage, error, clearError } = useSendMessage();
    const socket = useSocket(state => state.socket);
    const receiverId = useConversation(state => state.selectedConversation?._id);
    const sendKey = useTheme(state => state.preferences.sendKey);
    const timeoutRef = useRef(null);
    const lastTypingRef = useRef(0);
    const inputRef = useRef(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [emojiError, setEmojiError] = useState('');

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            if (socket?.connected) socket.emit('stopTyping', { receiverId });
        };
    }, [socket, receiverId]);

    useEffect(() => {
        setShowEmoji(false); setEmojiError('');
    }, [receiverId]);

    const handleSubmit = async event => {
        event.preventDefault();
        if (!message.trim() || loading) return;
        clearTimeout(timeoutRef.current);
        if (socket?.connected) socket.emit('stopTyping', { receiverId });
        const sent = await sendMessage(message);
        if (sent) setMessage('');
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const handleTyping = event => {
        clearError();
        setMessage(event.target.value);
        if (!socket?.connected) return;
        if (Date.now() - lastTypingRef.current > 1000) {
            socket.emit('typing', { receiverId });
            lastTypingRef.current = Date.now();
        }
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => socket.emit('stopTyping', { receiverId }), 2000);
    };

    return (
        <form className="composer flex-shrink-0" onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="composer-fields">
                <EmojiPicker isOpen={showEmoji} loading={loading} error={emojiError} selectionFocusRef={inputRef}
                    onOpen={() => {
                        selectionRef.current = { start: inputRef.current.selectionStart, end: inputRef.current.selectionEnd };
                        setEmojiError(''); setShowEmoji(true);
                    }} onClose={() => setShowEmoji(false)} onSelect={emoji => {
                        const { start, end } = selectionRef.current;
                        const result = insertEmoji(message, start, end, emoji);
                        if (!result) { setEmojiError('Mesaj en fazla 2000 karakter olabilir.'); return false; }
                        setMessage(result.text);
                        setTimeout(() => inputRef.current?.setSelectionRange(result.caret, result.caret), 0);
                        return true;
                    }} />
                <div className="min-w-0 flex-1"><Textarea ref={inputRef} minimumRows={1} resize="smart" maxHeight="128px" placeholder="Bir mesaj yaz..." aria-label="Mesaj" maxLength={MAX_LENGTH}
                    value={message} onChange={handleTyping} isInvalid={Boolean(error)} aria-describedby={error ? 'send-error' : undefined}
                    onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing &&
                            (sendKey === 'enter' || event.ctrlKey || event.metaKey)) handleSubmit(event);
                    }} isDisabled={loading} /></div>
                <Tooltip content="Gönder"><IconButton type="submit" appearance="primary" label="Gönder" title="Gönder"
                    icon={loading ? () => <Spinner size="small" label="Gönderiliyor" /> : SendIcon}
                    isDisabled={loading || !message.trim()} /></Tooltip>
            </div>
            {error && <div id="send-error" role="alert" className="mt-2"><SectionMessage appearance="error">{error}</SectionMessage></div>}
            <div className="composer-help text-[10px] text-[color:var(--text-muted)]">
                <span className="hidden sm:inline">{sendKey === 'enter' ? 'Enter' : 'Ctrl / ⌘ + Enter'} ile gönder · Shift + Enter ile yeni satır</span>
                {message.length > 1800 && <span className="ml-auto" aria-live="polite">{message.length}/{MAX_LENGTH}</span>}
            </div>
        </form>
    );
};
export default MessageInput;
