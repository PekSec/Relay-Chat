import { useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button/default/button';
import Textfield from '@atlaskit/textfield';
import PopupHeading from '../PopupHeading';
import SearchIcon from '@atlaskit/icon/core/search';
import PeopleIcon from '@atlaskit/icon/core/people-group';
import Spinner from '@atlaskit/spinner';
import SectionMessage from '@atlaskit/section-message';
import Avatar from '../ChatAvatar';
import useSearchUsers from '../../hooks/friends/useSearchUsers';
import useSendFriendRequest from '../../hooks/friends/useSendFriendRequest';
import useConversation from '../../zustand/useConversation';
import useFriendStore from '../../zustand/useFriend';

export default function NewChatModal({ trigger, lists, onClose, onConversation, onIncoming }) {
    const [query, setQuery] = useState('');
    const input = useRef(null);
    const destination = useRef(null);
    const returnFocus = useMemo(() => ({ get current() {
        return destination.current ? document.querySelector(destination.current) : trigger;
    } }), [trigger]);
    const search = useSearchUsers(query);
    const { sendFriendRequest, loading, pendingIds, errors } = useSendFriendRequest();
    const { friends, incomingFriendRequests, sentFriendRequests } = useFriendStore();
    const failed = lists.filter(list => list.error);
    const relationshipsReady = !lists.some(list => list.loading || list.error);
    return <Modal testId="relay-modal-new-chat" width={680} autoFocus={input} shouldReturnFocus={returnFocus} onClose={() => { if (!loading) onClose(); }}>
        <ModalHeader>
            <PopupHeading onClose={onClose} disabled={loading}><ModalTitle>Yeni sohbet</ModalTitle></PopupHeading>
        </ModalHeader>
        <ModalBody>
            <div className="new-chat-search">
                <label htmlFor="find-person">Kullanıcı adı veya arkadaş kodu</label>
                <Textfield ref={input} id="find-person" type="search" value={query} onChange={event => setQuery(event.target.value)}
                    placeholder="Örneğin: ecedemir" autoComplete="off" spellCheck={false}
                    elemBeforeInput={<span className="new-chat-search-icon"><SearchIcon label="" /></span>}
                    aria-describedby={search.validation ? 'new-chat-help new-chat-validation' : 'new-chat-help'} isInvalid={Boolean(search.validation)} />
                <p id="new-chat-help">En az 2 karakter yaz. Arkadaş kodunu # olmadan gir.</p>
            </div>
            {failed.length > 0 && <div role="alert"><SectionMessage appearance="error">Arkadaşlık durumu yüklenemedi.
                <Button appearance="link" onClick={() => failed.forEach(list => list.refresh())}>Tekrar dene</Button>
            </SectionMessage></div>}
            <div className="new-chat-results" aria-busy={search.loading}>
                {search.validation ? <p id="new-chat-validation" role="alert" className="new-chat-feedback">{search.validation}</p>
                    : search.error ? <div role="alert"><SectionMessage appearance="error">{search.error}
                        <Button appearance="link" onClick={search.retry}>Tekrar dene</Button></SectionMessage></div>
                    : search.loading ? <div role="status" className="new-chat-empty"><Spinner size="large" /><p>Kişiler aranıyor…</p></div>
                    : search.query.length < 2 ? <div className="new-chat-empty">
                        <span className="new-chat-empty-icon"><PeopleIcon label="" size="medium" /></span>
                        <h2>Kişi bul</h2><p>Sonuçlardan sohbet açabilir veya<br />arkadaşlık isteği gönderebilirsin.</p>
                    </div>
                    : search.users.length === 0 ? <div role="status" className="new-chat-empty"><span className="new-chat-empty-icon"><SearchIcon label="" /></span>
                        <p>Kullanıcı bulunamadı. Yazdığın adı veya kodu kontrol et.</p></div>
                    : <>
                        <div className="new-chat-list-heading"><h2>Kişiler <span>{search.users.length}</span></h2>
                            <p role="status" aria-label={`${search.users.length} kişi bulundu`}>En fazla 20 sonuç</p></div>
                        <div className="new-chat-list">
                        {search.users.map(person => {
                            const isFriend = friends.some(item => item._id === person._id);
                            const received = incomingFriendRequests.some(item => item.senderId?._id === person._id);
                            const sent = sentFriendRequests.some(item => item.receiverId?._id === person._id);
                            const sending = pendingIds.includes(person._id);
                            const status = sending ? 'İstek gönderiliyor…' : !relationshipsReady
                                ? `Arkadaşlık durumu ${failed.length ? 'alınamadı' : 'yükleniyor…'}`
                                : isFriend ? 'Arkadaşın' : received ? 'Gelen istek var' : sent ? 'İstek gönderildi' : 'Arkadaş değilsiniz';
                            return <article className="new-chat-person" key={person._id}>
                                <div className="new-chat-avatar"><Avatar name={person.fullName} src={person.profilePic} /></div>
                                <div className="new-chat-identity">
                                    <h2>{person.fullName}</h2>
                                    <div className="new-chat-details"><span>@{person.username}</span><span className="new-chat-code">#{person.friendCode}</span></div>
                                    <p role="status" className={`new-chat-status ${relationshipsReady && (received || sent) ? 'new-chat-status-request' : ''}`}>
                                        {sending && <Spinner size="small" />}{status}
                                    </p>
                                </div>
                                <div className="new-chat-actions">
                                    {relationshipsReady && received && !isFriend && <Button isDisabled={loading}
                                        aria-label="Gelen isteklere git" onClick={() => {
                                            destination.current = '[role="tab"][aria-selected="true"]'; onIncoming();
                                        }}>İsteklere git</Button>}
                                    {(sending || (relationshipsReady && !isFriend && !received && !sent)) &&
                                        <Button isDisabled={sending} onClick={() => sendFriendRequest(person._id)}>
                                            {sending ? 'Gönderiliyor' : 'Arkadaş ekle'}
                                        </Button>}
                                    <div className="new-chat-open"><Button appearance="primary" isDisabled={loading} onClick={() => {
                                        const state = useConversation.getState();
                                        state.setSelectedConversation(state.conversations.find(item => item._id === person._id) || person);
                                        destination.current = 'textarea[aria-label="Mesaj"]'; onConversation();
                                    }}>Sohbet aç</Button></div>
                                </div>
                                {errors[person._id] && <div role="alert" className="new-chat-person-error"><SectionMessage appearance="error">{errors[person._id]}</SectionMessage></div>}
                            </article>;
                        })}
                        </div>
                    </>}
            </div>
        </ModalBody>
    </Modal>;
}
