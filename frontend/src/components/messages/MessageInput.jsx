import { useEffect, useRef, useState } from 'react';
import useSendMessage from '../../hooks/messages/useSendMessage';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import { IoSend } from 'react-icons/io5';
import EmojiPicker from '../emoji/EmojiPicker';
import { insertEmoji } from '../../utils/emoji';
import useTheme from '../../zustand/useTheme';

const MAX_LENGTH = 2000;

const MessageInput = () => {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const { loading, sendMessage } = useSendMessage();
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
        if (!inputRef.current) return;
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 128) + 'px';
    }, [message]);

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
        <form className="composer flex-shrink-0 px-3 sm:px-4 py-3" onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-end gap-2">
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
                <textarea ref={inputRef} rows={1} placeholder="Bir mesaj yaz..." aria-label="Mesaj" maxLength={MAX_LENGTH}
                    className="field min-w-0 flex-1 resize-none max-h-32 scroll-slim" value={message} onChange={handleTyping}
                    onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing &&
                            (sendKey === 'enter' || event.ctrlKey || event.metaKey)) handleSubmit(event);
                    }} disabled={loading} />
                <button type="submit" className="primary-button btn-icon-only w-10 h-10 flex items-center justify-center flex-shrink-0"
                    disabled={loading || !message.trim()} title="Gönder" aria-label="Gönder">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IoSend className="text-lg" />}
                </button>
            </div>
            <div className="flex justify-between pt-1.5 pl-12 text-[10px] text-[color:var(--text-muted)]">
                <span className="hidden sm:inline">{sendKey === 'enter' ? 'Enter' : 'Ctrl / ⌘ + Enter'} ile gönder · Shift + Enter ile yeni satır</span>
                {message.length > 1800 && <span className="ml-auto" aria-live="polite">{message.length}/{MAX_LENGTH}</span>}
            </div>
        </form>
    );
};
export default MessageInput;
