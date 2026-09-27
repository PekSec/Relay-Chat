import useFriendMutation from './useFriendMutation';

export default function useRespondToFriendRequests() {
    const { mutate, ...state } = useFriendMutation('respond');
    return { respondToRequest: mutate, ...state };
}
