import Button from '@atlaskit/button/new';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useLogin from '../../hooks/auth/useLogin';

const Login = () => {

	const [inputs, setInputs] = useState({//inputs state objesi oluşturuluyor ve useState ile yönetiliyor
		username: "",
		password: ""
	});
	const [showPassword, setShowPassword] = useState(false);
	const { loading, login } = useLogin();

	const handleSubmit = async (e) => { // form submit işlemi için handleSubmit fonksiyonu
		e.preventDefault(); // sayfanın yenilenmesini engeller
		await login(inputs); // login işleminin tamamlanmasını bekle
	};

	//görsel kısım
	return (
		<div className='w-full max-w-sm mx-auto'>
			<div className='surface rounded-lg p-7'>

				{/* Marka başlığı */}
				<div className='flex flex-col items-center gap-2 mb-6'>
					<img src="/favicon.svg" alt="Relay" width="48" height="48" />
					<h1 className='text-xl font-semibold' style={{ color: 'var(--text-primary)' }}>
						Giriş yap
					</h1>
				</div>

				<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1.5'>
						<label htmlFor='username' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
							Kullanıcı adı
						</label>
						<input
							id='username'
                            autoCapitalize='none'
                            spellCheck={false}
                            required
							type='text'
							autoComplete='username'
							placeholder='kullaniciadin'
							className='field'
							name='username'
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						//input alanında değişiklik olduğunda tetiklenir, e objesinin target özelliği input elementini temsil eder
						//setInputs ile mevcut state korunup sadece username alanı güncellenir
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<label htmlFor='password' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
							Parola
						</label>
						<div className='relative'>
							<input
								id='password'
                                required
								type={showPassword ? 'text' : 'password'}
								autoComplete='current-password'
								placeholder='••••••••'
								className='field field-action'
								name='password'
								value={inputs.password}
								onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
							/>
							<button
								type='button'
								onClick={() => setShowPassword((v) => !v)}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-sm'
								style={{ color: 'var(--text-muted)' }}
								aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>

					{/* Login butonu */}
					<Button type='submit' appearance='primary' isDisabled={loading}
					>
						{loading ? (
							<>
								<span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
								Giriş yapılıyor
							</>
						) : 'Giriş yap'}
					</Button>

					<Link to='/signup' className='text-center text-sm mt-1' style={{ color: 'var(--text-secondary)' }}>
						Hesabın yok mu?{' '}
						<span style={{ color: 'var(--accent-hover)' }} className='font-medium hover:underline'>
							Kayıt ol
						</span>
					</Link>
				</form>
			</div>
		</div>
	);
}

export default Login;
