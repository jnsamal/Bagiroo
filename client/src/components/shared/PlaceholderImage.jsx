// The live site's real product photography hasn't been supplied yet
// (screenshots only) — this renders a clearly-labelled placeholder block
// instead of inventing imagery, per the no-invented-content rule.
export default function PlaceholderImage({ label = 'Image pending', className = '' }) {
  return (
    <div
      className={`bg-surface border border-border flex items-center justify-center text-muted text-xs uppercase tracking-wide ${className}`}
    >
      {label}
    </div>
  );
}
