'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Layers,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminLayoutClient';

const ORDER_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'photos_uploading', label: 'Photos Uploading' },
  { id: 'new', label: 'New Orders' },
  { id: 'pending', label: 'Pending Confirmation' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'design_pending', label: 'Design Pending' },
  { id: 'design_approved', label: 'Design Approved' },
  { id: 'printing', label: 'Printing' },
  { id: 'production', label: 'Production' },
  { id: 'quality_check', label: 'Quality Check' },
  { id: 'ready_for_dispatch', label: 'Ready for Delivery' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user } = useAdmin();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });

  // Create Order Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customer_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    college_name: '',
    department: '',
    batch: 'Batch 2026',
    event_name: 'Signature Day 2026',
    event_category: 'Signature Day',
    event_date: '',
    delivery_required_date: '',
    participants_count: 50,
    tshirts_count: 50,
    price_per_tshirt: 150,
    advance_amount: 3750,
    billing_address: '',
    delivery_address: '',
    special_instructions: ''
  });
  const [creating, setCreating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab !== 'all') params.set('status', activeTab);
      if (paymentFilter !== 'all') params.set('payment_status', paymentFilter);
      if (categoryFilter !== 'all') params.set('event_category', categoryFilter);
      params.set('page', page.toString());
      params.set('limit', '15');

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, paymentFilter, categoryFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderForm)
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        fetchOrders();
        router.push(`/admin/orders/${data.data.id}`);
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating order');
    } finally {
      setCreating(false);
    }
  };

  const exportCSV = () => {
    window.open('/api/admin/reports?type=orders&format=csv', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Bulk Order Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
              {pagination.total} Total Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track, filter, and inspect institutional T-shirt orders, student rosters, and production status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bulk Order</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white font-bold shadow-sm shadow-orange-600/20'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, Customer, Phone, College..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 outline-none focus:border-orange-500"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Signature Day">Signature Day</option>
            <option value="College Farewell">College Farewell</option>
            <option value="Batch T-Shirts">Batch T-Shirts</option>
            <option value="College Fest">College Fest</option>
            <option value="Reunion">Reunion</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none"
          >
            <option value="all">All Payments</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="advance_paid">Advance Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No orders found</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">Try clearing search filters or click "Create Bulk Order" to start a new order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">College & Event</th>
                  <th className="py-3 px-4 text-center">Part. vs Tees</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Production</th>
                  <th className="py-3 px-4 text-center">Delivery</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                    className="hover:bg-orange-50/40 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Order ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-black text-orange-600 dark:text-orange-400 group-hover:underline">
                        {o.id}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Customer & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{o.customer_name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{o.phone}</div>
                    </td>

                    {/* College & Event */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{o.college_name}</div>
                      <div className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">{o.event_name} ({o.event_category})</div>
                    </td>

                    {/* Participants vs Tees */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{o.tshirts_count} tees</div>
                      <div className="text-[10px] text-zinc-400">{o.participants_count} students</div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-black text-zinc-900 dark:text-zinc-100">
                        ₹{Number(o.total_amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Adv: ₹{Number(o.advance_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        o.payment_status === 'fully_paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : o.payment_status === 'advance_paid'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {o.payment_status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Production Status */}
                    <td className="py-3.5 px-4 text-center">
                      {o.production_status === 'photos_uploading' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          <span>Photos Uploading</span>
                        </span>
                      ) : (
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {o.production_status?.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>

                    {/* Delivery Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {o.delivery_status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing page {page} of {pagination.pages} ({pagination.total} orders)</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW BULK ORDER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-xl font-bold font-heading">Create New Bulk Order</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Initialize a new institutional apparel batch with sequential ID</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg border text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Customer / Organizer Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customer_name}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customer_name: e.target.value })}
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newOrderForm.phone}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">College / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.college_name}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, college_name: e.target.value })}
                    placeholder="e.g. CBIT Hyderabad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Department / Branch</label>
                  <input
                    type="text"
                    value={newOrderForm.department}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, department: e.target.value })}
                    placeholder="e.g. Computer Science (CSE)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.event_name}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, event_name: e.target.value })}
                    placeholder="e.g. Farewell 2026 / Signature Day"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Event Category</label>
                  <select
                    value={newOrderForm.event_category}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, event_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  >
                    <option value="Signature Day">Signature Day</option>
                    <option value="College Farewell">College Farewell</option>
                    <option value="Batch T-Shirts">Batch T-Shirts</option>
                    <option value="College Fest">College Fest</option>
                    <option value="Reunion">Reunion</option>
                  </select>
                </div>
              </div>

              {/* Quantities & Pricing */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700">
                <div>
                  <label className="block font-bold text-zinc-600 dark:text-zinc-400 mb-1">Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderForm.participants_count}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, participants_count: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-600 dark:text-zinc-400 mb-1">T-Shirts Required</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderForm.tshirts_count}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, tshirts_count: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-600 dark:text-zinc-400 mb-1">Price / Tee (₹)</label>
                  <select
                    value={newOrderForm.price_per_tshirt}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, price_per_tshirt: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                  >
                    <option value={130}>₹130 (Tee + Marker)</option>
                    <option value={150}>₹150 (Tee + Marker + Shades)</option>
                    <option value={200}>₹200 (Frame + Marker + Shades)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-600 dark:text-zinc-400 mb-1">Advance (₹)</label>
                  <input
                    type="number"
                    value={newOrderForm.advance_amount}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, advance_amount: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Delivery Required Date</label>
                <input
                  type="date"
                  value={newOrderForm.delivery_required_date}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, delivery_required_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  value={newOrderForm.delivery_address}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, delivery_address: e.target.value })}
                  placeholder="Campus address, department room number or hostel block..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-2"
                >
                  {creating ? 'Creating Batch...' : 'Generate Order & Open Roster'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
