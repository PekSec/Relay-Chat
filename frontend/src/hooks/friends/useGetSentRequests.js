import useFriendList from './useFriendList';
const useGetSentRequests = () => {
    const { data, ...status } = useFriendList('/api/friends/sentRequests', 'sentRequests', 'sentFriendRequests');
    return { sentFriendRequests: data, ...status };
};
export default useGetSentRequests;
