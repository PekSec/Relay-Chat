import { useEffect } from 'react';
import useConversation from '../../zustand/useConversation';
import useSocket from '../../zustand/useSocket';

const useListenEditedMessages = () => {
    const socket = useSocket(state => state.socket);
    const setMessageEdited = useConversation(state => state.setMessageEdited);
    useEffect(() => {
        if (!socket) return;
        socket.on('messageEdited', setMessageEdited);
        return () => socket.off('messageEdited', setMessageEdited);
    }, [socket, setMessageEdited]);
};
export default useListenEditedMessages;
