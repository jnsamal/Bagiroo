import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// No passwords exist in this app (OTP-only auth) -- "security" here means
// session management. Deeper device/session-list management is a Phase 5+
// nice-to-have, not built yet.
export default function AccountSecurity() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setError('');
    setIsSigningOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setIsSigningOut(false);
    }
  }

  return (
    <div>
      <h1 className="account-heading">Login &amp; security</h1>
      <p className="text-sm text-muted mb-6">
        Bagiroo&amp;Co. uses email OTP sign-in, so there is no password to manage. If you think your email account has been compromised, contact support to secure your account.
      </p>
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={handleLogout} disabled={isSigningOut} className="store-button border border-ink disabled:cursor-not-allowed disabled:opacity-50">
        {isSigningOut ? 'Signing out…' : 'Log out'}
      </button>
    </div>
  );
}
