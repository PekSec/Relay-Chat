import IconButton from '@atlaskit/button/icon/button';
import CrossIcon from '@atlaskit/icon/core/cross';

export default function PopupHeading({ children, icon: Icon, danger = false, onClose, disabled = false }) {
    return <div className="popup-heading">
        {Icon ? <span className={`popup-heading-icon${danger ? ' popup-heading-danger' : ''}`}><Icon label="" /></span>
            : <img src="/favicon.svg" width="40" height="40" alt="" />}
        {children}
        <IconButton icon={CrossIcon} label="Kapat" appearance="subtle" onClick={onClose} isDisabled={disabled} />
    </div>;
}
