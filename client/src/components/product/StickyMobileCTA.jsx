export default function StickyMobileCTA({ price, onAddToCart, disabled }) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border p-4 flex items-center gap-4 z-30">
      <span aria-hidden className="text-xl">♡</span>
      <span className="text-sm font-medium flex-1">{price ?? 'Price unavailable'}</span>
      <button
        onClick={onAddToCart}
        disabled={disabled}
        className="bg-ink text-background px-6 py-3 text-sm uppercase tracking-wide disabled:opacity-50"
      >
        Add to Cart
      </button>
    </div>
  );
}
