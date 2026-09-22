import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

// Shared two-step OTP form used by both Login.jsx and Register.jsx.
// purpose: 'LOGIN' | 'REGISTER'
export default function OtpForm({ purpose, variant = 'page', titleId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isModal = variant === 'modal';

  const normalizedPhone = () => {
    const trimmed = phone.trim();
    if (!isModal || trimmed.startsWith('+')) return trimmed;
    return `+91${trimmed.replace(/\D/g, '')}`;
  };

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const requestedPhone = normalizedPhone();
      await api.post('/auth/otp/request', { phone: requestedPhone, purpose });
      setPhone(requestedPhone);
      setStep('otp');
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
      const result = await api.post('/auth/otp/verify', { phone, code, purpose });
      const { user } = result;
      ['me', 'cart', 'wishlist', 'account-orders'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        navigate('/admin/login');
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
      const user = await api.patch('/account', { name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setVerifiedUser(user);
      setStep('welcome-new');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const continueToAccount = () => navigate(location.state?.from?.pathname || '/account');

  if (step === 'phone') {
    return (
      <form onSubmit={handleRequestOtp} className={`w-full space-y-4 ${isModal ? '' : 'max-w-sm'}`}>
        {isModal && (
          <div className="mb-5 text-center">
            <h1 id={titleId} className="text-xl font-bold uppercase tracking-tight">Discover Bagiroo</h1>
            <p className="mt-2 text-xs text-muted">Enter your mobile number to Login/Signup</p>
          </div>
        )}
        <div>
          {!isModal && <label htmlFor="phone" className="block text-sm mb-1">Mobile number</label>}
          <div className={isModal ? 'flex gap-1.5' : ''}>
            {isModal && <span className="flex h-11 items-center rounded-md border border-border px-3 text-sm text-muted">+91</span>}
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={isModal ? 'Enter Mobile Number' : '+91XXXXXXXXXX'}
              value={isModal ? phone.replace(/^\+91/, '') : phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern={isModal ? '[0-9]{10}' : undefined}
              minLength={isModal ? 10 : undefined}
              maxLength={isModal ? 10 : undefined}
              className={`w-full border border-border px-3 py-2 ${isModal ? 'h-11 rounded-md text-sm' : 'rounded-sm'}`}
            />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-ink text-background py-3 text-sm tracking-wide transition-colors duration-200 hover:bg-black disabled:opacity-50 ${isModal ? 'rounded-md normal-case' : 'uppercase'}`}
        >
          {isSubmitting ? 'Sending code…' : isModal ? 'Submit' : 'Send OTP'}
        </button>
        {isModal && (
          <label className="flex items-start gap-2 text-[10px] leading-relaxed text-muted">
            <input type="checkbox" defaultChecked className="mt-0.5 accent-black" />
            <span>Get offers and launch updates via Email/SMS. <a href="/privacy" className="underline underline-offset-2">Read details</a></span>
          </label>
        )}
      </form>
    );
  }

  if (step === 'profile') {
    return <form onSubmit={handleProfile} className={`w-full space-y-5 ${isModal ? '' : 'max-w-sm'}`}>
      <div><h2 className="text-2xl font-semibold">Tell us about yourself</h2><p className="text-sm text-muted mt-2">Your number is verified. Complete your personal information to create your account.</p></div>
      <label className="block text-sm">Full name *<input autoFocus required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="admin-input mt-2" /></label>
      <label className="block text-sm">Email address <span className="text-muted">(optional)</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="admin-input mt-2" /></label>
      <p className="text-xs text-muted">Mobile number: {verifiedUser?.phone}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full bg-ink text-background py-3 uppercase text-sm tracking-wide disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Complete profile'}</button>
    </form>;
  }

  if (step === 'welcome' || step === 'welcome-new') {
    return <div className={`${isModal ? 'w-full py-6' : 'max-w-xl w-full min-h-80 mx-auto border border-border p-10 sm:p-14'} text-center flex flex-col items-center justify-center`} role="status">
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">{step === 'welcome' ? `Welcome Back ${verifiedUser?.name}` : `Welcome ${verifiedUser?.name}`}</h2>
      <p className="text-base text-muted mt-5">You’re signed in and ready to continue.</p>
      <button type="button" onClick={continueToAccount} className="store-button bg-ink text-background mt-8 w-full max-w-sm">Continue</button>
    </div>;
  }

  return (
    <form onSubmit={handleVerifyOtp} className={`w-full space-y-4 ${isModal ? '' : 'max-w-sm'}`}>
      {isModal && <h1 id={titleId} className="text-center text-xl font-bold uppercase tracking-tight">Verify your number</h1>}
      <p className="text-sm text-muted">Enter the 6-digit code sent to {phone}.</p>
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
          className="w-full border border-border px-3 py-2 rounded-sm tracking-widest"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ink text-background py-3 uppercase text-sm tracking-wide disabled:opacity-50"
      >
        {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
      </button>
      <button
        type="button"
        onClick={() => setStep('phone')}
        className="text-sm text-muted underline"
      >
        Use a different number
      </button>
    </form>
  );
}
