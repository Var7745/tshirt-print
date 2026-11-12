'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  Download,
  CheckCircle2,
  Database,
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data || {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/settings?export=json', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              System Settings &amp; Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              Module 19
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise legal profile, GSTIN registration, invoice numbering formats, print margins, and automated database backups.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Company Profile & Tax Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Building className="w-4 h-4 text-orange-500" />
            <h3 className="font-heading font-bold text-base">Business Entity &amp; Legal Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.company_name || 'JK Empress'}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={settings.gstin || '36AABCU9603R1ZM'}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Billing Address</label>
              <input
                type="text"
                value={settings.billing_address || 'Plot 42, Hitech City Apparel Zone, Hyderabad, TS - 500081'}
                onChange={(e) => setSettings({ ...settings, billing_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Official Billing Phone</label>
              <input
                type="text"
                value={settings.billing_phone || '+91 98490 12345'}
                onChange={(e) => setSettings({ ...settings, billing_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Invoice & Print Setup */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-base">Invoicing Rules &amp; Print Calibration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoice_prefix || 'INV-JK-2026-'}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Default DTF DPI</label>
              <input
                type="number"
                value={settings.default_dpi || '300'}
                onChange={(e) => setSettings({ ...settings, default_dpi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Max Front Print Width (Inches)</label>
              <input
                type="number"
                value={settings.max_print_width || '11.5'}
                onChange={(e) => setSettings({ ...settings, max_print_width: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Database Backup & Security Snapshot */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Database className="w-4 h-4 text-blue-500" />
            <h3 className="font-heading font-bold text-base">Database Backup &amp; Disaster Recovery</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Download Full SQLite Database Snapshot</div>
              <p className="text-zinc-500 mt-0.5">
                Generates a complete JSON backup containing all 17 tables (orders, individual t-shirts, designs, payments, customers, inventory).
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 font-bold text-xs flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
