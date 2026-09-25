import useConversation from '../zustand/useConversation';
import useFriendStore from '../zustand/useFriend';

// HTTP and the account's socket sessions apply the same boundary.
export default function clearConversationHistory({ peerId, clearedThrough }) {
    useConversation.getState().clearHistory(peerId, clearedThrough);
    const friends = useFriendStore.getState();
    friends.setMessageRequests(friends.messageRequests);
}
