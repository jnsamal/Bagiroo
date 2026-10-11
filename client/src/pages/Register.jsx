import OtpForm from '../components/auth/OtpForm';

export default function Register() {
  return (
    <div className="store-section max-w-screen-md" data-scroll-reveal>
      <p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Join Bagiroo</p>
      <h1 className="section-title mb-8">Create an account</h1>
      <div className="border border-border bg-background p-6 sm:p-8"><OtpForm purpose="REGISTER" /></div>
    </div>
  );
}
