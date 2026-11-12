'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  X,
  Sparkles,
  Award,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number;
  start_date?: string;
  expiry_date?: string;
  usage_limit: number;
  used_count: number;
  is_active: number;
  created_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(5000);
  const [maxDiscount, setMaxDiscount] = useState<number>(1000);
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success && data.data) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_amount: minOrder,
          max_discount: maxDiscount,
          expiry_date: expiryDate || null,
          usage_limit: usageLimit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setCode('');
        fetchCoupons();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = coupons.filter(c => c.is_active === 1).length;
  const totalUsed = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">
                Discount Coupons & Promo Codes
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Manage promotional discount codes for college campus ambassadors and organizers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Promo Code
          </button>

          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Active Coupons</span>
          <div className="text-2xl font-black font-heading text-emerald-600 flex items-center justify-between">
            <span>{activeCount} Active</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">Available at checkout</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Redemptions</span>
          <div className="text-2xl font-black font-heading text-zinc-900 flex items-center justify-between">
            <span>{totalUsed} Orders</span>
            <Award className="w-6 h-6 text-orange-600 opacity-80" />
          </div>
          <span className="text-xs text-orange-600 font-semibold">Campus coordinator discounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Promo Campaigns</span>
          <div className="text-2xl font-black font-heading text-zinc-900 flex items-center justify-between">
            <span>{coupons.length} Codes</span>
            <Tag className="w-6 h-6 text-indigo-600 opacity-80" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">Lifetime promo codes created</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
              <tr>
                <th className="p-3.5">Promo Code</th>
                <th className="p-3.5">Discount</th>
                <th className="p-3.5 text-center">Min Order / Cap</th>
                <th className="p-3.5 text-center">Usage</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    No promo codes found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(c => {
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-orange-50 text-[#D9531E] border border-orange-200">
                          {c.code}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                        </div>
                        <span className="text-[10px] text-zinc-400 capitalize">{c.discount_type} discount</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <div className="text-zinc-800 font-bold">Min: ₹{c.min_order_amount}</div>
                        {c.max_discount > 0 && <div className="text-[10px] text-zinc-400">Cap: ₹{c.max_discount}</div>}
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="font-bold text-zinc-900">{c.used_count}</span>
                        <span className="text-zinc-400 text-[10px]"> / {c.usage_limit}</span>
                      </td>

                      <td className="p-3.5 text-zinc-600">
                        {c.expiry_date ? c.expiry_date : 'Never (Ongoing)'}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggle(c.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            c.is_active === 1
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {c.is_active === 1 ? 'Active' : 'Paused'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-black font-heading text-lg text-zinc-900">Create Promo Code</h3>
                <p className="text-xs text-zinc-500 font-medium">New promotional discount code</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CAMPUS2027, BATCH50"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 font-mono text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={e => setMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={e => setMaxDiscount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={e => setUsageLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
