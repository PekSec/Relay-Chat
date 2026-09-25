import useFriendList from './useFriendList';
const useGetFriendRequests = () => {
    const { data, ...status } = useFriendList('/api/friends/requests', 'friendRequests', 'incomingFriendRequests');
    return { incomingFriendRequests: data, ...status };
};
export default useGetFriendRequests;
