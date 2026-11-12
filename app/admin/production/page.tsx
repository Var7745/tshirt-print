'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Factory,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Flame,
  Package,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';

interface ProductionItem {
  id: string;
  order_id: string;
  customer_name: string;
  college_name: string;
  event_name: string;
  tshirts_count: number;
  delivery_required_date: string;
  stage: string;
  priority: 'standard' | 'urgent' | 'express';
  assigned_staff_name?: string;
  tshirts_completed: number;
  tshirts_pending: number;
  defective_count: number;
  notes?: string;
}

const STAGES = [
  { id: 'order_confirmed', label: 'Order Confirmed', color: 'border-zinc-300 bg-zinc-50' },
  { id: 'design_preparation', label: 'Design Prep', color: 'border-blue-300 bg-blue-50/50' },
  { id: 'pre_press', label: 'Pre-Press / RIP', color: 'border-indigo-300 bg-indigo-50/50' },
  { id: 'printing', label: 'DTF Printing', color: 'border-amber-300 bg-amber-50/50' },
  { id: 'heat_press', label: 'Heat Press', color: 'border-orange-300 bg-orange-50/50' },
  { id: 'quality_check', label: 'QA & Inspection', color: 'border-purple-300 bg-purple-50/50' },
  { id: 'packing', label: 'Packing', color: 'border-teal-300 bg-teal-50/50' },
  { id: 'ready_for_dispatch', label: 'Ready / Dispatched', color: 'border-emerald-300 bg-emerald-50/50' },
];

export default function ProductionBoardPage() {
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/production');
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch production:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, []);

  const moveStage = async (orderId: string, nextStage: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          stage: nextStage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev =>
          prev.map(item => (item.order_id === orderId ? { ...item, stage: nextStage } : item))
        );
      }
    } catch (err) {
      console.error('Failed to advance stage:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = items.filter(
    i =>
      i.order_id.toLowerCase().includes(search.toLowerCase()) ||
      i.college_name.toLowerCase().includes(search.toLowerCase()) ||
      i.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">
                Production Floor & Kanban
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Track garment printing lifecycle from RIP proofing to final dispatch.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search batch or college..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={fetchProduction}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-[1600px]">
          {STAGES.map((col, idx) => {
            const stageItems = filteredItems.filter(i => (i.stage || 'order_confirmed') === col.id);
            const totalTees = stageItems.reduce((acc, curr) => acc + (curr.tshirts_count || 0), 0);

            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 flex flex-col rounded-2xl bg-zinc-100/80 border border-zinc-200/80 p-3"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    <span className="text-xs font-black font-heading text-zinc-900">
                      {col.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-zinc-700 border border-zinc-200 shadow-2xs">
                      {stageItems.length} ({totalTees} pcs)
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {stageItems.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                      <p className="text-[11px] text-zinc-400 font-medium">No batches in this stage</p>
                    </div>
                  ) : (
                    stageItems.map(item => {
                      const nextStage = STAGES[idx + 1]?.id;

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-3.5 border border-zinc-200 shadow-xs hover:shadow-md transition-all space-y-3"
                        >
                          {/* Priority & Order ID */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-orange-600">
                              {item.order_id}
                            </span>
                            {item.priority === 'express' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                <Flame className="w-2.5 h-2.5 fill-rose-600" />
                                Express
                              </span>
                            ) : item.priority === 'urgent' ? (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Urgent
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-zinc-400">
                                Standard
                              </span>
                            )}
                          </div>

                          {/* College & Event */}
                          <div>
                            <div className="text-xs font-bold text-zinc-900 line-clamp-1">
                              {item.college_name}
                            </div>
                            <div className="text-[11px] text-zinc-500 line-clamp-1">
                              {item.event_name}
                            </div>
                          </div>

                          {/* Garment Count & Deadline */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                            <div>
                              <span className="text-zinc-400 block">Garments:</span>
                              <span className="font-bold text-zinc-800">{item.tshirts_count} T-Shirts</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Required By:</span>
                              <span className="font-bold text-zinc-800">
                                {item.delivery_required_date ? item.delivery_required_date.slice(5) : 'ASAP'}
                              </span>
                            </div>
                          </div>

                          {/* Operator Action */}
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[11px]">
                            <Link
                              href={`/admin/orders/${item.order_id}`}
                              className="text-zinc-500 hover:text-zinc-900 font-semibold inline-flex items-center gap-1"
                            >
                              Details
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            {nextStage && (
                              <button
                                onClick={() => moveStage(item.order_id, nextStage)}
                                disabled={updatingId === item.order_id}
                                className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
                              >
                                {updatingId === item.order_id ? 'Moving...' : 'Next Stage'}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
