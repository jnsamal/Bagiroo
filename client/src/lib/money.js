// Money is stored server-side as integer paise. Format for display here so
// no component does its own ad-hoc division/rounding.
export function formatPrice(minor, currency = 'INR') {
  if (minor === null || minor === undefined) return null;
  const value = minor / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
