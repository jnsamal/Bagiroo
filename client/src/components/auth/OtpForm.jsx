import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

// Shared two-step OTP form used by both Login.jsx and Register.jsx.
// purpose: 'LOGIN' | 'REGISTER'
export default function OtpForm({ purpose, variant = 'page', titleId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearSessionExpired } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const isModal = variant === 'modal';
  const requestedPath = location.state?.from?.pathname;
  const safeRequestedPath = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
    ? `${requestedPath}${location.state?.from?.search || ''}`
    : null;

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const requestedEmail = email.trim().toLowerCase();
      await api.post('/auth/otp/request', { email: requestedEmail, purpose });
      setEmail(requestedEmail);
      setStep('otp');
      setResendSeconds(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setResendSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function resendOtp() {
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/otp/request', { email, purpose });
      setResendSeconds(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.post('/auth/otp/verify', { email, code, purpose });
      const { user } = result;
      clearSessionExpired();
      queryClient.setQueryData(['me'], { user });
      ['me', 'cart', 'wishlist', 'account-orders'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        queryClient.invalidateQueries({ queryKey: ['admin-me'] });
        const adminDestination = safeRequestedPath?.startsWith('/admin') ? safeRequestedPath : '/admin';
        navigate(adminDestination, { replace: true });
      } else if (result.needsProfile) {
        setVerifiedUser(user);
        setStep('profile');
      } else {
        setVerifiedUser(user);
        setStep('welcome');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfile(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const normalizedPhone = phone.trim() ? (phone.trim().startsWith('+') ? phone.trim() : `+91${phone.replace(/\D/g, '')}`) : undefined;
      const user = await api.patch('/account', { name: name.trim(), ...(normalizedPhone ? { phone: normalizedPhone } : {}) });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setVerifiedUser(user);
      setStep('welcome-new');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const continueToAccount = () => navigate(safeRequestedPath || '/account', { replace: true });

  if (step === 'email') {
    return (
      <form onSubmit={handleRequestOtp} className={`w-full space-y-4 ${isModal ? '' : 'max-w-sm'}`}>
        {isModal && (
          <div className="mb-5 text-center">
            <h1 id={titleId} className="text-xl font-bold uppercase tracking-tight">Discover Bagiroo</h1>
            <p className="mt-2 text-xs text-muted">Enter your email address to Login/Signup</p>
          </div>
        )}
        <div>
          {!isModal && <label htmlFor="email" className="block text-sm mb-1">Email address</label>}
          <div>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              className={`form-field ${isModal ? 'rounded-md' : ''}`}
            />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`store-button w-full border border-ink bg-ink text-background disabled:opacity-50 ${isModal ? 'rounded-md normal-case' : ''}`}
        >
          {isSubmitting ? 'Sending code…' : isModal ? 'Submit' : 'Send OTP'}
        </button>
        {isModal && (
          <label className="flex items-start gap-2 text-[10px] leading-relaxed text-muted">
            <input type="checkbox" defaultChecked className="mt-0.5 accent-black" />
            <span>Get offers and launch updates via email. <a href="/privacy" className="underline underline-offset-2">Read details</a></span>
          </label>
        )}
      </form>
    );
  }

  if (step === 'profile') {
    return <form onSubmit={handleProfile} className={`w-full space-y-5 ${isModal ? '' : 'max-w-sm'}`}>
      <div><h2 className="text-2xl font-semibold">Tell us about yourself</h2><p className="text-sm text-muted mt-2">Your email is verified. Complete your personal information to create your account.</p></div>
      <label className="block text-sm">Full name *<input autoFocus required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="admin-input mt-2" /></label>
      <label className="block text-sm">Mobile number <span className="text-muted">(optional)</span><div className="mt-2 flex"><span className="flex items-center border border-r-0 border-border px-3 text-sm text-muted">+91</span><input type="tel" inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} value={phone.replace(/^\+91/, '')} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} autoComplete="tel" className="admin-input" /></div></label>
      <p className="text-xs text-muted">Verified email: {verifiedUser?.email}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="store-button w-full border border-ink bg-ink text-background disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Complete profile'}</button>
    </form>;
  }

  if (step === 'welcome' || step === 'welcome-new') {
    return <div className={`${isModal ? 'w-full py-6' : 'max-w-xl w-full min-h-80 mx-auto border border-border p-10 sm:p-14'} text-center flex flex-col items-center justify-center`} role="status">
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">{step === 'welcome' ? `Welcome Back ${verifiedUser?.name}` : `Welcome ${verifiedUser?.name}`}</h2>
      <p className="text-base text-muted mt-5">You’re signed in and ready to continue.</p>
      <button type="button" onClick={continueToAccount} className="store-button border border-transparent bg-ink text-background mt-8 w-full max-w-sm hover:border-ink">Continue</button>
    </div>;
  }

  return (
    <form onSubmit={handleVerifyOtp} className={`w-full space-y-4 ${isModal ? '' : 'max-w-sm'}`}>
      {isModal && <h1 id={titleId} className="text-center text-xl font-bold uppercase tracking-tight">Verify your email</h1>}
      <p className="text-sm text-muted">Enter the 6-digit code sent to {email}.</p>
      <div>
        <label htmlFor="code" className="block text-sm mb-1">OTP code</label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="form-field tracking-[.35em]"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="store-button w-full border border-ink bg-ink text-background disabled:opacity-50"
      >
        {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><button type="button" onClick={() => setStep('email')} className="text-muted underline underline-offset-4">Use a different email</button><button type="button" onClick={resendOtp} disabled={resendSeconds > 0 || isSubmitting} className="underline underline-offset-4 disabled:no-underline disabled:text-muted">{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}</button></div>
    </form>
  );
}
