'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const togglePublish = async (id: string, currentVal: number) => {
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_published_testimonial: currentVal ? 0 : 1
        })
      });
      fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Customer Reviews &amp; Testimonials
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Module 15
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Moderate student feedback, star ratings, and feature authentic college stories on the JK Empress homepage.
          </p>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-zinc-400">
            No customer reviews submitted yet.
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{r.customer_name}</h3>
                  <div className="text-xs font-semibold text-orange-600">{r.college_name}</div>
                  <div className="text-[10px] text-zinc-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                &ldquo;{r.comment}&rdquo;
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono text-[11px]">{r.order_id || 'Verified Buyer'}</span>
                
                <button
                  onClick={() => togglePublish(r.id, r.is_published_testimonial)}
                  className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-colors ${
                    r.is_published_testimonial
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {r.is_published_testimonial ? 'Featured on Homepage' : 'Hidden from Homepage'}
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
