import { usePublicSettings } from '../../lib/useWebsite';

export default function USPSection() {
  const settings = usePublicSettings();
  const website = settings?.website || {};
  const USPS = (website.uspText ?? 'Thoughtful design\nPremium finish\nEasy returns\nCustomer support').split('\n').filter(label => label && (settings?.returnsEnabled !== false || !/returns?/i.test(label)));
  const title = website.uspTitle ?? 'Why shop with Bagiroo';
  return (
    <section className="w-full bg-ink px-5 py-8 text-background sm:px-8 lg:px-12 lg:py-10" aria-labelledby="usp-title">
      <h2 id="usp-title" className="mb-6 text-2xl font-semibold sm:text-3xl">{title}</h2>
      <div className={`grid grid-cols-2 border-l border-t border-white/20 ${USPS.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
        {USPS.map((label, index) => (
          <div key={`${label}-${index}`} className="group min-h-32 border-b border-r border-white/20 p-4 transition-colors duration-300 hover:bg-background hover:text-ink sm:min-h-36 sm:p-6 lg:min-h-40 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[11px] tracking-[0.22em] text-white/50 transition-colors group-hover:text-muted">{String(index + 1).padStart(2, '0')}</span>
              <span aria-hidden="true" className="relative mt-1 block h-4 w-4 transition-transform duration-300 ease-out group-hover:rotate-90">
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
              </span>
            </div>
            <p className="mt-9 text-base font-medium leading-snug sm:mt-11 sm:text-lg lg:text-xl">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
