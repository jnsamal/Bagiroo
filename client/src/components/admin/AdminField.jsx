import { useState } from 'react';
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

function DestinationSelect({ value, onChange }) {
  const isCustom = value && !footerDestinations.some(([path]) => path === value);
  return <select value={value || '/'} onChange={event => onChange(event.target.value)} className="admin-input mt-1">
    {isCustom && <option value={value}>{value} (current custom destination)</option>}
    {footerDestinations.map(([path, name]) => <option key={path} value={path}>{name} — {path}</option>)}
  </select>;
}

export default function AdminField({ field, value, onChange, products = [] }) {
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [key, label, type, , , min, max] = field;
  if (type === 'navigation') {
    const links = value || [];
    const update = (index, patch) => onChange(links.map((item, i) => i === index ? { ...item, ...patch } : item));
    const move = (index, direction) => { const next = [...links]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
    return <fieldset className="sm:col-span-2"><legend className="text-sm mb-3">{label}</legend><div className="space-y-4">{links.map((item, index) => <div key={item.key} className="border border-border p-4 grid sm:grid-cols-2 gap-3">
      <label className="text-sm">Label<input value={item.label} onChange={e => update(index, { label: e.target.value })} className="admin-input mt-1" /></label>
      <label className="text-sm">Destination<input value={item.to} onChange={e => update(index, { to: e.target.value })} className="admin-input mt-1" /></label>
      <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={item.visible} onChange={e => update(index, { visible: e.target.checked })} /> Visible</label><label><input type="checkbox" checked={item.megaMenu} onChange={e => update(index, { megaMenu: e.target.checked })} /> Mega menu</label></div>
      <div className="flex gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30">Move up</button><button type="button" disabled={index === links.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30">Move down</button></div>
    </div>)}</div></fieldset>;
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
      <div className="flex flex-wrap justify-start sm:justify-end gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30">Move up</button><button type="button" disabled={index === links.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30">Move down</button><button type="button" onClick={() => onChange(links.filter((_, i) => i !== index))} className="text-red-700 underline">Remove</button></div>
    </div>)}<button type="button" onClick={add} disabled={links.length >= 20} className="border border-ink px-4 py-2 text-sm disabled:opacity-40">Add link</button></div></fieldset>;
  }
  async function upload(file) {
    setError(''); setUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await csrfFetch('/api/v1/admin/media', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.error?.message || 'Upload failed.');
      onChange(result.data.url);
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }
  if (type === 'boolean') return <label className="flex items-center gap-3 border border-border p-3 text-sm"><input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />{label}</label>;
  if (type === 'products') return <fieldset className="sm:col-span-2"><legend className="text-sm mb-2">{label}</legend><div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-border p-3">{products.map(product => <label key={product.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(value || []).includes(product.id)} onChange={e => onChange(e.target.checked ? [...(value || []), product.id] : (value || []).filter(id => id !== product.id))} />{product.title}</label>)}</div></fieldset>;
  const isFooterDestination = field[4] === 'Footer' && type === 'url';
  return <div className={type === 'textarea' ? 'sm:col-span-2' : ''}>
    <label className="block text-sm"><span className="block mb-2">{label}</span>
      {type === 'textarea' ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={5} className="admin-input" /> : isFooterDestination ? <DestinationSelect value={value} onChange={onChange} /> : ['product', 'select'].includes(type) ? <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="admin-input"><option value="">Select…</option>{type === 'product' ? products.map(product => <option key={product.id} value={product.id}>{product.title}</option>) : (min || []).map(option => <option key={option} value={option}>{option}</option>)}</select> : <input type={type === 'number' ? 'number' : type === 'color' ? 'color' : type === 'datetime' ? 'datetime-local' : 'text'} min={type === 'number' ? min : undefined} max={max} step={key === 'taxPercent' ? '0.01' : type === 'datetime' ? undefined : '1'} value={type === 'datetime' && value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : (value ?? '')} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : type === 'datetime' ? (e.target.value ? new Date(e.target.value).toISOString() : '') : e.target.value)} className={`admin-input ${type === 'color' ? 'h-12' : ''}`} />}
    </label>
    {['image', 'video'].includes(type) && <div className="mt-2">
      {type === 'image' && value && <img src={resolveMediaUrl(value)} alt={label} className="h-20 max-w-full object-contain border border-border mb-2" />}
      <input aria-label={`Upload ${label}`} type="file" accept={type === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'} disabled={uploading} onChange={e => { const file = e.target.files[0]; if (file) upload(file); e.target.value = ''; }} className="text-xs max-w-full" />
      {uploading && <p role="status" className="text-xs mt-1">Uploading…</p>}
      {error && <p role="alert" className="text-xs text-red-700 mt-1">{error}</p>}
    </div>}
  </div>;
}
