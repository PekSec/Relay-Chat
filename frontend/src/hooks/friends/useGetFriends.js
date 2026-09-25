import useFriendList from './useFriendList';
const useGetFriends = () => {
    const { data, ...status } = useFriendList('/api/friends/list', 'friends', 'friends');
    return { friends: data, ...status };
};
export default useGetFriends;
