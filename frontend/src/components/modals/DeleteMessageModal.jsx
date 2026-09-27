import CrossIcon from '@atlaskit/icon/core/cross';
import PopupHeading from '../PopupHeading';
import DeleteIcon from '@atlaskit/icon/core/delete';
import { useMemo, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button/default/button';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import useDeleteMessage from '../../hooks/messages/useDeleteMessage';

const segmenter = new Intl.Segmenter('tr', { granularity: 'grapheme' });

export default function DeleteMessageModal({ target, onClose }) {
    const cancelRef = useRef(null);
    // Resolve after the deletion render: the trigger or filtered row may be gone.
    const returnRef = useMemo(() => ({ get current() {
        return target.trigger?.isConnected ? target.trigger : target.row?.isConnected ? target.row :
            document.querySelector('textarea[aria-label="Mesaj"]');
    } }), [target]);
    const { deleteMessage, loading, error } = useDeleteMessage();
    const parts = Array.from(segmenter.segment(target.text), item => item.segment);
    const preview = parts.slice(0, 240).join('') + (parts.length > 240 ? '…' : '');
    const close = () => onClose();
    const confirm = async () => {
        if (await deleteMessage(target.id)) close();
    };
    return <Modal width={480} testId="relay-modal-delete" autoFocus={cancelRef} shouldReturnFocus={returnRef}
        onClose={() => { if (!loading) close(); }}>
        <ModalHeader><PopupHeading icon={DeleteIcon} danger onClose={close} disabled={loading}><ModalTitle>Mesaj silinsin mi?</ModalTitle></PopupHeading></ModalHeader>
        <ModalBody>
            <p>Bu mesaj iki taraftan da silinecek. Bu işlem geri alınamaz.</p>
            <blockquote className="delete-message-preview">{preview}</blockquote>
            {error && <div role="alert"><SectionMessage appearance="error">{error}</SectionMessage></div>}
        </ModalBody>
        <ModalFooter>
            <Button iconBefore={CrossIcon} ref={cancelRef} onClick={close} isDisabled={loading}>Vazgeç</Button>
            <Button iconBefore={loading ? undefined : DeleteIcon} appearance="danger" onClick={confirm} isDisabled={loading}>
                {loading ? <span className="auth-progress"><Spinner size="small" />Siliniyor</span> : 'Sil'}
            </Button>
        </ModalFooter>
    </Modal>;
}
