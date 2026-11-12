'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shirt, Plus, ArrowRight, Calendar, Users, Eye, Search, User, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { getStoredBatches, BatchData } from '@/lib/store';

export default function BatchesListPage() {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localList = getStoredBatches();

    // Check customer session & fetch live DB batches
    Promise.all([
      fetch('/api/auth/customer').then((r) => r.json()).catch(() => ({ authenticated: false })),
      fetch('/api/batches').then((r) => r.json()).catch(() => ({ success: false, batches: [] }))
    ]).then(([authData, batchData]) => {
      if (authData.authenticated && authData.user) {
        setCustomer(authData.user);
      }

      const dbBatches: BatchData[] = (batchData.batches || []).map((b: any) => ({
        id: b.id,
        collegeName: b.collegeName,
        courseSection: b.courseSection,
        graduatingYear: b.graduatingYear,
        durationYears: 4,
        startYear: b.graduatingYear - 4,
        email: authData.user?.email || 'organizer@batch.edu',
        phone: authData.user?.phone || '+91 98765 00000',
        pack: b.pack || 'salina',
        packPrice: b.packPrice || 150,
        isExpress: false,
        collageShape: b.collageShape || 'honeycomb',
        backTemplate: 'jersey',
        rollDigits: 3,
        includeLogo: true,
        expectedMembers: b.expectedMembers || 25,
        createdAt: b.createdAt || new Date().toISOString(),
        status: b.status || 'collecting',
        members: []
      }));

      // Merge: DB batches take precedence over dummy local records with same id
      const mergedMap = new Map<string, BatchData>();
      for (const b of dbBatches) {
        mergedMap.set(b.id, b);
      }
      for (const b of localList) {
        if (!mergedMap.has(b.id)) {
          mergedMap.set(b.id, b);
        }
      }

      setBatches(Array.from(mergedMap.values()));
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/customer', { method: 'DELETE' });
    setCustomer(null);
    window.location.reload();
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.courseSection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email && b.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8C461E] bg-[#F3ECE1] px-3 py-1 rounded-full border border-[#E5DAC8] mb-2 inline-block">
              BATCH PORTAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              My Batches
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your active photo collections, member rosters, and print orders.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1A1613] hover:bg-stone-800 text-white font-bold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#D9531E]" />
            Start New Batch
          </Link>
        </div>

        {/* Coordinator Account Status Banner */}
        {customer ? (
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {customer.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Coordinator: {customer.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Database Synced
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  {customer.email} • {customer.phone} {customer.college_name ? `• ${customer.college_name}` : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#D9531E] shrink-0" />
              <span>Have an existing coordinator account? Log in to access all your database-saved batches and photos.</span>
            </div>
            <Link
              href="/create"
              className="text-xs text-[#D9531E] hover:underline font-bold shrink-0 ml-3"
            >
              Log In →
            </Link>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by college, branch, or email..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40"
          />
        </div>

        {/* Batches List */}
        {filteredBatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Shirt className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">No batches found</h2>
            <p className="text-sm text-stone-500">
              Create your first graduation batch to start collecting photos!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D9531E] text-white font-bold text-xs"
            >
              Create a batch now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase text-[#D9531E] tracking-wider">
                      {batch.courseSection}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Collecting Photos
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold text-stone-900 line-clamp-1">
                    {batch.collegeName}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Class of {batch.graduatingYear}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {batch.members?.length || 0} joined
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Pack: <strong className="text-stone-800 capitalize">{batch.pack} (₹{batch.packPrice})</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/${batch.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1613] hover:bg-stone-800 text-white font-bold text-xs transition-colors"
                    >
                      Dashboard
                      <ArrowRight className="w-3.5 h-3.5 text-[#D9531E]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
