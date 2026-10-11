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

export function minorToMajorInput(minor) {
  if (minor === null || minor === undefined || minor === '') return '';
  const value = Number(minor) / 100;
  return Number.isFinite(value) ? String(value) : '';
}

export function majorInputToMinor(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;
  return Math.round((amount + Number.EPSILON) * 100);
}
