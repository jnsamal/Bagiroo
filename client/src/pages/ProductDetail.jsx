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
import { useWebsite } from '../lib/useWebsite';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import ProductReviews from '../components/product/ProductReviews';

// Layout follows the Miraggio reference the client chose (gallery + price
// block + swatches + accordions + sticky mobile CTA + related products),
// rebuilt entirely with real Bagiroo product data and brand styling -- no
// Miraggio content (EMI/snapmint, pincode checker) carried over unless the
// client asks for it specifically; flagged as an open question in the audit.
export default function ProductDetail() {
  const website = useWebsite();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedColour = searchParams.get('colour');
  const queryClient = useQueryClient();
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [addStatus, setAddStatus] = useState('idle');

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });

  useEffect(() => {
    setSelectedVariation((current) => product?.variations?.find((v) => v.id === requestedColour) || product?.variations?.find((v) => v.id === current?.id) || product?.variations?.find((v) => v.isDefault) || product?.variations?.[0] || null);
  }, [product, requestedColour]);

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
  const variation = product.variations?.find((v) => v.id === selectedVariation?.id) || product.variations?.find((v) => v.isDefault) || product.variations?.[0];
  const colourImages = variation ? (product.media || []).filter((image) => image.variationId === variation.id) : (product.media || []);
  const defaultImage = colourImages.find(image => image.url === variation?.imageUrl);
  const galleryImages = defaultImage ? [defaultImage, ...colourImages.filter(image => image.id !== defaultImage.id)] : colourImages;

  async function handleAddToCart() {
    setAddStatus('loading');
    try {
      const data = await api.post('/cart/items', { productId: product.id, variationId: selectedVariation?.id, quantity: 1 });
      queryClient.setQueryData(['cart'], data);
      setAddStatus('added');
    } catch (err) {
      setAddStatus('idle');
      // eslint-disable-next-line no-alert
      alert(err.message);
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <p className="text-sm text-muted mb-6">
        <Link to="/">Home</Link> / {product.title}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <ProductGallery key={`${product.id}-${variation?.id || 'simple'}-${galleryImages[0]?.id || 'empty'}`} images={galleryImages} title={`${product.title}${variation?.colorName ? ` — ${variation.colorName}` : ''}`} />

        <div className="md:sticky md:top-6 self-start space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{product.title}</h1>
            <div className="mt-2 flex items-baseline gap-3">
              {price ? (
                <span className="text-lg">{price}</span>
              ) : (
                <span className="text-lg text-muted">Price unavailable</span>
              )}
              {compareAt && <span className="text-muted line-through text-sm">{compareAt}</span>}
              {discountPct && <span className="text-sm text-red-700">{discountPct}% OFF</span>}
            </div>
            <p className="text-xs text-muted mt-1">{website.taxIncluded !== false ? 'Inclusive of all taxes' : 'Taxes calculated at checkout'}</p>
            {product.shortDescription && <p className="text-sm text-muted mt-3">{product.shortDescription}</p>}
          </div>

          {product.variations?.length > 0 && (
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
            <button
              onClick={handleAddToCart}
              disabled={!price || addStatus === 'loading'}
              className="w-full bg-ink text-background py-4 uppercase text-sm tracking-wide disabled:opacity-50"
            >
              {!price ? 'Read More' : addStatus === 'added' ? 'Added ✓' : addStatus === 'loading' ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>

          <div>
            <AccordionSection title="Why You'll Love It?" defaultOpen>
              {product.description || "Content pending -- to be supplied by the client."}
            </AccordionSection>
            <AccordionSection title="Details &amp; Dimensions">
              {product.material && <p>Material: {product.material}</p>}
              {product.dimensions && <p>Dimensions: {product.dimensions}</p>}
              {product.weightGrams && <p>Weight: {product.weightGrams}g</p>}
              {!product.material && !product.dimensions && !product.weightGrams && (
                <p>Details pending -- to be supplied by the client.</p>
              )}
            </AccordionSection>
            <AccordionSection title="Shipping &amp; Returns">
              <div className="whitespace-pre-wrap">{website.shippingContent || 'Shipping and returns information will be available soon.'}</div>
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

      <StickyMobileCTA price={price} onAddToCart={handleAddToCart} disabled={!price} />
    </div>
  );
}
