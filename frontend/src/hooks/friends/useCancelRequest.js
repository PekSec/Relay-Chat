import useFriendMutation from './useFriendMutation';

export default function useCancelRequest() {
    const { mutate, ...state } = useFriendMutation('cancel');
    return { cancelRequest: mutate, ...state };
}
