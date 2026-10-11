export function AdminLoading({ message = 'Loading…' }) {
  return <div role="status" className="border border-border bg-white p-6 text-sm text-muted"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-ink" aria-hidden="true" />{message}</div>;
}

export function AdminError({ message = 'Something went wrong.', onRetry }) {
  return <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p className="font-medium">Could not load this page</p><p className="mt-1">{message}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-4 border border-red-700 bg-white px-4 py-2 text-xs font-medium hover:bg-red-700 hover:text-white">Try again</button>}</div>;
}

export function AdminEmpty({ title, description, action }) {
  return <div className="border border-border bg-white px-6 py-10 text-center"><p className="font-medium">{title}</p>{description && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}
