export default function EmptyState({ message = 'Nothing to show yet.' }) {
  return <p className="text-muted text-sm py-12 text-center">{message}</p>;
}
