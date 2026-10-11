import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import ProductGallery from '../components/product/ProductGallery';
import ColourSelector from '../components/product/ColourSelector';
import AccordionSection from '../components/product/AccordionSection';
import StickyMobileCTA from '../components/product/StickyMobileCTA';
import RelatedProducts from '../components/product/RelatedProducts';
import RecentlyViewedProducts from '../components/product/RecentlyViewedProducts';
import { usePublicSettings } from '../lib/useWebsite';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import ProductReviews from '../components/product/ProductReviews';

// Layout follows the Miraggio reference the client chose (gallery + price
// block + swatches + accordions + sticky mobile CTA + related products),
// rebuilt entirely with real Bagiroo product data and brand styling -- no
// Miraggio content (EMI/snapmint, pincode checker) carried over unless the
// client asks for it specifically; flagged as an open question in the audit.
export default function ProductDetail() {
  const settings = usePublicSettings();
  const website = settings?.website || {};
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedColour = searchParams.get('colour');
  const queryClient = useQueryClient();
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [addStatus, setAddStatus] = useState('idle');
  const [addError, setAddError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });
  const usesColorVariations = Boolean(product?.hasColorVariations && product?.variations?.length);

  useEffect(() => {
    setSelectedVariation((current) => usesColorVariations ? product?.variations?.find((v) => v.id === requestedColour) || product?.variations?.find((v) => v.id === current?.id) || product?.variations?.find((v) => v.isDefault) || product?.variations?.[0] || null : null);
  }, [product, requestedColour, usesColorVariations]);

  if (isLoading) return <LoadingSkeleton className="h-[60vh] m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  const priceMinor = selectedVariation?.priceMinor ?? product.priceMinor;
  const compareAtMinor = selectedVariation?.compareAtMinor ?? product.compareAtMinor;
  const price = formatPrice(priceMinor);
  const compareAt = formatPrice(compareAtMinor);
  const discountPct =
    priceMinor && compareAtMinor && compareAtMinor > priceMinor
      ? Math.round(100 - (priceMinor / compareAtMinor) * 100)
      : null;

  const categorySlug = product.categories?.[0]?.category?.slug;
  const variation = usesColorVariations ? product.variations?.find((v) => v.id === selectedVariation?.id) || product.variations?.find((v) => v.isDefault) || product.variations?.[0] : null;
  const colourImages = variation ? (product.media || []).filter((image) => image.variationId === variation.id) : (product.media || []);
  const defaultImage = colourImages.find(image => image.url === variation?.imageUrl);
  const galleryImages = defaultImage ? [defaultImage, ...colourImages.filter(image => image.id !== defaultImage.id)] : colourImages;

  async function handleAddToCart() {
    setAddStatus('loading');
    setAddError('');
    try {
      const data = await api.post('/cart/items', { productId: product.id, variationId: selectedVariation?.id, quantity });
      queryClient.setQueryData(['cart'], data);
      setAddStatus('added');
    } catch (err) {
      setAddStatus('idle');
      setAddError(err.message);
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24 md:pb-16" data-scroll-reveal>
      <p className="text-sm text-muted mb-8">
        <Link to="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span> {categorySlug && <><Link to={`/shop/category/${categorySlug}`} className="hover:text-ink">Collection</Link> <span aria-hidden="true">/</span> </>}{product.title}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <ProductGallery key={`${product.id}-${variation?.id || 'simple'}-${galleryImages[0]?.id || 'empty'}`} images={galleryImages} title={`${product.title}${variation?.colorName ? ` — ${variation.colorName}` : ''}`} />

        <div className="md:sticky md:top-28 self-start space-y-7">
          <div>
            <h1 className="section-title">{product.title}</h1>
            <div className="mt-2 flex items-baseline gap-3">
              {price ? (
                <span className="text-xl font-semibold">{price}</span>
              ) : (
                <span className="text-lg text-muted">Price unavailable</span>
              )}
              {compareAt && <span className="text-muted line-through text-sm">{compareAt}</span>}
              {discountPct && <span className="bg-ink px-2 py-1 text-xs uppercase tracking-wider text-background">{discountPct}% off</span>}
            </div>
            <p className="text-xs text-muted mt-1">{website.taxIncluded !== false ? 'Inclusive of all taxes' : 'Taxes calculated at checkout'}</p>
            {product.shortDescription && <p className="text-sm text-muted mt-3">{product.shortDescription}</p>}
          </div>

          {usesColorVariations && (
            <ColourSelector
              variations={product.variations}
              selected={selectedVariation}
              onSelect={variation => { setSelectedVariation(variation); const next = new URLSearchParams(searchParams); next.set('colour', variation.id); setSearchParams(next, { replace: true }); }}
            />
          )}

          {product.features && Array.isArray(product.features) && product.features.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Key Features</p>
              <ul className="list-disc list-inside text-sm text-muted space-y-1">
                {product.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="hidden md:block">
            <div className="mb-4 flex items-center gap-3"><span className="text-sm font-medium">Quantity</span><div className="inline-flex border border-border"><button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity(value => Math.max(1, value - 1))} className="h-10 w-10 disabled:opacity-40">−</button><span className="flex h-10 min-w-10 items-center justify-center border-x border-border text-sm">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(value => value + 1)} className="h-10 w-10">+</button></div></div>
            <button
              onClick={handleAddToCart}
              disabled={!price || addStatus === 'loading'}
              className="store-button w-full border border-ink bg-ink text-background disabled:opacity-50"
            >
              {!price ? 'Read More' : addStatus === 'added' ? 'Added ✓' : addStatus === 'loading' ? 'Adding…' : 'Add to Cart'}
            </button>
            <div aria-live="polite" className="min-h-6">{addStatus === 'added' && <p className="mt-2 text-sm">Added to your cart.</p>}{addError && <p role="alert" className="mt-2 text-sm text-red-700">{addError}</p>}</div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5 text-center text-xs text-muted"><span>Secure payment</span><span>Shipping details below</span><span>Order support</span></div>
          </div>

          <div>
            {product.description && <AccordionSection title="Why You'll Love It?" defaultOpen>
              {product.description}
            </AccordionSection>}
            {(product.material || product.dimensions || product.weightGrams) && <AccordionSection title="Details &amp; Dimensions">
              {product.material && <p>Material: {product.material}</p>}
              {product.dimensions && <p>Dimensions: {product.dimensions}</p>}
              {product.weightGrams && <p>Weight: {product.weightGrams}g</p>}
            </AccordionSection>}
            <AccordionSection title={settings?.returnsEnabled === false ? 'Shipping' : 'Shipping & Returns'}>
              <div className="whitespace-pre-wrap">{website.shippingContent || (settings?.returnsEnabled === false ? 'Shipping information will be available soon.' : 'Shipping and returns information will be available soon.')}</div>
            </AccordionSection>
            <AccordionSection title="More Information">
              SKU: {selectedVariation?.sku || product.sku}
            </AccordionSection>
          </div>
        </div>
      </div>

      <RelatedProducts categorySlug={categorySlug} excludeSlug={product.slug} />
      <ProductReviews slug={product.slug} reviews={product.reviews} />
      <RecentlyViewedProducts key={product.id} currentSlug={product.slug} />

      <StickyMobileCTA price={price} quantity={quantity} onQuantityChange={setQuantity} onAddToCart={handleAddToCart} disabled={!price || addStatus === 'loading'} />
    </div>
  );
}
