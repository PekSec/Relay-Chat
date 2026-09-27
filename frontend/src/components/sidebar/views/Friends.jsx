import ArrowUpIcon from '@atlaskit/icon/core/arrow-up';
import ArrowDownIcon from '@atlaskit/icon/core/arrow-down';
import PeopleIcon from '@atlaskit/icon/core/people-group';
import CheckIcon from '@atlaskit/icon/core/check-mark';
import CrossIcon from '@atlaskit/icon/core/cross';
import RefreshIcon from '@atlaskit/icon/core/refresh';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Button from '@atlaskit/button/default/button';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Textfield from '@atlaskit/textfield';
import Spinner from '@atlaskit/spinner';
import SectionMessage from '@atlaskit/section-message';
import CommentIcon from '@atlaskit/icon/core/comment';
import PersonRemoveIcon from '@atlaskit/icon/core/person-remove';
import Avatar from '../../ChatAvatar';
import useFriendStore from '../../../zustand/useFriend';
import useSocket from '../../../zustand/useSocket';
import useConversation from '../../../zustand/useConversation';
import useRespondToFriendRequests from '../../../hooks/friends/useRespondToFriendRequests';
import useCancelRequest from '../../../hooks/friends/useCancelRequest';

const RemoveFriendModal = lazy(() => import('../../modals/RemoveFriendModal'));
const labels = ['Tümü', 'Gelen', 'Giden'];
const tabIcons = [PeopleIcon, ArrowDownIcon, ArrowUpIcon];
const empty = ['Henüz arkadaşın yok.', 'Gelen arkadaşlık isteği yok.', 'Gönderilmiş arkadaşlık isteği yok.'];
const failed = ['Arkadaşlar yüklenemedi.', 'Gelen istekler yüklenemedi.', 'Giden istekler yüklenemedi.'];

export default function Friends({ onBack, initialTab, lists }) {
    const [tab, setTab] = useState(initialTab === 'pending' ? 1 : 0);
    const [query, setQuery] = useState('');
    const [target, setTarget] = useState(null);
    const { friends, incomingFriendRequests, sentFriendRequests } = useFriendStore();
    const onlineUsers = useSocket(state => state.onlineUsers);
    const { conversations, setSelectedConversation } = useConversation();
    const respond = useRespondToFriendRequests();
    const cancel = useCancelRequest();
    const root = useRef(null);
    const focused = useRef(null);
    const items = [friends, incomingFriendRequests, sentFriendRequests][tab];
    const status = lists[tab];
    const personFor = item => tab === 0 ? item : tab === 1 ? item.senderId : item.receiverId;
    const visible = items.filter(item => {
        const person = personFor(item);
        return person && `${person.fullName} ${person.username}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'));
    });
    const focusFallback = () => {
        const rows = root.current?.querySelectorAll('.friend-row');
        return rows?.[Math.min(focused.current?.index ?? 0, rows.length - 1)] || root.current?.querySelector('input');
    };
    const visibleIds = visible.map(item => item._id).join(',');
    useEffect(() => {
        if (focused.current && !focused.current.element.isConnected && document.activeElement === document.body) {
            const rows = root.current?.querySelectorAll('.friend-row');
            (rows?.[Math.min(focused.current.index, rows.length - 1)] || root.current?.querySelector('input'))?.focus();
        }
    }, [visibleIds]);
    const content = <div className="friends-content">
        <div className="friends-search"><Textfield type="search" aria-label="Arkadaşlarda ara" placeholder="İsim veya kullanıcı adı"
            value={query} onChange={event => setQuery(event.target.value)} /></div>
        {status.error && <div role="alert" className="friends-status"><SectionMessage appearance="error">
            <p>{failed[tab]}</p><Button iconBefore={RefreshIcon} appearance="link" onClick={status.refresh}>Tekrar dene</Button>
        </SectionMessage></div>}
        {status.loading && <div role="status" className="friends-status"><Spinner size="small" /> Liste yükleniyor…</div>}
        <div className="friends-list scroll-slim">
            {!status.loading && !status.error && visible.length === 0 && <p className="empty-note">{query ? 'Eşleşen kişi yok.' : empty[tab]}</p>}
            {visible.map((item, index) => {
                const person = personFor(item);
                const mutation = tab === 1 ? respond : cancel;
                const pending = mutation.pendingId === item._id;
                return <article key={item._id} className="friend-row" tabIndex={-1} onFocusCapture={event => {
                    focused.current = { element: event.currentTarget, index };
                }}>
                    <div className="friend-person"><Avatar name={person.fullName} src={person.profilePic} size="medium" />
                        <div className="friend-name"><h2>{person.fullName}</h2><p>@{person.username}</p>
                            {onlineUsers.includes(person._id) && <p>Çevrimiçi</p>}</div>
                    </div>
                    <div className="friend-actions">
                        {tab === 0 ? <>
                            <Button appearance="subtle" iconBefore={PersonRemoveIcon} onClick={event => setTarget({ ...person, trigger: event.currentTarget })}>Çıkar</Button>
                            <Button appearance="primary" iconBefore={CommentIcon} onClick={() => {
                                setSelectedConversation(conversations.find(conversation => conversation._id === person._id) || person); onBack();
                            }}>Mesaj</Button>
                        </> : tab === 1 ? <>
                            <Button iconBefore={CrossIcon} appearance="subtle" isDisabled={respond.loading} onClick={() => respond.respondToRequest(item._id, 'reject')}>Reddet</Button>
                            <Button iconBefore={CheckIcon} appearance="primary" isDisabled={respond.loading} onClick={() => respond.respondToRequest(item._id, 'accept')}>Kabul et</Button>
                        </> : <Button iconBefore={CrossIcon} appearance="subtle" isDisabled={cancel.loading} onClick={() => cancel.cancelRequest(item._id)}>İsteği iptal et</Button>}
                        {tab !== 0 && pending && <span role="status"><Spinner size="small" /> İşleniyor…</span>}
                    </div>
                    {tab !== 0 && mutation.errorId === item._id && <div role="alert" className="friend-error"><SectionMessage appearance="error">{mutation.error}</SectionMessage></div>}
                </article>;
            })}
        </div>
    </div>;
    return <section ref={root} className="friends-view" aria-label="Arkadaşlar">
        <Tabs id="friends-tabs" selected={tab} onChange={index => { focused.current = null; setTab(index); }} shouldUnmountTabPanelOnChange>
            <TabList>{labels.map((label, index) => { const Icon = tabIcons[index]; return <Tab key={label}><span className="friend-tab-label"><Icon label="" />{label}</span></Tab>; })}</TabList>
            {labels.map((label, index) => <TabPanel key={label}>{tab === index ? content : null}</TabPanel>)}
        </Tabs>
        {target && <Suspense fallback={<span role="status" className="friends-status">Onay açılıyor…</span>}>
            <RemoveFriendModal target={target} onClose={() => setTarget(null)} focusFallback={focusFallback} />
        </Suspense>}
    </section>;
}
