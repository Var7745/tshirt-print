'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  X
} from 'lucide-react';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/enquiries');
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      fetchEnquiries();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              College Enquiries &amp; Institutional Leads
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Module 14
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Capture prospective college batch inquiries, quotation requests, and track lead conversion into active orders.
          </p>
        </div>
      </div>

      {/* Enquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading inquiries...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-zinc-400">
            No inquiries received.
          </div>
        ) : (
          enquiries.map((e) => (
            <div key={e.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{e.customer_name}</h3>
                  <div className="text-xs font-semibold text-orange-600">{e.college_name || 'Individual Inquiry'}</div>
                  <div className="text-[10px] text-zinc-400">{new Date(e.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  e.status === 'converted'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : e.status === 'contacted'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {e.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-xs space-y-1">
                <div className="font-bold text-zinc-800 dark:text-zinc-200">{e.subject}</div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed italic">&ldquo;{e.message}&rdquo;</p>
              </div>

              {/* Actions & WhatsApp Launcher */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <a
                  href={`https://wa.me/${e.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${e.customer_name}, thank you for contacting JK Empress regarding your batch T-shirts!`)}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Reply</span>
                </a>

                <select
                  value={e.status}
                  onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                  className="px-2 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quotation_sent">Quotation Sent</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
