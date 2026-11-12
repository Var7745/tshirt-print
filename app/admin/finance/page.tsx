'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  Filter,
  X
} from 'lucide-react';

export default function AdminFinancePage() {
  const [data, setData] = useState<any>({ payments: [], expenses: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: 'Material Purchases',
    title: '',
    amount: 10000,
    vendor_name: '',
    payment_method: 'UPI',
    notes: ''
  });

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/finance');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expense', ...expenseForm })
      });
      const json = await res.json();
      if (json.success) {
        setExpenseModalOpen(false);
        setExpenseForm({ category: 'Material Purchases', title: '', amount: 10000, vendor_name: '', payment_method: 'UPI', notes: '' });
        fetchFinance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const { payments = [], expenses = [], summary = {} } = data;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Financial &amp; Revenue Operations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Module 10
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Cashflow analytics, customer payments, raw material expenses, GST compliance, and net profitability.
          </p>
        </div>

        <button
          onClick={() => setExpenseModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Business Expense</span>
        </button>
      </div>

      {/* 5 Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-zinc-400">Total Billed Orders</div>
          <div className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">
            ₹{(summary.totalBilled || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-400">Total order bookings</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-emerald-600">Collected Revenue</div>
          <div className="text-xl font-black font-mono text-emerald-600">
            ₹{(summary.totalCollected || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-400">Cash settled into bank</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-600">Pending Receivables</div>
          <div className="text-xl font-black font-mono text-amber-600">
            ₹{(summary.totalPending || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-400">Balance on dispatch</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-rose-600">Total Operating Expenses</div>
          <div className="text-xl font-black font-mono text-rose-600">
            ₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-400">Fabric, ink, courier, rent</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-orange-600">Net Estimated Profit</div>
          <div className="text-xl font-black font-mono text-orange-600">
            ₹{(summary.netProfit || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold">{summary.profitMarginPct || 0}% margin</p>
        </div>

      </div>

      {/* Switcher: Payments Log vs Expenses Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          Customer Payments Log ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          Operating Expenses Log ({expenses.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        {activeTab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                <tr>
                  <th className="py-3 px-4">Order ID &amp; Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction UTR / Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-orange-600">{p.order_id}</div>
                      <div className="text-zinc-500">{p.college_name} · {p.customer_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-emerald-600">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold">{p.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{p.transaction_ref}</td>
                    <td className="py-3 px-4 text-zinc-500">{p.payment_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        CONFIRMED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                <tr>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Supplier</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {expenses.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{e.title}</td>
                    <td className="py-3 px-4 text-zinc-500">{e.category}</td>
                    <td className="py-3 px-4 font-medium">{e.vendor_name || 'Direct'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-rose-600">
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">{e.payment_method}</td>
                    <td className="py-3 px-4 text-zinc-500">{e.expense_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold font-heading">Record Operating Expense</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. 500 Blank White T-Shirts (220 GSM Bio-Wash)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  >
                    <option value="Material Purchases">Material Purchases</option>
                    <option value="Printing Supplies">Printing Supplies</option>
                    <option value="Shipping & Courier">Shipping & Courier</option>
                    <option value="Workshop Operations">Workshop Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                  placeholder="e.g. Tirupur Knitting Mills"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
