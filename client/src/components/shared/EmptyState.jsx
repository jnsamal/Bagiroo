export default function EmptyState({ message = 'Nothing to show yet.' }) {
  return <div className="border border-border bg-surface px-6 py-16 text-center"><p className="text-lg font-medium">Nothing here yet</p><p className="mt-2 text-sm text-muted">{message}</p></div>;
}
