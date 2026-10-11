import { useId, useState } from 'react';
import { resolveMediaUrl } from '../../lib/media';
import { csrfFetch } from '../../lib/api';

const footerDestinations = [
  ['/', 'Homepage'],
  ['/shop', 'All products'],
  ['/new-arrivals', 'New arrivals'],
  ['/best-sellers', 'Best sellers'],
  ['/collections/featured-collection', 'Featured collection'],
  ['/shop-by-video', 'Shop by video'],
  ['/gifting', 'Gifting'],
  ['/store-locator', 'Store locator'],
  ['/contact', 'Contact'],
  ['/refund-policy', 'Refund policy'],
  ['/terms', 'Terms & conditions'],
  ['/privacy', 'Privacy policy'],
  ['/login', 'Login'],
  ['/account', 'Customer account'],
];

const SELECT_LABELS = {
  PERCENTAGE: 'Percentage',
  FLAT: 'Fixed amount',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};

function DestinationSelect({ value, onChange }) {
  const isCustom = value && !footerDestinations.some(([path]) => path === value);
  return <select value={value || '/'} onChange={event => onChange(event.target.value)} className="admin-input mt-1">
    {isCustom && <option value={value}>{value} (current custom destination)</option>}
    {footerDestinations.map(([path, name]) => <option key={path} value={path}>{name} — {path}</option>)}
  </select>;
}

export default function AdminField({ field, value, onChange, products = [] }) {
  const uploadInputId = useId();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [key, label, type, , , min, max] = field;
  if (type === 'navigation') {
    const links = value || [];
    const update = (index, patch) => onChange(links.map((item, i) => i === index ? { ...item, ...patch } : item));
    const move = (index, direction) => { const next = [...links]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
    return <fieldset className="sm:col-span-2"><legend className="text-sm mb-3">{label}</legend><div className="space-y-4">{links.map((item, index) => { const imageInputId = `${uploadInputId}-navigation-${index}`; return <div key={item.key} className="border border-border p-4 grid sm:grid-cols-2 gap-3">
      <label className="text-sm">Label<input value={item.label} onChange={e => update(index, { label: e.target.value })} className="admin-input mt-1" /></label>
      <label className="text-sm">Destination<input value={item.to} onChange={e => update(index, { to: e.target.value })} className="admin-input mt-1" /></label>
      {item.megaMenu && <div className="sm:col-span-2 border border-dashed border-border bg-surface p-4"><p className="mb-3 text-sm font-medium">View all image</p><div className="flex flex-wrap items-center gap-4">{item.viewAllImageUrl ? <img src={resolveMediaUrl(item.viewAllImageUrl)} alt="" className="h-24 w-24 border border-border bg-white object-cover" /> : <div className="flex h-24 w-24 items-center justify-center border border-border bg-white px-2 text-center text-xs text-muted">No image</div>}<div><input id={imageInputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => { const file = event.target.files[0]; if (file) upload(file, url => update(index, { viewAllImageUrl: url })); event.target.value = ''; }} className="sr-only" /><label htmlFor={imageInputId} className={`inline-flex border border-ink bg-white px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>{uploading ? 'Uploading…' : item.viewAllImageUrl ? 'Replace image' : 'Choose image'}</label>{item.viewAllImageUrl && <button type="button" onClick={() => update(index, { viewAllImageUrl: '' })} className="ml-3 text-sm text-red-700 underline">Remove</button>}</div></div>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</div>}
      <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={item.visible} onChange={e => update(index, { visible: e.target.checked })} /> Visible</label><label><input type="checkbox" checked={item.megaMenu} onChange={e => update(index, { megaMenu: e.target.checked })} /> Mega menu</label></div>
      <div className="flex gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30">Move up</button><button type="button" disabled={index === links.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30">Move down</button></div>
    </div>; })}</div></fieldset>;
  }
  if (type === 'link-list') {
    const links = value || [];
    const update = (index, patch) => onChange(links.map((item, i) => i === index ? { ...item, ...patch } : item));
    const move = (index, direction) => { const next = [...links]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
    const add = () => onChange([...links, { key: `footer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: 'New link', to: '/', visible: true }]);
    return <fieldset className="sm:col-span-2"><legend className="text-sm mb-3">{label}</legend><div className="space-y-3">{links.map((item, index) => <div key={item.key} className="border border-border p-4 grid sm:grid-cols-2 gap-3">
      <label className="text-sm">Label<input value={item.label} onChange={e => update(index, { label: e.target.value })} className="admin-input mt-1" /></label>
      <label className="text-sm">Destination<DestinationSelect value={item.to} onChange={to => update(index, { to })} /></label>
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={item.visible} onChange={e => update(index, { visible: e.target.checked })} /> Visible</label>
      <div className="flex flex-wrap justify-start sm:justify-end gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30">Move up</button><button type="button" disabled={index === links.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30">Move down</button><button type="button" onClick={() => { const confirmed = window.confirm(`Remove the “${item.label || 'Untitled'}” footer link?`); if (confirmed) onChange(links.filter((_, i) => i !== index)); }} className="text-red-700 underline">Remove</button></div>
    </div>)}<button type="button" onClick={add} disabled={links.length >= 20} className="border border-ink px-4 py-2 text-sm disabled:opacity-40">Add link</button></div></fieldset>;
  }
  async function upload(file, handleUploaded = onChange) {
    setError(''); setUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await csrfFetch('/api/v1/admin/media', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.error?.message || 'Upload failed.');
      handleUploaded(result.data.url);
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }
  if (type === 'hero-slides') {
    const slides = value || [];
    const update = (index, patch) => onChange(slides.map((slide, i) => i === index ? { ...slide, ...patch } : slide));
    const move = (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= slides.length) return;
      const next = [...slides];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    };
    const add = () => onChange([...slides, { id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: 'image', url: '', altText: '' }]);
    return <fieldset className="sm:col-span-2"><legend className="text-sm mb-3">{label}</legend><div className="space-y-4">{slides.map((slide, index) => {
      const inputId = `${uploadInputId}-${index}`;
      return <div key={slide.id} className="border border-border bg-white p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="font-medium">Slide {index + 1}</p><div className="flex flex-wrap gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30">Move up</button><button type="button" disabled={index === slides.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30">Move down</button><button type="button" disabled={slides.length === 1} onClick={() => onChange(slides.filter((_, i) => i !== index))} className="text-red-700 underline disabled:opacity-30">Remove</button></div></div>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="aspect-video overflow-hidden border border-border bg-surface">{slide.url ? slide.type === 'video' ? <video src={resolveMediaUrl(slide.url)} muted playsInline className="h-full w-full object-cover" /> : <img src={resolveMediaUrl(slide.url)} alt={slide.altText || ''} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">No media selected</div>}</div>
          <div className="space-y-3"><label className="block text-sm">Media type<select value={slide.type} onChange={event => update(index, { type: event.target.value, url: '' })} className="admin-input mt-1"><option value="image">Image</option><option value="video">Video</option></select></label><label className="block text-sm">Alternative text<input value={slide.altText} onChange={event => update(index, { altText: event.target.value })} maxLength={200} className="admin-input mt-1" /></label><input id={inputId} type="file" accept={slide.type === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'} disabled={uploading} onChange={event => { const file = event.target.files[0]; if (file) upload(file, url => update(index, { url })); event.target.value = ''; }} className="sr-only" /><label htmlFor={inputId} className={`inline-flex cursor-pointer border border-ink bg-white px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white ${uploading ? 'pointer-events-none opacity-50' : ''}`}>{uploading ? 'Uploading…' : slide.url ? 'Replace media' : 'Choose media'}</label></div>
        </div>
      </div>;
    })}<button type="button" onClick={add} disabled={slides.length >= 10 || uploading} className="border border-ink px-4 py-2 text-sm disabled:opacity-40">Add slide</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<p className="text-xs text-muted">Add up to 10 JPG, PNG, WebP or MP4 slides. Use Move up/down to control their order.</p></div></fieldset>;
  }
  if (type === 'boolean') return <label className="flex items-center gap-3 border border-border p-3 text-sm"><input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />{label}</label>;
  if (type === 'products') return <fieldset className="sm:col-span-2"><legend className="text-sm mb-2">{label}</legend><div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-border p-3">{products.map(product => <label key={product.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(value || []).includes(product.id)} onChange={e => onChange(e.target.checked ? [...(value || []), product.id] : (value || []).filter(id => id !== product.id))} />{product.title}</label>)}</div></fieldset>;
  const isFooterDestination = field[4] === 'Footer' && type === 'url';
  return <div className={type === 'textarea' ? 'sm:col-span-2' : ''}>
    <label className="block text-sm"><span className="block mb-2">{label}</span>
      {type === 'textarea' ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={5} className="admin-input" /> : isFooterDestination ? <DestinationSelect value={value} onChange={onChange} /> : ['product', 'select'].includes(type) ? <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="admin-input"><option value="">Select…</option>{type === 'product' ? products.map(product => <option key={product.id} value={product.id}>{product.title}</option>) : (min || []).map(option => <option key={option} value={option}>{SELECT_LABELS[option] || option}</option>)}</select> : <input type={type === 'number' ? 'number' : type === 'color' ? 'color' : type === 'datetime' ? 'datetime-local' : 'text'} min={type === 'number' ? min : undefined} max={max} step={key === 'taxPercent' || key.endsWith('Minor') ? '0.01' : type === 'datetime' ? undefined : '1'} value={type === 'datetime' && value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : (value ?? '')} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : type === 'datetime' ? (e.target.value ? new Date(e.target.value).toISOString() : '') : e.target.value)} className={`admin-input ${type === 'color' ? 'h-12' : ''}`} />}
    </label>
    {['image', 'video'].includes(type) && <div className="mt-3 border border-dashed border-border bg-surface p-4">
      {type === 'image' && value && <div className="mb-4 flex items-center gap-4"><img src={resolveMediaUrl(value)} alt={label} className="h-24 w-24 shrink-0 border border-border bg-white object-contain" /><div><p className="text-sm font-medium">Current image</p><p className="mt-1 break-all text-xs text-muted">{value}</p></div></div>}
      {type === 'video' && value && <div className="mb-4"><p className="text-sm font-medium">Current video</p><p className="mt-1 break-all text-xs text-muted">{value}</p></div>}
      <input id={uploadInputId} aria-label={`Upload ${label}`} type="file" accept={type === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'} disabled={uploading} onChange={e => { const file = e.target.files[0]; if (file) upload(file); e.target.value = ''; }} className="sr-only" />
      <label htmlFor={uploadInputId} className={`inline-flex border border-ink bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-white ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>{uploading ? 'Uploading…' : value ? `Replace ${type}` : `Choose ${type}`}</label>
      <p className="mt-2 text-xs text-muted">{type === 'video' ? 'MP4 files only.' : 'JPG, PNG or WebP files.'}</p>
      {uploading && <p role="status" className="mt-2 text-xs">Uploading your file. Please keep this page open.</p>}
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>}
  </div>;
}
