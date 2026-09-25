import { useEffect } from 'react';
import useConversation from '../../zustand/useConversation';
import useSocket from '../../zustand/useSocket';

export default function useListenDeletedMessages() {
    const socket = useSocket(state => state.socket);
    useEffect(() => {
        if (!socket) return;
        const onDelete = ({ messageId }) => useConversation.getState().markMessageDeleted(messageId);
        socket.on('messageDeleted', onDelete);
        return () => socket.off('messageDeleted', onDelete);
    }, [socket]);
}
