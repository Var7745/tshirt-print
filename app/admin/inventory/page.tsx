'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Shirt,
  Sparkles,
  PackageCheck,
  History,
  X,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  item_type: string;
  name: string;
  size?: string;
  colour?: string;
  fabric?: string;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
  unit_cost: number;
  supplier_name?: string;
  updated_at: string;
}

interface InventoryLog {
  id: string;
  item_name: string;
  change_type: string;
  quantity: number;
  reason?: string;
  user_name: string;
  created_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [summary, setSummary] = useState({ totalItems: 0, lowStockAlerts: 0, totalBlankTshirtsInStock: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal State
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'stock_in' | 'stock_out' | 'adjustment'>('stock_in');
  const [adjustReason, setAdjustReason] = useState('Purchase stock reception');
  const [adjusting, setAdjusting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('item_type', filterType);
      if (lowStockOnly) params.set('low_stock', 'true');

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setLogs(data.recentLogs || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterType, lowStockOnly]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    try {
      setAdjusting(true);
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          inventory_id: adjustModalItem.id,
          change_type: adjustType,
          quantity: adjustQty,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdjustModalItem(null);
        fetchInventory();
      } else {
        alert(data.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating stock');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredItems = items.filter(
    i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.size && i.size.toLowerCase().includes(search.toLowerCase())) ||
      (i.colour && i.colour.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">
                Inventory & Raw Materials
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Warehouse blank apparel, DTF inks, and consumables management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              lowStockOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Low Stock Alerts ({summary.lowStockAlerts})
          </button>

          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Blank T-Shirts</span>
          <div className="text-2xl font-black font-heading text-zinc-900 flex items-center justify-between">
            <span>{summary.totalBlankTshirtsInStock.toLocaleString()} pcs</span>
            <Shirt className="w-6 h-6 text-orange-600 opacity-80" />
          </div>
          <span className="text-xs text-emerald-600 font-semibold">Ready for DTF Printing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Low Stock Warnings</span>
          <div className="text-2xl font-black font-heading text-rose-600 flex items-center justify-between">
            <span>{summary.lowStockAlerts} items</span>
            <AlertTriangle className="w-6 h-6 text-rose-500 opacity-80" />
          </div>
          <span className="text-xs text-rose-600 font-semibold">Below minimum reorder threshold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Tracked SKUs</span>
          <div className="text-2xl font-black font-heading text-zinc-900 flex items-center justify-between">
            <span>{items.length} SKUs</span>
            <PackageCheck className="w-6 h-6 text-indigo-600 opacity-80" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">Garments, Inks & Packaging</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'tshirt', 'ink', 'paper', 'packaging'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                filterType === type
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {type === 'all' ? 'All Items' : type}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search items, size, colour..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
              <tr>
                <th className="p-3.5">Item Name & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Size / Color</th>
                <th className="p-3.5 text-right">In Stock</th>
                <th className="p-3.5 text-right">Threshold</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow = item.current_stock <= item.low_stock_threshold;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">{item.name}</div>
                        {item.fabric && <div className="text-[10px] text-zinc-400">{item.fabric}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                          {item.item_type}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-zinc-800">
                          {item.size || '—'} {item.colour ? `· ${item.colour}` : ''}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-sm text-zinc-900">
                        {item.current_stock} <span className="text-[10px] text-zinc-400 font-normal">{item.unit}</span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-zinc-500">
                        {item.low_stock_threshold} {item.unit}
                      </td>
                      <td className="p-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setAdjustModalItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#D9531E] font-bold text-xs border border-orange-200 transition-colors"
                        >
                          Adjust Stock
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

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-black font-heading text-lg text-zinc-900">Adjust Inventory</h3>
                <p className="text-xs text-zinc-500 font-medium">{adjustModalItem.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('stock_in')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    adjustType === 'stock_in'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  + Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('stock_out')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    adjustType === 'stock_out'
                      ? 'bg-rose-50 border-rose-500 text-rose-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  - Stock Out
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('adjustment')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    adjustType === 'adjustment'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  Set Count
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Quantity ({adjustModalItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Reason / Reference</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. New delivery from mill, order allocation..."
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {adjusting ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
