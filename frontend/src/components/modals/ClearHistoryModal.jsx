import { useMemo, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Avatar from '@atlaskit/avatar';
import Button from '@atlaskit/button/default/button';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import useClearConversation from '../../hooks/messages/useClearConversation';

export default function ClearHistoryModal({ target, onClose, onCleared }) {
    const cancelRef = useRef(null);
    const returnRef = useMemo(() => ({ get current() {
        return target.trigger?.isConnected ? target.trigger : document.querySelector('textarea[aria-label="Mesaj"]');
    } }), [target]);
    const { clearConversation, loading, error } = useClearConversation();
    const confirm = async () => {
        if (await clearConversation(target.peerId)) onCleared();
    };
    return <Modal width="small" autoFocus={cancelRef} shouldReturnFocus={returnRef}
        onClose={() => { if (!loading) onClose(); }} testId="clear-history-modal">
        <ModalHeader><ModalTitle>Sohbet geçmişi temizlensin mi?</ModalTitle></ModalHeader>
        <ModalBody>
            <div className="flex items-center gap-3 mb-4">
                <Avatar src={target.profilePic || undefined} name={target.fullName} size="medium" />
                <span className="min-w-0 break-words">{target.fullName}</span>
            </div>
            <p>Bu sohbetin geçmişi yalnızca senin hesabından gizlenecek. Karşı tarafın mesajları korunacak.</p>
            {error && <div className="mt-4" role="alert"><SectionMessage appearance="error">{error}</SectionMessage></div>}
        </ModalBody>
        <ModalFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={loading}>Vazgeç</Button>
            <Button appearance="danger" onClick={confirm} isDisabled={loading}>
                {loading ? <span className="auth-progress"><Spinner size="small" />Temizleniyor</span> : 'Geçmişi temizle'}
            </Button>
        </ModalFooter>
    </Modal>;
}
