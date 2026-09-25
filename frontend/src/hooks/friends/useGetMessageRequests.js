import useFriendList from './useFriendList';
const useGetMessageRequests = () => {
    const { loading, error, refresh } = useFriendList('/api/conversations/status/pending', null, 'messageRequests');
    return { loading, error, refresh, refreshRequests: refresh };
};
export default useGetMessageRequests;
