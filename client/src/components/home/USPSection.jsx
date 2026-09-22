import { useWebsite } from '../../lib/useWebsite';

export default function USPSection() {
  const website = useWebsite();
  const USPS = (website.uspText ?? 'Thoughtful design\nPremium finish\nEasy returns\nCustomer support').split('\n').filter(Boolean);
  return (
    <section className="w-full px-5 sm:px-8 lg:px-12 py-12 border-t border-b border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {USPS.map((label) => (
          <p key={label} className="text-center py-4 md:py-0">
            {label}
          </p>
        ))}
      </div>
    </section>
  );
}
