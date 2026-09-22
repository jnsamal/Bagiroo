// Number is configurable via /api/v1/settings/public (site_settings table),
// never hard-coded, per the spec.
export default function WhatsAppLauncher({ phoneNumber }) {
  if (!phoneNumber) return null;

  return (
    <a
      href={`https://wa.me/${phoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 bg-ink text-background rounded-full w-12 h-12 flex items-center justify-center"
    >
      <img src="/images/whatsapp.png" alt="" width="32" height="32" className="w-8 h-8 object-contain brightness-0 invert" />
    </a>
  );
}
