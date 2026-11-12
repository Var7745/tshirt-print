'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  DollarSign,
  Factory,
  FileSpreadsheet,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = (type: string) => {
    setDownloading(type);
    window.open(`/api/admin/reports?type=${type}&format=csv`, '_blank');
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Reports &amp; Business Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Module 16
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Generate and export CSV datasets for accounting, auditing, inventory replenishment, and executive review.
          </p>
        </div>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Report 1: Orders Dataset */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg">Comprehensive Orders Report</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Full chronological export of every batch order, college name, student count, billing totals, advance paid, and workflow milestones.
              </p>
            </div>
          </div>

          <button
            onClick={() => downloadReport('orders')}
            disabled={downloading === 'orders'}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'orders' ? 'Exporting...' : 'Export Orders to CSV'}</span>
          </button>
        </div>

        {/* Report 2: Size Consumption Matrix */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg">T-Shirt Size Consumption Breakdown</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Aggregated size analysis (XS, S, M, L, XL, XXL, 3XL) across all physical garments manufactured. Perfect for planning raw blank stock.
              </p>
            </div>
          </div>

          <button
            onClick={() => downloadReport('sizes')}
            disabled={downloading === 'sizes'}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'sizes' ? 'Exporting...' : 'Export Size Matrix CSV'}</span>
          </button>
        </div>

        {/* Report 3: Financial Revenue Log */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg">Monthly Revenue &amp; Collections</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Monthly receipts, payment gateway settlements, cash collections, and pending accounts receivable for tax compliance and GST audit.
              </p>
            </div>
          </div>

          <button
            onClick={() => downloadReport('orders')}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Revenue CSV</span>
          </button>
        </div>

      </div>

    </div>
  );
}
