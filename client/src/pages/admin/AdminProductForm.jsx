import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminProductMedia from '../../components/admin/AdminProductMedia';
import AdminProductVariations from '../../components/admin/AdminProductVariations';
import AdminColourDefaultImages from '../../components/admin/AdminColourDefaultImages';

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
  categoryIds: [],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
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
      setForm({
        title: existing.title,
        slug: existing.slug,
        sku: existing.sku,
        priceMinor: existing.priceMinor ?? '',
        compareAtMinor: existing.compareAtMinor ?? '',
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
        categoryIds: existing.categories?.map((c) => c.categoryId) || [],
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (body) => (isEdit ? api.patch(`/admin/products/${id}`, body) : api.post('/admin/products', body)),
    onSuccess: () => {
      ['admin-products', 'admin-product', 'products', 'product', 'homepage', 'navigation', 'recommended-products', 'recently-viewed-products'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      navigate('/admin/products');
    },
    onError: (err) => setError(err.message),
  });

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
    const { featuresText, ...fields } = form;
    mutation.mutate({
      ...fields,
      features: featuresText.split('\n').map(value => value.trim()).filter(Boolean),
      compareAtMinor: form.compareAtMinor === '' ? null : Number(form.compareAtMinor),
      priceMinor: form.priceMinor === '' ? null : Number(form.priceMinor),
      weightGrams: form.weightGrams === '' ? undefined : Number(form.weightGrams),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">{isEdit ? 'Edit product' : 'New product'}</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input required value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Product ID</label>
          <input required value={form.sku} onChange={(e) => updateField('sku', e.target.value)} className="w-full border border-gray-300 px-3 py-2" aria-describedby="product-id-help" />
          <p id="product-id-help" className="text-xs text-muted mt-1">Enter a unique catalogue identifier for this product.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Price (minor units, e.g. 499900 = ₹4,999.00) — leave blank if unpriced</label>
          <input type="number" value={form.priceMinor} onChange={(e) => updateField('priceMinor', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Short description (tagline)</label>
          <input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>
        <label className="block text-sm">Regular / compare-at price (paise)<input type="number" min="0" value={form.compareAtMinor} onChange={e => updateField('compareAtMinor', e.target.value)} className="admin-input mt-2" /></label>
        <label className="block text-sm">Display order<input type="number" value={form.sortOrder} onChange={e => updateField('sortOrder', Number(e.target.value))} className="admin-input mt-2" /></label>
        <label className="block text-sm">Features (one per line)<textarea rows={4} value={form.featuresText} onChange={e => updateField('featuresText', e.target.value)} className="admin-input mt-2" /></label>
        <fieldset><legend className="text-sm mb-2">Collections</legend><div className="flex flex-wrap gap-3">{collections?.map(collection => <label key={collection.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.collectionIds.includes(collection.id)} onChange={e => updateField('collectionIds', e.target.checked ? [...form.collectionIds, collection.id] : form.collectionIds.filter(value => value !== collection.id))} />{collection.name}</label>)}</div></fieldset>
        <div>
          <label className="block text-sm mb-1">Full description</label>
          <textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full border border-gray-300 px-3 py-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Material" value={form.material} onChange={(e) => updateField('material', e.target.value)} className="border border-gray-300 px-3 py-2" />
          <input placeholder="Dimensions" value={form.dimensions} onChange={(e) => updateField('dimensions', e.target.value)} className="border border-gray-300 px-3 py-2" />
          <input placeholder="Weight (g)" type="number" value={form.weightGrams} onChange={(e) => updateField('weightGrams', e.target.value)} className="border border-gray-300 px-3 py-2" />
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

        <fieldset className="border border-border p-4">
          <legend className="px-2 text-sm font-medium">Storefront visibility</legend>
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

        <button type="submit" disabled={mutation.isPending} className="bg-gray-900 text-white px-6 py-3 text-sm">
          {mutation.isPending ? 'Saving…' : 'Save product'}
        </button>
      </form>

      {isEdit && existing ? (
        <div className="max-w-2xl mt-12 space-y-12 border-t border-gray-200 pt-10">
          <AdminProductMedia productId={existing.id} media={existing.media || []} variations={existing.variations || []} />
          <AdminColourDefaultImages productId={existing.id} media={existing.media || []} variations={existing.variations || []} />
          <AdminProductVariations productId={existing.id} variations={existing.variations || []} />
        </div>
      ) : (
        !isEdit && (
          <p className="text-sm text-gray-500 mt-10">
            Save this product first, then come back to its edit page to add images and colour
            variations.
          </p>
        )
      )}
    </div>
  );
}
