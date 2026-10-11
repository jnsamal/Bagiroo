import { useState } from 'react';
import { apiUrl } from '../../lib/api';

export default function AdminInvoiceButton({ order, className = '' }) {
  const [state, setState] = useState('idle');

  async function downloadInvoice() {
    setState('loading');
    try {
      const response = await fetch(apiUrl(`/admin/orders/${order.id}/invoice`), { credentials: 'include' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message || 'Invoice download failed.');
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Bagiroo-Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      setState('idle');
    } catch (_error) {
      setState('error');
    }
  }

  return <span className={`inline-flex flex-col items-start ${className}`}>
    <button type="button" onClick={downloadInvoice} disabled={state === 'loading'} className="border border-ink bg-ink px-3 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-ink disabled:cursor-wait disabled:opacity-60">
      {state === 'loading' ? 'Preparing…' : 'Download invoice'}
    </button>
    {state === 'error' && <span role="alert" className="mt-1 text-xs text-red-700">Download failed. Try again.</span>}
  </span>;
}
