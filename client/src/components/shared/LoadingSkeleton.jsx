export default function LoadingSkeleton({ className = 'h-64' }) {
  return <div className={`bg-surface animate-pulse ${className}`} />;
}
