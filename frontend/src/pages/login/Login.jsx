import { useState } from 'react';
import { Link } from 'react-router-dom';
import Form, { Field, ErrorMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import Button from '@atlaskit/button/default/button';
import IconButton from '@atlaskit/button/icon/button';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import EyeIcon from '@atlaskit/icon/core/eye-open';
import EyeOffIcon from '@atlaskit/icon/core/eye-open-strikethrough';
import useLogin from '../../hooks/auth/useLogin';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { loading, error, login } = useLogin();
    return <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand"><img src="/favicon.svg" alt="" width="32" height="32" />Relay</div>
        <h1 id="login-title">Giriş yap</h1>
        <Form onSubmit={login}>
            {({ formProps }) => <form {...formProps} noValidate aria-labelledby="login-title" aria-busy={loading}>
                {error && <div role="alert" className="auth-error"><SectionMessage appearance="error">{error}</SectionMessage></div>}
                <Field name="username" label="Kullanıcı adı" defaultValue="" isRequired
                    validate={value => !value?.trim() ? 'Kullanıcı adını gir.' : undefined}>
                    {({ fieldProps, error }) => <>
                        <Textfield {...fieldProps} autoComplete="username"
                            autoCapitalize="none" spellCheck={false} isReadOnly={loading} />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>}
                </Field>
                <Field name="password" label="Parola" defaultValue="" isRequired
                    validate={value => !value ? 'Parolanı gir.' : undefined}>
                    {({ fieldProps, error }) => <>
                        <Textfield {...fieldProps} type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password" isReadOnly={loading}
                            elemAfterInput={<IconButton type="button" appearance="subtle"
                                icon={showPassword ? EyeOffIcon : EyeIcon}
                                label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                                onClick={() => setShowPassword(value => !value)} />} />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                    </>}
                </Field>
                <div className="auth-submit">
                    <Button type="submit" appearance="primary" shouldFitContainer isDisabled={loading}>
                        {loading ? <span className="auth-progress"><Spinner size="small" />Giriş yapılıyor</span> : 'Giriş yap'}
                    </Button>
                </div>
                <Link to="/signup" className="auth-signup">Kayıt ol</Link>
            </form>}
        </Form>
    </section>;
}
