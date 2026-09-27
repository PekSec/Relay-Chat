import { useState } from 'react';
import PopupHeading from '../PopupHeading';
import EmojiIcon from '@atlaskit/icon/core/emoji';
import { EmojiPicker as Frimousse, defaultEmojiDataResolver } from 'frimousse';
import Button from '@atlaskit/button/default/button';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';

export default function EmojiPanel({ mobile, reaction, selected, onSelect, onClose, loading, error }) {
    const [dataError, setDataError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const heading = <PopupHeading icon={EmojiIcon} onClose={onClose} disabled={loading}>
        {mobile ? <ModalTitle>{reaction ? 'Tepki ver' : 'Emoji ekle'}</ModalTitle> : <h2>{reaction ? 'Tepki ver' : 'Emoji ekle'}</h2>}
    </PopupHeading>;
    const content = <div className="emoji-panel">
        {!mobile && heading}
        <Frimousse.Root key={attempt} locale="en" columns={mobile ? 5 : 6}
            emojibaseUrl="/emoji/17.0.0" aria-busy={loading}
            resolveEmojiData={async (locale, options) => {
                try { return await defaultEmojiDataResolver(locale, options); }
                catch (error) {
                    if (!options.signal?.aborted) setDataError(true);
                    throw error;
                }
            }}
            onEmojiSelect={({ emoji }) => { if (!loading) onSelect(emoji); }}>
            <div className="emoji-toolbar">
                <Frimousse.Search className="field" aria-label="Emoji ara" placeholder="Emoji ara (English)"
                    autoFocus disabled={loading} />
                <Frimousse.SkinToneSelector type="button" aria-label="Ten rengini değiştir" disabled={loading || dataError} />
            </div>
            <Frimousse.Viewport className="scroll-slim" aria-label={reaction ? 'Tepkiler' : 'Emojiler'}>
                {!dataError && <Frimousse.Loading role="status">Emojiler yükleniyor…</Frimousse.Loading>}
                <Frimousse.Empty role="status">Emoji bulunamadı.</Frimousse.Empty>
                <Frimousse.List components={{ Emoji: ({ emoji, ...props }) => {
                    const reacted = reaction && selected?.replaceAll('\uFE0F', '') === emoji.emoji.replaceAll('\uFE0F', '');
                    return <button {...props} type="button" title={emoji.emoji} disabled={loading}
                        aria-selected={reaction ? reacted : props['aria-selected']} data-reacted={reacted || undefined}>
                        {emoji.emoji}
                    </button>;
                } }} />
            </Frimousse.Viewport>
        </Frimousse.Root>
        {dataError && <div role="alert"><SectionMessage appearance="error">
            <p>Emojiler yüklenemedi.</p>
            <Button onClick={() => { setDataError(false); setAttempt(value => value + 1); }}>Tekrar dene</Button>
        </SectionMessage></div>}
        {loading && <div role="status" className="auth-progress"><Spinner size="small" />Tepki kaydediliyor</div>}
        {error && <div role="alert"><SectionMessage appearance="error">{error}</SectionMessage></div>}
    </div>;
    return mobile ? <Modal width={400} testId="relay-modal-emoji" onClose={onClose} shouldReturnFocus={false} autoFocus={false}>
        <ModalHeader>{heading}</ModalHeader>
        <ModalBody>{content}</ModalBody>
        <ModalFooter><Button onClick={onClose} isDisabled={loading}>Vazgeç</Button></ModalFooter>
    </Modal> : content;
}
