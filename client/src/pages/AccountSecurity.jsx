import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// No passwords exist in this app (OTP-only auth) -- "security" here means
// session management. Deeper device/session-list management is a Phase 5+
// nice-to-have, not built yet.
export default function AccountSecurity() {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post('/auth/logout', {});
    navigate('/');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Login &amp; Security</h1>
      <p className="text-sm text-muted mb-6">
        Bagiroo&amp;Co. uses OTP sign-in — there's no password to manage. If you think your
        number has been compromised, contact support to secure your account.
      </p>
      <button onClick={handleLogout} className="border border-ink px-6 py-3 text-sm uppercase tracking-wide">
        Log out
      </button>
    </div>
  );
}
