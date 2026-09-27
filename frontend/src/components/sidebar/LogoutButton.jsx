import Button from '@atlaskit/button/default/button';
import LogOutIcon from '@atlaskit/icon/core/log-out';
import useLogout from '../../hooks/auth/useLogout';

export default function LogoutButton() {
    const { loading, handleLogout } = useLogout();
    return <Button appearance="subtle" shouldFitContainer iconBefore={LogOutIcon}
        onClick={handleLogout} isDisabled={loading}>{loading ? 'Çıkılıyor…' : 'Çıkış yap'}</Button>;
}
