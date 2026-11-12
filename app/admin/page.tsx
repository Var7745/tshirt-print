'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Users,
  Palette,
  Factory,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Package,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminLayoutClient';

export default function AdminDashboardPage() {
  const { user } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading business analytics...</p>
      </div>
    );
  }

  const { metrics, sizeDistribution, categoryDistribution, statusDistribution, monthlyTrends, recentOrders, lowStockAlerts } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Banner & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Operations Headquarters
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Welcome back, <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</span> ({user.role}). Here is the real-time pulse of JK Empress.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/orders"
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manage All Orders</span>
          </Link>
          <Link
            href="/admin/reports"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      {/* 14 SUMMARY METRIC CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Executive Summary Cards
        </h2>

        {/* Primary Row: High-level numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Total Revenue</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400">
              ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-400">Total lifetime billed orders</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Total T-Shirts Ordered</span>
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-heading text-orange-600 dark:text-orange-400">
              {metrics.totalTshirtsOrdered}
            </div>
            <p className="text-[11px] text-zinc-400">Physical garments in queue</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Total Participants</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400">
              {metrics.totalParticipants}
            </div>
            <p className="text-[11px] text-zinc-400">Students registered in batches</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold">Total Orders</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-heading text-blue-600 dark:text-blue-400">
              {metrics.totalOrders}
            </div>
            <p className="text-[11px] text-zinc-400">All institutional bulk batches</p>
          </div>

        </div>

        {/* Secondary Detailed Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">New Orders</div>
            <div className="text-xl font-bold font-heading text-blue-500 mt-1">{metrics.newOrders}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Pending confirmation</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Confirmed Orders</div>
            <div className="text-xl font-bold font-heading text-emerald-500 mt-1">{metrics.confirmedOrders}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Advance paid & active</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Pending Payments</div>
            <div className="text-xl font-bold font-heading text-amber-600 mt-1">₹{(metrics.pendingPayments || 0).toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Awaiting customer deposit</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Completed Orders</div>
            <div className="text-xl font-bold font-heading text-emerald-600 mt-1">{metrics.completedOrders}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Delivered & verified</div>
          </div>

        </div>
      </div>

      {/* DASHBOARD CHARTS & ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Popular T-shirt Sizes (XS to 3XL) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm">Popular T-Shirt Sizes</h3>
              <p className="text-xs text-zinc-400">Distribution across all individual shirts</p>
            </div>
            <span className="text-xs font-bold text-orange-600">XS – 3XL</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => {
              const count = sizeDistribution[size] || 0;
              const maxCount = Math.max(...Object.values(sizeDistribution).map(v => Number(v)), 1);
              const pct = Math.round((count / maxCount) * 100);

              return (
                <div key={size} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Size {size}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{count} pcs</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Popular Event Categories */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm">Event Categories</h3>
              <p className="text-xs text-zinc-400">Breakdown of order types</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryDistribution).map(([category, count]) => {
              const numCount = Number(count);
              const totalOrders = Math.max(metrics.totalOrders, 1);
              const pct = Math.round((numCount / totalOrders) * 100);

              return (
                <div key={category} className="p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs">{category}</div>
                    <div className="text-[10px] text-zinc-400">{pct}% of institutional volume</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{numCount} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RECENT ORDERS TABLE (FULL WIDTH) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base">Recent Institutional Orders</h3>
            <p className="text-xs text-zinc-400">Latest bulk orders placed with JK Empress</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold flex items-center gap-1"
          >
            <span>View all orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 font-bold">Order ID</th>
                <th className="py-2.5 font-bold">College / Event</th>
                <th className="py-2.5 font-bold">T-Shirts</th>
                <th className="py-2.5 font-bold">Total Amount</th>
                <th className="py-2.5 font-bold">Payment</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {order.id}
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{order.college_name}</div>
                    <div className="text-[10px] text-zinc-400">{order.event_name}</div>
                  </td>
                  <td className="py-3 font-semibold">
                    {order.tshirts_count} tees
                  </td>
                  <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.payment_status === 'fully_paid'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {order.payment_status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    {order.production_status === 'photos_uploading' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Photos Uploading</span>
                      </span>
                    ) : (
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {order.production_status?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white font-bold text-[11px] transition-colors"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
