import { useState } from 'react';
import { FacebookAuthProvider, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Íconos SVG inline para Google y Facebook
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <g>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.91 2.36 30.28 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.42c-.54 2.9-2.18 5.36-4.64 7.04l7.2 5.6C43.98 37.13 46.1 31.27 46.1 24.5z"/>
      <path fill="#FBBC05" d="M9.67 28.94A14.5 14.5 0 0 1 9.5 24c0-1.7.29-3.34.8-4.94l-7.98-6.2A23.93 23.93 0 0 0 0 24c0 3.77.9 7.34 2.5 10.5l7.17-5.56z"/>
      <path fill="#34A853" d="M24 48c6.28 0 11.56-2.08 15.41-5.66l-7.2-5.6c-2.01 1.35-4.6 2.16-8.21 2.16-6.38 0-11.87-3.63-14.33-8.94l-7.17 5.56C6.73 42.52 14.82 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </g>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#1877F2" d="M24 4C12.95 4 4 12.95 4 24c0 9.68 7.16 17.68 16.44 19.54V30.89h-4.95v-6.89h4.95v-5.25c0-4.9 2.93-7.6 7.42-7.6 2.15 0 4.4.38 4.4.38v4.83h-2.48c-2.44 0-3.2 1.52-3.2 3.08v3.56h5.44l-.87 6.89h-4.57v12.65C36.84 41.68 44 33.68 44 24c0-11.05-8.95-20-20-20z"/>
    <path fill="#FFF" d="M32.07 37.54V30.89h4.57l.87-6.89h-5.44v-3.56c0-1.56.76-3.08 3.2-3.08h2.48v-4.83s-2.25-.38-4.4-.38c-4.49 0-7.42 2.7-7.42 7.6v5.25h-4.95v6.89h4.95v6.65A20.02 20.02 0 0 0 24 44c5.52 0 10.54-2.08 14.44-5.46z"/>
  </svg>
);

// Componente de Login
export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Login con Google
  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido');
    }
  };

  // Login con Facebook
  const handleFacebookLogin = async () => {
    setError('');
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido');
    }
  };

  return (
    <div className="login-container">
      <button
        onClick={handleGoogleLogin}
        className="login-button google-button"
      >
        <span className="login-icon">
          <GoogleIcon />
        </span>
        Login with Google
      </button>
      
      <button
        onClick={handleFacebookLogin}
        className="login-button facebook-button"
      >
        <span className="login-icon">
          <FacebookIcon />
        </span>
        Login with Facebook
      </button>

      {/* Texto de ayuda en inglés */}
      <p className="login-help" style={{marginTop:16, color:'#555', fontSize:14, textAlign:'center'}}>
        Sign in using your email. If you forgot your password, <a href="#" style={{color:'#1877f2', textDecoration:'underline'}}>click here to recover it</a>.
      </p>
      
      {error && <p className="login-error">{translateError(error)}</p>}
    </div>
  );
}

// Función para traducir errores
function translateError(error: string) {
  if (error.includes('Error desconocido')) return 'Unknown error.';
  if (error.includes('correo')) return 'Invalid email or password.';
  return error;
}
 