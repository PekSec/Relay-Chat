import { useMemo, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button/default/button';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import Avatar from '../ChatAvatar';
import useRemoveFriend from '../../hooks/friends/useRemoveFriend';

export default function RemoveFriendModal({ target, onClose, focusFallback }) {
    const cancelRef = useRef(null);
    const returnRef = useMemo(() => ({ get current() { return target.trigger?.isConnected ? target.trigger : focusFallback(); } }), [target, focusFallback]);
    const { handleRemoveFriend, loading, error } = useRemoveFriend();
    return <Modal width="small" autoFocus={cancelRef} shouldReturnFocus={returnRef} onClose={() => { if (!loading) onClose(); }}>
        <ModalHeader><ModalTitle>Arkadaşlıktan çıkarılsın mı?</ModalTitle></ModalHeader>
        <ModalBody>
            <div className="friend-person mb-4"><Avatar name={target.fullName} src={target.profilePic} /><strong className="friend-name">{target.fullName}</strong></div>
            <p>Sohbet geçmişi korunacak.</p>
            {error && <div role="alert" className="mt-4"><SectionMessage appearance="error">{error}</SectionMessage></div>}
        </ModalBody>
        <ModalFooter>
            <Button ref={cancelRef} isDisabled={loading} onClick={onClose}>Vazgeç</Button>
            <Button appearance="danger" isDisabled={loading} onClick={async () => { if (await handleRemoveFriend(target._id)) onClose(); }}>
                {loading ? <span className="auth-progress"><Spinner size="small" />Çıkarılıyor</span> : 'Çıkar'}
            </Button>
        </ModalFooter>
    </Modal>;
}
