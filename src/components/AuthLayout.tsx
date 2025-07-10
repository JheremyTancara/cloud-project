import { useState, useRef, useEffect } from 'react';
import Login from './LoginForm';
import SignUp from './SignUpForm';
import ForgotPassword from './ForgotPasswordForm';
import '../styles/AuthLayout.css';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';
import image4 from '../assets/image4.jpeg';

const images = [image1, image2, image3, image4];

export default function AuthLayout() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const prevView = useRef(view);
  const isSignUp = view === 'signup';
  prevView.current = view;

  const [imgIdx, setImgIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isSignUp) {
      setImgIdx(0);
      intervalRef.current = setInterval(() => {
        setImgIdx((prev) => (prev + 1) % images.length);
      }, 3000);
    } else {
      setImgIdx(images.length - 1);
      intervalRef.current = setInterval(() => {
        setImgIdx((prev) => (prev - 1 + images.length) % images.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSignUp]);

  const renderForm = () => {
    if (view === 'login') return <Login onChangeView={setView} />;
    if (view === 'signup') return <SignUp onChangeView={setView} />;
    return <ForgotPassword onChangeView={setView} />;
  };

  return (
    <div className="auth-root slide-layout">
      {isSignUp ? (
        <>
          <div className={`auth-left slide-form form-animate`}>{renderForm()}</div>
          <div className={`auth-right slide-form`}><img src={images[imgIdx]} alt="auth-slide" className="auth-img" /></div>
        </>
      ) : (
        <>
          <div className={`auth-left slide-form`}><img src={images[imgIdx]} alt="auth-slide" className="auth-img" /></div>
          <div className={`auth-right slide-form form-animate`}>{renderForm()}</div>
        </>
      )}
    </div>
  );
} 