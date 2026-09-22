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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Bulk product import</h1>
      <p className="text-sm text-gray-500 mb-6">
        CSV columns: <code>title,slug,sku,priceMinor,categorySlug,isPublished</code>. The <code>sku</code> column is the Product ID. Up to 200 rows.
        Existing Product IDs are updated; new Product IDs are created.
      </p>

      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="mb-4 block" />

      <div className="flex gap-3">
        <button onClick={() => submit(true)} disabled={!file || isSubmitting} className="border border-gray-300 px-4 py-2 text-sm">
          Preview (dry run)
        </button>
        <button onClick={() => submit(false)} disabled={!file || isSubmitting} className="bg-gray-900 text-white px-4 py-2 text-sm">
          Import
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 text-sm">
          <p>{result.dryRun ? 'Preview' : 'Import'} result: {result.total} rows — {result.created} to create, {result.updated} to update.</p>
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
