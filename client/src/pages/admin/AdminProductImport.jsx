import { useState } from 'react';
import { csrfFetch } from '../../lib/api';

export default function AdminProductImport() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(dryRun) {
    if (!file) return;
    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await csrfFetch(`/api/v1/admin/products/bulk-import?dryRun=${dryRun}`, {
        method: 'POST',
        body: formData,
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error?.message || 'Import failed.');
      setResult(body.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadTemplate() {
    const csv = 'title,slug,sku,price,categorySlug,isPublished\nExample Tote,example-tote,EXAMPLE-001,3999,tote-bags,false\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bagiroo-product-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const previewPassed = result?.dryRun && result.errors.length === 0;

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Products</p><h1 className="admin-page-title mb-4">Bulk product import</h1>
      <p className="text-sm text-gray-500 mb-6">Import up to 200 products at once. Existing Product IDs are updated and new Product IDs are created.</p>

      <div className="space-y-4">
        <section className="admin-panel"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 1</p><h2 className="mt-1 font-semibold">Download and complete the template</h2><p className="mt-2 text-sm text-muted">Prices are entered in rupees. Keep the column names unchanged.</p><button type="button" onClick={downloadTemplate} className="mt-4 border border-ink bg-white px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white">Download CSV template</button></section>
        <section className="admin-panel"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 2</p><h2 className="mt-1 font-semibold">Choose your completed CSV file</h2><label className="mt-4 inline-flex cursor-pointer border border-ink bg-white px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files[0] || null); setResult(null); setError(''); }} className="sr-only" /></label>{file && <p className="mt-3 text-sm"><span className="text-muted">Selected:</span> {file.name}</p>}</section>
        <section className="admin-panel"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Step 3</p><h2 className="mt-1 font-semibold">Preview, then import</h2><p className="mt-2 text-sm text-muted">Preview checks every row without changing the catalogue. Import becomes available after a successful preview.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => submit(true)} disabled={!file || isSubmitting} className="border border-border bg-white px-4 py-2 text-sm disabled:opacity-50">{isSubmitting ? 'Checking…' : 'Preview import'}</button><button type="button" onClick={() => submit(false)} disabled={!file || !previewPassed || isSubmitting} className="admin-primary disabled:opacity-50">Import products</button></div></section>
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 text-sm">
          <p role="status" className={`border p-4 ${result.errors.length ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-900'}`}>{result.dryRun ? 'Preview' : 'Import'} complete: {result.total} rows — {result.created} {result.dryRun ? 'to create' : 'created'}, {result.updated} {result.dryRun ? 'to update' : 'updated'}.{result.dryRun && !result.errors.length ? ' The file is ready to import.' : ''}</p>
          {result.errors.length > 0 && (
            <div className="mt-3 border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-700 mb-2">{result.errors.length} row(s) with errors:</p>
              <ul className="space-y-1 text-red-700">
                {result.errors.map((e, i) => (
                  <li key={i}>Line {e.line} (Product ID {e.sku}): {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
