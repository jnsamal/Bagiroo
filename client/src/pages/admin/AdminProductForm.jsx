import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminProductMedia from '../../components/admin/AdminProductMedia';
import AdminProductVariations from '../../components/admin/AdminProductVariations';
import { majorInputToMinor, minorToMajorInput } from '../../lib/money';

const emptyForm = {
  title: '',
  slug: '',
  sku: '',
  priceMinor: '',
  compareAtMinor: '',
  featuresText: '',
  sortOrder: 0,
  collectionIds: [],
  shortDescription: '',
  description: '',
  material: '',
  dimensions: '',
  weightGrams: '',
  isPublished: true,
  isBestSeller: false,
  isNewArrival: false,
  hasColorVariations: false,
  categoryIds: [],
};

export default function AdminProductForm({ productId, embedded = false, onSaved, onDelete, deleting = false }) {
  const { id: routeId } = useParams();
  const id = productId || routeId;
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories') });
  const { data: collections } = useQuery({ queryKey: ['admin-collections'], queryFn: () => api.get('/admin/collections') });
  const { data: existing } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/admin/products/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      const nextForm = {
        title: existing.title,
        slug: existing.slug,
        sku: existing.sku,
        priceMinor: minorToMajorInput(existing.priceMinor),
        compareAtMinor: minorToMajorInput(existing.compareAtMinor),
        featuresText: Array.isArray(existing.features) ? existing.features.join('\n') : '',
        sortOrder: existing.sortOrder,
        collectionIds: existing.collections?.map(item => item.collectionId) || [],
        shortDescription: existing.shortDescription || '',
        description: existing.description || '',
        material: existing.material || '',
        dimensions: existing.dimensions || '',
        weightGrams: existing.weightGrams ?? '',
        isPublished: existing.isPublished,
        isBestSeller: existing.isBestSeller,
        isNewArrival: existing.isNewArrival,
        hasColorVariations: existing.hasColorVariations ?? ((existing.variations?.length || 0) > 0),
        categoryIds: existing.categories?.map((c) => c.categoryId) || [],
      };
      setForm(nextForm);
      setInitialForm(nextForm);
    }
  }, [existing]);

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const mutation = useMutation({
    mutationFn: (body) => (isEdit ? api.patch(`/admin/products/${id}`, body) : api.post('/admin/products', body)),
    onSuccess: (savedProduct) => {
      setInitialForm(form);
      ['admin-products', 'admin-product', 'products', 'product', 'homepage', 'navigation', 'recommended-products', 'recently-viewed-products'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      if (embedded) onSaved?.(savedProduct);
      else navigate('/admin/products');
    },
    onError: (err) => setError(err.message),
  });

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function generateSlug() {
    const slug = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    updateField('slug', slug);
  }

  function toggleCategory(categoryId) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(categoryId)
        ? f.categoryIds.filter((c) => c !== categoryId)
        : [...f.categoryIds, categoryId],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const priceMinor = majorInputToMinor(form.priceMinor);
    const compareAtMinor = majorInputToMinor(form.compareAtMinor);
    if (Number.isNaN(priceMinor) || Number.isNaN(compareAtMinor)) {
      setError('Enter a valid price in rupees.');
      return;
    }
    if (priceMinor !== null && compareAtMinor !== null && compareAtMinor <= priceMinor) {
      setError('Original price must be greater than the selling price.');
      return;
    }
    const { featuresText, ...fields } = form;
    mutation.mutate({
      ...fields,
      features: featuresText.split('\n').map(value => value.trim()).filter(Boolean),
      compareAtMinor,
      priceMinor,
      weightGrams: form.weightGrams === '' ? undefined : Number(form.weightGrams),
    });
  }

  return (
    <div className={embedded ? 'admin-panel' : ''}>
      <div className={`${embedded ? 'sticky top-[69px] z-10 -mx-5 -mt-5 border-b border-border bg-white/95 px-5 py-4 shadow-[0_8px_18px_rgba(0,0,0,0.05)] backdrop-blur-sm sm:-mx-6 sm:-mt-6 sm:px-6' : 'mb-8'} flex flex-wrap items-center justify-between gap-3`}>
        <div><h1 className="text-2xl font-semibold">{isEdit ? 'Edit product' : 'New product'}</h1>{embedded && existing && <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><span className="text-muted">Product ID: {existing.sku}</span><span role="status" className={`inline-flex items-center gap-1.5 font-medium ${hasUnsavedChanges ? 'text-amber-700' : 'text-green-700'}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-green-600'}`} />{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}</span></div>}</div>
        {embedded && <div className="flex flex-wrap gap-3">{existing && <Link to={`/product/${existing.slug}`} target="_blank" className="border border-border bg-white px-4 py-2 text-sm hover:border-ink">Preview ↗</Link>}{onDelete && <button type="button" disabled={deleting} onClick={onDelete} className="border border-red-700 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">{deleting ? 'Removing…' : 'Remove'}</button>}<button type="submit" form={`product-form-${id}`} disabled={mutation.isPending || !hasUnsavedChanges} className="admin-primary">{mutation.isPending ? 'Saving…' : 'Save changes'}</button></div>}
      </div>
      {embedded && <p className="mb-6 mt-5 text-xs text-muted">These actions remain visible while you edit this product.</p>}
      <form id={`product-form-${id || 'new'}`} onSubmit={handleSubmit} className={`${embedded ? 'max-w-none' : 'max-w-lg'} space-y-6`}>
        <section className="border border-border p-5 sm:p-6" aria-labelledby={`product-identity-${id || 'new'}`}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 1</p><h2 id={`product-identity-${id || 'new'}`} className="mt-1 text-lg font-semibold">Product identity</h2><p className="mt-1 text-xs text-muted">The name and identifiers used across the catalogue.</p></div>
          <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Product name <span className="text-red-700" aria-hidden="true">*</span></label>
          <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3"><label htmlFor={`product-slug-${id || 'new'}`} className="block text-sm">URL handle <span className="text-red-700" aria-hidden="true">*</span></label><button type="button" disabled={!form.title.trim()} onClick={generateSlug} className="text-xs underline underline-offset-4 disabled:opacity-40">Generate from product name</button></div>
          <input id={`product-slug-${id || 'new'}`} required value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full border border-gray-300 px-3 py-2" aria-describedby="product-slug-help" />
          <p id="product-slug-help" className="mt-1 text-xs text-muted">Used in the product page address, for example: /product/{form.slug || 'your-product-name'}.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Product ID <span className="text-red-700" aria-hidden="true">*</span></label>
          <input required value={form.sku} onChange={(e) => updateField('sku', e.target.value)} className="w-full border border-gray-300 px-3 py-2" aria-describedby="product-id-help" />
          <p id="product-id-help" className="text-xs text-muted mt-1">Enter a unique catalogue identifier for this product.</p>
        </div>
          </div>
        </section>
        <section className="border border-border p-5 sm:p-6" aria-labelledby={`product-pricing-${id || 'new'}`}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 2</p><h2 id={`product-pricing-${id || 'new'}`} className="mt-1 text-lg font-semibold">Pricing and summary</h2><p className="mt-1 text-xs text-muted">Set the customer-facing price and the short description shown in listings.</p></div>
          <div className="space-y-4">
        <label className="block text-sm">
          Selling price
          <div className="mt-2 flex border border-gray-300 bg-white focus-within:border-ink">
            <span className="flex items-center border-r border-gray-300 px-3 text-muted">₹</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={form.priceMinor} onChange={(e) => updateField('priceMinor', e.target.value)} className="min-w-0 flex-1 px-3 py-2 outline-none" aria-describedby="selling-price-help" />
          </div>
          <span id="selling-price-help" className="mt-1 block text-xs text-muted">Enter the amount customers will pay.</span>
        </label>
        <div>
          <label className="block text-sm mb-1">Short description (tagline)</label>
          <input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <label className="block text-sm">
          Original price (optional)
          <div className="mt-2 flex border border-gray-300 bg-white focus-within:border-ink">
            <span className="flex items-center border-r border-gray-300 px-3 text-muted">₹</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={form.compareAtMinor} onChange={e => updateField('compareAtMinor', e.target.value)} className="min-w-0 flex-1 px-3 py-2 outline-none" aria-describedby="original-price-help" />
          </div>
          <span id="original-price-help" className="mt-1 block text-xs text-muted">Shown crossed out when higher than the selling price.</span>
        </label>
          </div>
        </section>
        <section className="border border-border p-5 sm:p-6" aria-labelledby={`product-images-${id || 'new'}`}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 3</p><h2 id={`product-images-${id || 'new'}`} className="mt-1 text-lg font-semibold">Image setup</h2><p className="mt-1 text-xs text-muted">Choose whether this product has separate colours or one standard gallery.</p></div>
        <fieldset>
          <legend className="px-2 text-sm font-medium">Product image type</legend>
          <p className="mb-4 text-xs text-muted">Choose how images and buying options are managed for this product.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer border p-4 transition-colors ${form.hasColorVariations ? 'border-ink bg-ink text-background' : 'border-border bg-white hover:border-ink'}`}><input type="radio" name={`variation-mode-${id || 'new'}`} checked={form.hasColorVariations} onChange={() => updateField('hasColorVariations', true)} className="sr-only" /><span className="block font-medium">Color variation</span><span className={`mt-1 block text-xs ${form.hasColorVariations ? 'text-white/70' : 'text-muted'}`}>Manage colours and a default image for each colour.</span></label>
            <label className={`cursor-pointer border p-4 transition-colors ${!form.hasColorVariations ? 'border-ink bg-ink text-background' : 'border-border bg-white hover:border-ink'}`}><input type="radio" name={`variation-mode-${id || 'new'}`} checked={!form.hasColorVariations} onChange={() => updateField('hasColorVariations', false)} className="sr-only" /><span className="block font-medium">Non-color variation</span><span className={`mt-1 block text-xs ${!form.hasColorVariations ? 'text-white/70' : 'text-muted'}`}>Manage one standard product image gallery.</span></label>
          </div>
        </fieldset>
        </section>
        <section className="border border-border p-5 sm:p-6" aria-labelledby={`product-details-${id || 'new'}`}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 4</p><h2 id={`product-details-${id || 'new'}`} className="mt-1 text-lg font-semibold">Description and organization</h2><p className="mt-1 text-xs text-muted">Add product details and choose where the product appears in the store.</p></div>
          <div className="space-y-4">
        <label className="block text-sm">Display order<input type="number" value={form.sortOrder} onChange={e => updateField('sortOrder', Number(e.target.value))} className="admin-input mt-2" /><span className="mt-1 block text-xs text-muted">Lower numbers appear before higher numbers.</span></label>
        <label className="block text-sm">Features<textarea rows={4} value={form.featuresText} onChange={e => updateField('featuresText', e.target.value)} className="admin-input mt-2" /><span className="mt-1 block text-xs text-muted">Enter one customer-facing feature per line.</span></label>
        <fieldset><legend className="text-sm mb-2">Collections</legend><div className="flex flex-wrap gap-3">{collections?.map(collection => <label key={collection.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.collectionIds.includes(collection.id)} onChange={e => updateField('collectionIds', e.target.checked ? [...form.collectionIds, collection.id] : form.collectionIds.filter(value => value !== collection.id))} />{collection.name}</label>)}</div></fieldset>
        <div>
          <label className="block text-sm mb-1">Full description</label>
          <textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Material<input placeholder="e.g. Canvas" value={form.material} onChange={(e) => updateField('material', e.target.value)} className="mt-2 w-full border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm">Dimensions<input placeholder="e.g. 30 × 24 × 12 cm" value={form.dimensions} onChange={(e) => updateField('dimensions', e.target.value)} className="mt-2 w-full border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm">Weight in grams<input placeholder="e.g. 650" min="0" type="number" value={form.weightGrams} onChange={(e) => updateField('weightGrams', e.target.value)} className="mt-2 w-full border border-gray-300 px-3 py-2" /></label>
        </div>

        <div>
          <p className="text-sm mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories?.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`px-3 py-1 text-sm border ${form.categoryIds.includes(c.id) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
          </div>
        </section>

        <fieldset className="border border-border p-4">
          <legend className="px-2 text-sm font-medium">Step 5 · Storefront visibility</legend>
          <p className="text-xs text-muted mb-3">Published products appear in the shop and in any selected homepage sections.</p>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => updateField('isPublished', e.target.checked)} />
            Published
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => updateField('isBestSeller', e.target.checked)} />
            Best Seller
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isNewArrival} onChange={(e) => updateField('isNewArrival', e.target.checked)} />
            New Arrival
          </label>
        </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!embedded && <button type="submit" disabled={mutation.isPending || !hasUnsavedChanges} className="bg-gray-900 text-white px-6 py-3 text-sm disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Save product'}
        </button>}
      </form>

      {isEdit && existing ? (
        <div className={`${embedded ? 'max-w-none' : 'max-w-2xl'} mt-12 space-y-12 border-t border-gray-200 pt-10`}>
          {form.hasColorVariations ? <AdminProductVariations productId={existing.id} variations={existing.variations || []} media={existing.media || []} /> : <AdminProductMedia productId={existing.id} media={existing.media || []} />}
        </div>
      ) : (
        !isEdit && (
          <p className="text-sm text-gray-500 mt-10">
            Save this product first, then add its {form.hasColorVariations ? 'colour variations and images' : 'image gallery'}.
          </p>
        )
      )}
    </div>
  );
}
