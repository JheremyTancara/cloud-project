import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import '../styles/ForgotPasswordForm.css';

interface Props {
  onChangeView: (view: 'login' | 'signup' | 'forgot') => void;
}

export default function ForgotPasswordForm({ onChangeView }: Props) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your email for reset instructions.');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2 className="forgot-title">Cloud Development</h2>
      <p className="forgot-password-subtitle forgot-desc-center">Enter your email to reset your password</p>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="forgot-password-input"
        />
        <button 
          type="submit" 
          disabled={loading} 
          className="forgot-password-button"
        >
          {loading ? 'Loading...' : 'Send Reset Email'}
        </button>
      </form>
      {message && <p className="forgot-password-message success">{message}</p>}
      {error && <p className="forgot-password-message error">{error}</p>}
      <div className="forgot-password-footer">
        Remember your password?{' '}
        <button 
          type="button" 
          onClick={() => onChangeView('login')} 
          className="forgot-password-link"
        >
          Login
        </button>
      </div>
    </div>
  );
}
 