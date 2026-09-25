import { lazy, Suspense, useRef } from 'react';
import Popup from '@atlaskit/popup';
import IconButton from '@atlaskit/button/icon/button';
import EmojiIcon from '@atlaskit/icon/core/emoji';
import Spinner from '@atlaskit/spinner';

const EmojiPanel = lazy(() => import('./EmojiPanel'));

export default function EmojiPicker({ isOpen, onOpen, onClose, onSelect, error, loading = false,
    reaction = false, selected, selectionFocusRef }) {
    const triggerRef = useRef(null);
    const mobile = useRef(false);
    const label = reaction ? 'Tepki ver' : 'Emoji ekle';
    const focus = ref => setTimeout(() => { if (ref.current?.isConnected) ref.current.focus(); }, 0);
    const close = () => {
        if (loading) return;
        onClose(); focus(triggerRef);
    };
    const select = async value => {
        if (await onSelect(value)) {
            onClose(); focus(selectionFocusRef || triggerRef);
        }
    };
    const panel = <Suspense fallback={<div className="p-4" role="status" aria-label="Emojiler yükleniyor"><Spinner /></div>}>
        <EmojiPanel mobile={mobile.current} reaction={reaction} selected={selected} onSelect={select}
            onClose={close} error={error} loading={loading} />
    </Suspense>;
    return <>
        <Popup isOpen={isOpen && !mobile.current} onClose={close} role="dialog" label={label}
            placement="top-start" shouldFitViewport shouldReturnFocus={false} autoFocus={false} content={() => panel}
            trigger={props => <IconButton {...props} ref={element => { props.ref(element); triggerRef.current = element; }}
                icon={EmojiIcon} label={label} title={label} appearance="subtle" isDisabled={loading}
                aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => {
                    if (isOpen) close();
                    else { mobile.current = window.matchMedia('(max-width: 767px)').matches; onOpen(); }
                }} />} />
        {isOpen && mobile.current && panel}
    </>;
}
