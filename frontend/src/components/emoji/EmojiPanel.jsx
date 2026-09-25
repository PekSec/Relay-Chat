import { useEffect, useRef, useState } from 'react';
import Button from '@atlaskit/button/default/button';
import Textfield from '@atlaskit/textfield';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { EMOJIS, REACTIONS, searchText } from '../../utils/emoji';

export default function EmojiPanel({ mobile, reaction, selected, onSelect, onClose, loading, error }) {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(null);
    const optionsRef = useRef(null);
    const searchRef = useRef(null);
    const options = reaction ? REACTIONS : EMOJIS.filter(item => searchText(item.name).includes(searchText(query)) || item.value === query);
    const focused = options.some(item => item.value === active) ? active : options[0]?.value;
    useEffect(() => {
        if (reaction) optionsRef.current?.querySelector('button')?.focus();
        else searchRef.current?.focus();
    }, [reaction]);
    const content = <div className="emoji-panel">
        {!reaction && <Textfield ref={searchRef} aria-label="Emoji ara" placeholder="Emoji ara" value={query}
            onChange={event => { setQuery(event.target.value); setActive(null); }} onKeyDown={event => {
                if (event.key === 'ArrowDown') { event.preventDefault(); optionsRef.current?.querySelector('button')?.focus(); }
            }} />}
        <div ref={optionsRef} className="emoji-options" role="group" aria-label={reaction ? 'Tepkiler' : 'Emojiler'}
            onKeyDown={event => {
                const buttons = [...optionsRef.current.querySelectorAll('button:not(:disabled)')];
                const index = buttons.indexOf(event.target.closest('button'));
                if (index < 0) return;
                const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 6, ArrowUp: -6, Home: -index, End: buttons.length - 1 - index };
                if (!(event.key in moves)) return;
                event.preventDefault();
                const next = ((index + moves[event.key]) % buttons.length + buttons.length) % buttons.length;
                setActive(options[next].value); buttons[next].focus();
            }}>
            {options.map(({ value, name }) => <Button key={value} appearance="subtle" aria-label={`${name}: ${value}`}
                title={value} isSelected={reaction && selected === value} aria-pressed={reaction ? selected === value : undefined}
                isDisabled={loading} tabIndex={value === focused ? 0 : -1} onFocus={() => setActive(value)}
                onClick={() => onSelect(value)}><span className="emoji-glyph" aria-hidden="true">{value}</span></Button>)}
        </div>
        {!options.length && <p role="status">Emoji bulunamadı.</p>}
        {loading && <div role="status" className="auth-progress"><Spinner size="small" />Tepki kaydediliyor</div>}
        {error && <div role="alert"><SectionMessage appearance="error">{error}</SectionMessage></div>}
    </div>;
    return mobile ? <Modal width="small" onClose={onClose} shouldReturnFocus={false} autoFocus={false}>
        <ModalHeader><ModalTitle>{reaction ? 'Tepki ver' : 'Emoji ekle'}</ModalTitle></ModalHeader>
        <ModalBody>{content}</ModalBody>
        <ModalFooter><Button onClick={onClose} isDisabled={loading}>Vazgeç</Button></ModalFooter>
    </Modal> : content;
}
