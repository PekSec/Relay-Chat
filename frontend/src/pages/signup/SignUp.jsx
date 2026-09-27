import PersonAddIcon from '@atlaskit/icon/core/person-add';
import LogInIcon from '@atlaskit/icon/core/log-in';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Form, { Field, ErrorMessage, HelperMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import { RadioGroup } from '@atlaskit/radio';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import EyeIcon from '@atlaskit/icon/core/eye-open';
import EyeOffIcon from '@atlaskit/icon/core/eye-open-strikethrough';
import { passwordIsValid } from '../../utils/password';
import useSignup from '../../hooks/auth/useSignup';

const genders = [{ value: 'male', label: 'Erkek' }, { value: 'female', label: 'Kadın' }];
const passwordFields = [
    { name: 'password', label: 'Parola', action: 'Parolayı', validate: value => !value ? 'Parolanı gir.' :
        passwordIsValid(value) ? undefined : value.length < 8 ? 'Parola en az 8 karakter olmalı.' : 'Parola çok uzun; daha az karakter kullan.' },
    { name: 'confirmPassword', label: 'Parola tekrar', action: 'Parola tekrarını', validate: (value, values) =>
        !value ? 'Parolanı tekrar gir.' : value !== values.password ? 'Parolalar eşleşmiyor.' : undefined }
];

export default function SignUp() {
    const [visible, setVisible] = useState({});
    const { signUp, loading, error } = useSignup();
    return <section className="auth-card" aria-labelledby="signup-title">
        <div className="auth-brand"><img src="/favicon.svg" alt="" width="32" height="32" />Relay</div>
        <h1 id="signup-title">Hesap oluştur</h1>
        <Form onSubmit={signUp}>
            {({ formProps }) => <form {...formProps} noValidate aria-labelledby="signup-title" aria-busy={loading}>
                {error && <div role="alert" className="auth-error"><SectionMessage appearance="error">{error}</SectionMessage></div>}
                <Field id="fullName" name="fullName" label="Ad soyad" defaultValue="" isRequired
                    validate={value => !value?.trim() ? 'Ad soyadını gir.' : value.trim().length > 50 ? 'Ad soyad en fazla 50 karakter olmalı.' : undefined}>
                    {({ fieldProps, error }) => <>
                        <Textfield {...fieldProps} autoComplete="name" isReadOnly={loading} />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>}
                </Field>
                <Field id="username" name="username" label="Kullanıcı adı" defaultValue="" isRequired
                    validate={value => !value ? 'Kullanıcı adını gir.' : !/^[a-zA-Z0-9_]{3,20}$/.test(value) ? '3–20 karakter; yalnızca A–Z, a–z, rakam ve alt çizgi.' : undefined}>
                    {({ fieldProps, error }) => <>
                        <Textfield {...fieldProps} autoComplete="username" autoCapitalize="none" spellCheck={false} isReadOnly={loading} />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>}
                </Field>
                {passwordFields.map(({ name, label, action, validate }) => <Field key={name} id={name}
                    name={name} label={label} defaultValue="" isRequired validate={validate}>
                    {({ fieldProps, error }) => <>
                        <Textfield {...fieldProps} type={visible[name] ? 'text' : 'password'} autoComplete="new-password" isReadOnly={loading}
                            elemAfterInput={<IconButton type="button" appearance="subtle"
                                icon={visible[name] ? EyeOffIcon : EyeIcon} label={`${action} ${visible[name] ? 'gizle' : 'göster'}`}
                                onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))} />} />
                        {error ? <ErrorMessage>{error}</ErrorMessage> : name === 'password' && <HelperMessage>En az 8 karakter.</HelperMessage>}
                    </>}
                </Field>)}
                <Field id="gender" name="gender" label="Cinsiyet" defaultValue="" isRequired
                    validate={value => !value ? 'Cinsiyet seç.' : undefined}>
                    {({ fieldProps, error }) => <div onBlur={fieldProps.onBlur} onFocus={fieldProps.onFocus}>
                        <RadioGroup {...fieldProps} options={genders} isDisabled={loading} />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                    </div>}
                </Field>
                <div className="auth-submit">
                    <Button iconBefore={loading ? undefined : PersonAddIcon} type="submit" appearance="primary" shouldFitContainer isDisabled={loading}>
                        {loading ? <span className="auth-progress"><Spinner size="small" />Oluşturuluyor</span> : 'Kayıt ol'}
                    </Button>
                </div>
                <Link to="/login" className="auth-signup"><LogInIcon label="" />Giriş yap</Link>
            </form>}
        </Form>
    </section>;
}
