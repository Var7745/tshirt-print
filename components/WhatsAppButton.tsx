'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const openWhatsApp = () => {
    const text = encodeURIComponent("Hi JK IMPRESS! I need help creating graduation batch t-shirts for my college.");
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all group"
      title="Chat with us on WhatsApp"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-8 h-8 fill-white stroke-none" />
      <span className="absolute right-16 bg-[#1A1613] text-white text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
        Need quick help? Chat on WhatsApp
      </span>
    </button>
  );
}
