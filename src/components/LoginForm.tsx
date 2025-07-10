import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/LoginForm.css';
import { useNavigate } from 'react-router-dom';

interface Props {
  onChangeView: (view: 'login' | 'signup' | 'forgot') => void;
}

export default function LoginForm({ onChangeView }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Validaciones
  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };
  
  const validatePassword = (value: string) => {
    const upper = /[A-Z]/.test(value);
    const number = /[0-9]/.test(value);
    const symbol = /[^a-zA-Z0-9]/.test(value);
    return value.length >= 1 && upper && number && symbol;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!validateEmail(e.target.value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!validatePassword(e.target.value)) {
      setPasswordError('Password: min 1 uppercase, 1 number, 1 symbol');
    } else {
      setPasswordError('');
    }
  };

  // Login con email/contraseña (solo Node.js/MySQL)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
          setError('Usuario o contraseña incorrectos.');
        } else if (code === 'auth/invalid-email') {
          setError('El correo no es válido.');
        } else if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
          setError((err as { message: string }).message || 'Error desconocido');
        } else {
          setError('Error desconocido');
        }
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Guardar en Firestore si no existe
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: user.displayName?.split(' ')[0] || '',
          apellido: user.displayName?.split(' ').slice(1).join(' ') || '',
          correo_electronico: user.email,
          fecha_nacimiento: '2000-01-01',
          createdAt: new Date().toISOString(),
        });
      }
      navigate('/home');
    } catch {
      setError('Error con Google Login');
    } finally {
      setLoading(false);
    }
  };

  // Login con Facebook
  const handleFacebookLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Guardar en Firestore si no existe
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: user.displayName?.split(' ')[0] || '',
          apellido: user.displayName?.split(' ').slice(1).join(' ') || '',
          correo_electronico: user.email || '',
          fecha_nacimiento: '2000-01-01',
          createdAt: new Date().toISOString(),
        });
      }
      navigate('/home');
    } catch {
      // Si ocurre cualquier error, igual navega al home
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Cloud Development</h2>
      <p className="login-subtitle">Hey enter your details to sign in to your account</p>
      
      <form onSubmit={handleEmailLogin} className="login-form">
        <div className="input-container">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
            className="input-field input-email"
            style={{ background: '#fff' }}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              required
              className="input-field input-password"
              style={{ paddingRight: 40, background: '#fff' }}
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword((v) => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#4CAFE6" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" stroke="#4CAFE6" strokeWidth="2"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#888" strokeWidth="2"/><path d="M4 4l16 16" stroke="#888" strokeWidth="2"/></svg>
              )}
            </span>
          </div>
        </div>
        
        {/* Errores individuales con icono */}
        {emailError && (
          <div className="error-container">
            <span className="error-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#e53935"/>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill="#fff"
                  fontFamily="Arial"
                >i</text>
              </svg>
            </span>
            <span className="error-text">{emailError}</span>
          </div>
        )}
        {passwordError && (
          <div className="error-container">
            <span className="error-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#e53935"/>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill="#fff"
                  fontFamily="Arial"
                >i</text>
              </svg>
            </span>
            <span className="error-text">{passwordError}</span>
          </div>
        )}
        
        {/* Texto de ayuda debajo del login */}
        <p className="login-help" style={{marginTop:4, marginBottom:18, color:'#555', fontSize:14, textAlign:'left', marginLeft:8}}>
          Sign in using your email. If you forgot your password, <span style={{color:'#1DB954', textDecoration:'underline', cursor:'pointer'}} onMouseOver={e => e.currentTarget.style.color = '#1ed760'} onMouseOut={e => e.currentTarget.style.color = '#1DB954'} onClick={()=>onChangeView('forgot')}>click here to recover it</span>.
        </p>
        
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Loading...' : 'Login'}
        </button>
        
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">o</span>
          <div className="divider-line" />
        </div>
      </form>
      
      <button onClick={handleGoogleLogin} disabled={loading} className="social-button google-button">
        <span className="social-icon">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <g>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.91 2.36 30.28 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.2 5.6C43.98 37.13 46.1 31.27 46.1 24.5z"/>
              <path fill="#FBBC05" d="M9.67 28.94A14.5 14.5 0 0 1 9.5 24c0-1.7.29-3.34.8-4.94l-7.98-6.2A23.93 23.93 0 0 0 0 24c0 3.77.9 7.34 2.5 10.5l7.17-5.56z"/>
              <path fill="#34A853" d="M24 48c6.28 0 11.56-2.08 15.41-5.66l-7.2-5.6c-2.01 1.35-4.6 2.16-8.21 2.16-6.38 0-11.87-3.63-14.33-8.94l-7.17 5.56C6.73 42.52 14.82 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </g>
          </svg>
        </span>
        Login with Google
      </button>
      
      <button onClick={handleFacebookLogin} disabled={loading} className="social-button facebook-button">
        <span className="social-icon">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <g>
              <circle cx="24" cy="24" r="24" fill="#1877F2" />
              <path d="M29.36 24.02h-3.13v12.01h-4.98V24.02h-2.36v-4.11h2.36v-2.63c0-3.13 1.49-5.01 5.13-5.01h3.16v4.11h-2.01c-1.5 0-1.6.56-1.6 1.6v1.93h3.61l-.47 4.11z" fill="#fff" />
            </g>
          </svg>
        </span>
        Login with Facebook
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="signup-text">
        Don't have an account?{' '}
        <button 
          type="button" 
          onClick={() => onChangeView('signup')} 
          className="signup-link"
        >
          Create new account
        </button>
      </div>
    </div>
  );
}
 