import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";

// Karşı taraf bir mesaja tepki verdiğinde açık sohbeti anında güncelle.
const useListenReactions = () => {
    const { socket } = useSocket();
    const setMessageReactions = useConversation(state => state.setMessageReactions);

    useEffect(() => {
        if (!socket) return;

        const onReaction = data => setMessageReactions(data);

        socket.on("messageReaction", onReaction);
        return () => socket.off("messageReaction", onReaction);

    }, [socket, setMessageReactions]);
};

export default useListenReactions;
