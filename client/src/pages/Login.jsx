import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpForm from '../components/auth/OtpForm';
import HeroSection from '../components/home/HeroSection';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative min-h-[72vh]">
      <HeroSection />

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-login-title"
          className="relative grid w-full max-w-[760px] overflow-hidden rounded-2xl bg-white md:grid-cols-[1.03fr_0.97fr]"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close login"
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-xl leading-none text-ink transition-colors duration-200 hover:bg-ink hover:text-white"
          >
            ×
          </button>

          <div className="hidden min-h-[330px] flex-col items-center justify-center bg-black px-8 py-10 text-center text-white md:flex">
            <p className="footer-brand-heading text-3xl">Bagiroo &amp; Co.</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/90">
              Discover new styles, stories and moments from the world of Bagiroo.
            </p>
            <div className="mt-12 w-full rounded-lg border border-white/60 px-5 py-3">
              <p className="text-base font-semibold">Extra 5% OFF</p>
              <p className="text-xs text-white/80">Auto-applied on all prepaid orders</p>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full border border-white bg-white" />
              <span className="h-1.5 w-1.5 rounded-full border border-white" />
              <span className="h-1.5 w-1.5 rounded-full border border-white" />
            </div>
          </div>

          <div className="flex min-h-[390px] items-center px-6 py-12 sm:px-10 md:min-h-[330px] md:py-10">
            <OtpForm purpose="LOGIN" variant="modal" titleId="customer-login-title" />
          </div>
        </section>
      </div>
    </div>
  );
}
