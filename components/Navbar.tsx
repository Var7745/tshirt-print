'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Sparkles, Shield } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Do not render consumer navbar inside admin dashboard
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBE4D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md ring-1 ring-amber-500/20 group-hover:scale-105 transition-transform bg-[#1A1613]">
              <img
                src="/jk-impress-logo.jpg"
                alt="JK IMPRESS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-[#1A1613] font-sans leading-none">
                JK IMPRESS
              </span>
              <span className="text-[9px] font-bold tracking-[0.25em] text-[#C49746] uppercase mt-1">
                MAKE YOUR MARK
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5A554E]">
            <Link href="/#pricing" className="hover:text-[#1A1613] transition-colors">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#1A1613] transition-colors">
              How It Works
            </Link>
            <Link href="/#faq" className="hover:text-[#1A1613] transition-colors">
              FAQ
            </Link>
            <Link href="/batches" className="hover:text-[#1A1613] transition-colors">
              My batches
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-stone-700 bg-stone-200/80 hover:bg-[#1A1613] hover:text-white transition-all shadow-xs"
              title="JK Empress Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-[#C49746]" />
              Admin
            </Link>
          </div>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1613] hover:bg-[#2C2723] text-white text-sm font-bold shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-amber-500/20"
            >
              Start a batch
              <ArrowRight className="w-4 h-4 text-[#C49746]" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-[#1A1613] hover:bg-[#EFE7DC] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#EBE4D8] px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/#pricing"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-[#1A1613] hover:bg-[#EFE7DC] rounded-lg"
          >
            Pricing
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-[#1A1613] hover:bg-[#EFE7DC] rounded-lg"
          >
            How It Works
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-[#1A1613] rounded-lg"
          >
            FAQ
          </Link>
          <Link
            href="/batches"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-[#1A1613] hover:bg-[#EFE7DC] rounded-lg"
          >
            My batches
          </Link>
          <div className="pt-2">
            <Link
              href="/create"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A1613] text-white font-bold text-center"
            >
              Start a batch
              <ArrowRight className="w-4 h-4 text-[#C49746]" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
