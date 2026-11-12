'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shirt, Plus, ArrowRight, Calendar, Users, Eye, Search } from 'lucide-react';
import { getStoredBatches, BatchData } from '@/lib/store';

export default function BatchesListPage() {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setBatches(getStoredBatches());
  }, []);

  const filteredBatches = batches.filter(
    (b) =>
      b.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.courseSection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
