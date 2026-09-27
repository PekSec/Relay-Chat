import AtlaskitAvatar from '@atlaskit/avatar';
import Avatar from './Avatar';

export default function ChatAvatar({ name, src, size = 'large' }) {
    return <span aria-hidden="true" className="shrink-0 inline-flex" style={{ width: size === 'medium' ? 32 : 40, height: size === 'medium' ? 32 : 40 }}><AtlaskitAvatar size={size} borderColor="transparent">
        <Avatar name={name} src={src} alt="" className="w-full h-full rounded-full object-cover" />
    </AtlaskitAvatar></span>;
}
