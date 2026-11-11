'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function AdminContentPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setContent(data.data || {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Website CMS &amp; Content Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Module 13
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Edit live storefront banners, promotional announcements, hero headlines, and customer FAQ items.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes Published to Storefront!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Homepage Hero & Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="font-heading font-bold text-base">Storefront Announcement Bar &amp; Tagline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Company Name</label>
              <input
                type="text"
                value={content.company_name || 'JK Empress'}
                onChange={(e) => setContent({ ...content, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={content.brand_tagline || 'Make Your Mark — Custom College Apparel & Signature Day Tees'}
                onChange={(e) => setContent({ ...content, brand_tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Top Announcement Ribbon</label>
            <input
              type="text"
              value={content.announcement_bar || '🎓 2026 Batch Graduation Bookings Open! Get Free Permanent Fabric Markers + Shades with All Bulk Orders.'}
              onChange={(e) => setContent({ ...content, announcement_bar: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
            />
          </div>
        </div>

        {/* Card 2: Contact Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-base">Public Contact &amp; Support Channels</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Public WhatsApp Hotline</label>
              <input
                type="text"
                value={content.support_whatsapp || '+91 98490 12345'}
                onChange={(e) => setContent({ ...content, support_whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Support Email</label>
              <input
                type="email"
                value={content.support_email || 'orders@jkempress.com'}
                onChange={(e) => setContent({ ...content, support_email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Printing Workshop Address</label>
              <input
                type="text"
                value={content.office_address || 'Plot 42, Hitech City Apparel Zone, Hyderabad, TS - 500081'}
                onChange={(e) => setContent({ ...content, office_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
              />
            </div>
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
            <span>{saving ? 'Publishing...' : 'Save & Publish CMS Content'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
