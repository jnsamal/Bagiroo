export default function AdminFeedback({ children, type = 'success' }) {
  if (!children) return null;
  const styles = type === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-green-200 bg-green-50 text-green-900';
  return <p role={type === 'error' ? 'alert' : 'status'} className={`mb-5 border px-4 py-3 text-sm ${styles}`}>{children}</p>;
}
