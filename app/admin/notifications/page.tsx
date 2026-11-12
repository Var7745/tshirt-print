'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Palette,
  Package,
  CreditCard,
  ArrowRight
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const getSafeLink = (link?: string) => {
    if (!link) return '/admin/orders';
    if (
      link.startsWith('/admin/inventory') ||
      link.startsWith('/admin/production') ||
      link.startsWith('/admin/shipping') ||
      link.startsWith('/admin/designs') ||
      link.startsWith('/admin/coupons') ||
      link.startsWith('/admin/staff')
    ) {
      return '/admin/orders';
    }
    return link;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'design': return <Palette className="w-4 h-4 text-purple-500" />;
      case 'inventory': return <Package className="w-4 h-4 text-amber-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Notification &amp; Communication Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Module 17
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time operations stream: new batch orders, design revisions, inventory threshold triggers, and payments.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Notifications Stream */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm divide-y divide-slate-100 dark:divide-zinc-800">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-400">
            No notifications logged yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-orange-50/30 dark:bg-zinc-800/40' : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">{n.message}</p>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {n.link && (
                <Link
                  href={getSafeLink(n.link)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 shrink-0 inline-flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
