'use client';

import { useEffect, useState } from 'react';

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  total: number;         // cents
  currency: string;      // 'usd'
  created: number;       // ms
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export default function InvoiceTable() {
  const [items, setItems] = useState<Invoice[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/billing/invoices`, {
          credentials: 'include',
        });
        const data = await res.json();
        setItems(data?.items ?? []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return <p className="text-sm text-gray-500">Loading invoices…</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-gray-500">No invoices yet.</p>;
  }

  const fmtMoney = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);

  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString();

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Invoice</th>
            <th className="px-4 py-2 text-left font-medium">Date</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Total</th>
            <th className="px-4 py-2 text-left font-medium">Links</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(inv => (
            <tr key={inv.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{inv.number ?? inv.id.slice(0, 10)}</td>
              <td className="px-4 py-2">{fmtDate(inv.created)}</td>
              <td className="px-4 py-2 capitalize">{inv.status ?? '—'}</td>
              <td className="px-4 py-2">{fmtMoney(inv.total, inv.currency)}</td>
              <td className="px-4 py-2 space-x-3">
                {inv.hosted_invoice_url && (
                  <a className="text-blue-600 hover:underline" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
                {inv.invoice_pdf && (
                  <a className="text-blue-600 hover:underline" href={inv.invoice_pdf} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
