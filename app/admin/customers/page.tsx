'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setStats(data.stats || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Customer &amp; College Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Module 8
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Student coordinators, college faculty advisors, repeat batch buyers, and institutional accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="font-bold text-zinc-400">Total Billed Volume</div>
            <div className="font-extrabold text-sm text-emerald-600 font-mono">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student coordinator name, phone, college..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading directory...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-zinc-400">
            No customer accounts found.
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{c.name}</h3>
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">{c.college_name}</div>
                  {c.department && <div className="text-[10px] text-zinc-400">{c.department} · {c.batch}</div>}
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-600 font-mono text-sm">
                    ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                  </span>
                  <div className="text-[10px] text-zinc-400">{c.total_orders || 1} batch order(s)</div>
                </div>
              </div>

              {/* Contact info */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <a href={`tel:${c.phone}`} className="font-mono font-bold hover:underline">{c.phone}</a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    className="font-mono font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Launch Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {c.delivery_address && (
                  <div className="pt-1 text-[11px] text-zinc-500 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Quick Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(c.phone)}`}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Customer Orders</span>
                </Link>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
