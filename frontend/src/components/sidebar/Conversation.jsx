import Avatar from '../ChatAvatar';
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import ClockIcon from '@atlaskit/icon/core/clock';
import useTheme from '../../zustand/useTheme';

// Son mesaj zamanını kısa biçimde göster: bugünse saat, dünse "dün", öncesi tarih
const shortTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  if (date.toDateString() === yesterday.toDateString()) return "dün";
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

const Conversation = (props) => {

  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocket();
  const showPreviews = useTheme(state => state.preferences.messagePreviews);

  const isSelected = selectedConversation?._id === props.conversation._id;
  const isOnline = onlineUsers.includes(props.conversation._id);
  const isThisUserTyping = props.isTyping;
  const isPending = props.conversation.status === 'pending';
  const unread = props.unreadCount || 0;

  const lastMessage = props.conversation.lastMessage;

  return (
    <button
      type='button'
      aria-pressed={isSelected}
      className={`conversation-row w-full text-left flex gap-3 items-center py-3 rounded-md ${isSelected ? 'tile-active' : ''}`}
      onClick={() => setSelectedConversation(props.conversation)}
    >
      {/* Avatar - online göstergesi ile */}
      <div className='relative flex-shrink-0'>
        <Avatar
          name={props.conversation.fullName}
          src={props.conversation.profilePic}
          alt=''
          size="large"
        />
        {isOnline && (
          <span
            aria-label='Çevrimiçi' role='img' className='absolute bottom-0 right-0 w-3 h-3 rounded-full'
            style={{ background: 'var(--online)', border: '2px solid var(--bg-panel)' }}
          />
        )}
      </div>

      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className='truncate text-sm'
            style={{
              color: 'var(--text-primary)',
              fontWeight: unread > 0 ? 700 : 500
            }}
          >
            {props.conversation.fullName}
          </span>

          <span className='text-[11px] flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
            {isPending
              ? <ClockIcon label="Yanıt bekleniyor" color="var(--ds-icon-warning)" size="small" />
              : shortTime(lastMessage?.createdAt || lastMessage?.timestamp)}
          </span>
        </div>

        <div className='flex items-center justify-between gap-2 mt-0.5'>
          <span className='text-xs truncate' style={{ color: 'var(--text-muted)' }}>
            {isThisUserTyping ? (
              <span className='italic' style={{ color: 'var(--online)' }}>yazıyor...</span>
            ) : isPending ? (
              <span className='italic' style={{ color: 'var(--ds-text-warning)' }}>Yanıt bekleniyor</span>
            ) : lastMessage?.message ? (
              !showPreviews ? 'Mesaj önizlemesi gizli' : lastMessage.isDeleted ? <span className='italic'>Bu mesaj silindi</span> : lastMessage.message
            ) : (
              <span className='italic'>Henüz mesaj yok</span>
            )}
          </span>

          {/* Okunmamış mesaj rozeti */}
          {unread > 0 && (
            <span aria-label={`${unread} okunmamış mesaj`}
              className='flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center animate-badge'
              style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default Conversation;
