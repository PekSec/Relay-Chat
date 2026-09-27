import useFriendMutation from './useFriendMutation';

export default function useRemoveFriend() {
    const { mutate, ...state } = useFriendMutation('remove');
    return { handleRemoveFriend: mutate, ...state };
}
