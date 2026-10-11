export default function StickyMobileCTA({ price, onAddToCart, disabled, quantity = 1, onQuantityChange }) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border p-4 flex items-center gap-4 z-30">
      <span className="text-sm font-medium flex-1">{price ?? 'Price unavailable'}</span>
      <div className="flex border border-border"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))} className="h-10 w-9 disabled:opacity-40">−</button><span className="flex h-10 min-w-9 items-center justify-center border-x border-border text-sm">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => onQuantityChange?.(quantity + 1)} className="h-10 w-9">+</button></div>
      <button
        onClick={onAddToCart}
        disabled={disabled}
        className="store-button border border-ink bg-ink text-background !px-4 disabled:opacity-50"
      >
        Add to Cart
      </button>
    </div>
  );
}
