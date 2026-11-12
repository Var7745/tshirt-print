'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  Folder,
  FileImage,
  Download,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Eye,
  Shirt
} from 'lucide-react';
import TshirtMockup from '@/components/TshirtMockup';
import {
  downloadSvgElementAsPng,
  downloadSvgElementAsSvg,
  downloadOrderBatchZip
} from '@/lib/downloadPrint';

export default function AdminPrintFilesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [tshirts, setTshirts] = useState<any[]>([]);
  const [selectedTshirt, setSelectedTshirt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    fetch('/api/admin/orders?limit=50')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.orders) ? data.orders : [];
        if (data?.success && list.length > 0) {
          setOrders(list);
          setSelectedOrder(list[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      fetch(`/api/admin/orders/${selectedOrder.id}/tshirts`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const list = data.data || [];
            setTshirts(list);
            if (list.length > 0) setSelectedTshirt(list[0]);
          }
        });
    }
  }, [selectedOrder]);

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.college_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadFront = (shirt?: any) => {
    const s = shirt || selectedTshirt;
    const el = (document.getElementById('print-file-front-svg') || document.querySelector('svg[id*="front-svg"]')) as SVGSVGElement | null;
    if (el && s) {
      downloadSvgElementAsPng(el, `${s.tshirt_number}_Front_${s.jersey_name || s.person_name || 'PRINT'}`, {
        widthInches: 10,
        heightInches: 12,
        dpi: 300,
        transparent: true,
        includeWatermark: false
      });
    } else {
      alert('Front artwork element not found. Please select a garment.');
    }
  };

  const handleDownloadBack = (shirt?: any) => {
    const s = shirt || selectedTshirt;
    const el = (document.getElementById('print-file-back-svg') || document.querySelector('svg[id*="back-svg"]')) as SVGSVGElement | null;
    if (el && s) {
      downloadSvgElementAsPng(el, `${s.tshirt_number}_Back_${s.jersey_name || s.person_name || 'PRINT'}`, {
        widthInches: 11,
        heightInches: 14,
        dpi: 300,
        transparent: true,
        includeWatermark: false
      });
    } else {
      alert('Back print element not found. Please select a garment.');
    }
  };

  const handleDownloadSvg = (side: 'front' | 'back', shirt?: any) => {
    const s = shirt || selectedTshirt;
    const id = side === 'front' ? 'print-file-front-svg' : 'print-file-back-svg';
    const el = (document.getElementById(id) || document.querySelector(`svg[id*="${side}-svg"]`)) as SVGSVGElement | null;
    if (el && s) {
      downloadSvgElementAsSvg(el, `${s.tshirt_number}_${side === 'front' ? 'Front' : 'Back'}_${s.jersey_name || s.person_name || 'PRINT'}`);
    } else {
      alert(`${side === 'front' ? 'Front' : 'Back'} vector element not found.`);
    }
  };

  const handleDownloadBatch = async () => {
    if (!selectedOrder || tshirts.length === 0) return;
    setDownloadingZip(true);
    try {
      await downloadOrderBatchZip(selectedOrder, tshirts);
    } catch (err: any) {
      alert(`Could not download batch ZIP: ${err.message}`);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Central Print Files Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
              Module 5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Hierarchical DTF production file organizer: Order ID &gt; T-Shirt Number &gt; Print Side (300 DPI Transparent PNG &amp; Vector SVG).
          </p>
        </div>

        {selectedOrder && (
          <button
            onClick={handleDownloadBatch}
            disabled={downloadingZip}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-600/20 disabled:opacity-60 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingZip ? 'Packaging Batch ZIP...' : `Download All Prints (${selectedOrder.id})`}</span>
          </button>
        )}
      </div>

      {/* Main Grid: Orders List & Print Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Order Selector (4 cols) */}
        <div className="md:col-span-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm">Select Batch Order</h3>
            <span className="text-[10px] text-zinc-400 font-mono">{filteredOrders.length} orders</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter order ID or college..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none"
            />
          </div>

          <div className="max-h-[520px] overflow-y-auto space-y-1.5 pt-1">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-sm ring-1 ring-orange-500/30'
                      : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-zinc-400'}`} />
                    <div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{ord.id}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{ord.college_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block">
                      {ord.tshirts_count} tees
                    </span>
                    <span className="text-[9px] uppercase font-bold text-orange-600">
                      {ord.collage_shape || 'honeycomb'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive T-Shirt Print Studio (8 cols) */}
        <div className="md:col-span-8 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
          {selectedOrder ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-orange-600">{selectedOrder.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 capitalize">
                      {selectedOrder.collage_shape || 'honeycomb'} Layout
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{selectedOrder.college_name} · {selectedOrder.event_name}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>300 DPI DTF Print Studio Ready</span>
                  </span>
                </div>
              </div>

              {/* Individual Shirts Carousel Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Select Garment ({tshirts.length} Physical Units):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {tshirts.map((t) => {
                    const isCurrent = selectedTshirt?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTshirt(t)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left shrink-0 transition-all ${
                          isCurrent
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-500/30'
                            : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={t.main_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={t.person_name}
                          className="w-6 h-6 rounded-lg object-cover"
                        />
                        <div className="text-[11px]">
                          <span className="font-mono font-bold text-orange-600">{t.tshirt_number}</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 ml-1.5">{t.person_name}</span>
                        </div>
                        <span className="px-1 text-[9px] font-mono font-bold bg-zinc-200 dark:bg-zinc-700 rounded">
                          {t.size}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active T-Shirt Proof & Download Controls */}
              {selectedTshirt && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-2 border-t border-slate-100 dark:border-zinc-800">
                  
                  {/* Left: Live T-shirt Mockup (7 cols) */}
                  <div className="md:col-span-7">
                    <TshirtMockup
                      shape={selectedOrder.collage_shape || 'honeycomb'}
                      peopleCount={tshirts.length || selectedOrder.tshirts_count || 20}
                      jerseyName={selectedTshirt.jersey_name}
                      rollNumber={selectedTshirt.roll_number}
                      collegeName={selectedOrder.college_name}
                      courseSection={selectedOrder.department || selectedOrder.batch}
                      graduatingYear={selectedOrder.batch?.replace(/[^0-9]/g, '') || 2027}
                      centerMember={{
                        id: selectedTshirt.id,
                        name: selectedTshirt.person_name,
                        jerseyName: selectedTshirt.jersey_name,
                        rollNumber: selectedTshirt.roll_number,
                        photoUrl: selectedTshirt.main_photo_url,
                        size: selectedTshirt.size
                      }}
                      members={tshirts.map(t => ({
                        id: t.id,
                        name: t.person_name,
                        jerseyName: t.jersey_name,
                        rollNumber: t.roll_number,
                        photoUrl: t.main_photo_url,
                        size: t.size
                      }))}
                      showDownloadControls={true}
                      tshirtNumber={selectedTshirt.tshirt_number}
                      frontSvgId="print-file-front-svg"
                      backSvgId="print-file-back-svg"
                    />
                  </div>

                  {/* Right: Print Files Hierarchy Cards (5 cols) */}
                  <div className="md:col-span-5 space-y-3 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-3">
                      <div>
                        <div className="font-mono text-xs font-bold text-orange-600">{selectedTshirt.tshirt_number}</div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{selectedTshirt.person_name}</h4>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Jersey: {selectedTshirt.jersey_name} · Roll: {selectedTshirt.roll_number}</div>
                      </div>

                      {/* Front File Card */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-orange-500" />
                          <div>
                            <div className="font-bold text-[11px]">Front_Artwork.png</div>
                            <div className="text-[9px] text-zinc-400">{selectedTshirt.person_name} in Center</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadFront(selectedTshirt)}
                          className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>PNG</span>
                        </button>
                      </div>

                      {/* Back File Card */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-purple-500" />
                          <div>
                            <div className="font-bold text-[11px]">Back_Signature.png</div>
                            <div className="text-[9px] text-zinc-400">Jersey: {selectedTshirt.jersey_name}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadBack(selectedTshirt)}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>PNG</span>
                        </button>
                      </div>

                      {/* Vector SVG File */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4 text-emerald-500" />
                          <div>
                            <div className="font-bold text-[11px]">Vector_DTF.svg</div>
                            <div className="text-[9px] text-zinc-400">Lossless Vector</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownloadSvg('front', selectedTshirt)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-zinc-700 dark:text-zinc-200 font-bold text-[10px] cursor-pointer"
                            title="Download Front Vector SVG"
                          >
                            Front SVG
                          </button>
                          <button
                            onClick={() => handleDownloadSvg('back', selectedTshirt)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-zinc-700 dark:text-zinc-200 font-bold text-[10px] cursor-pointer"
                            title="Download Back Vector SVG"
                          >
                            Back SVG
                          </button>
                        </div>
                      </div>

                      <div className="pt-1 text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>Format: 300 DPI Transparent</span>
                        <span className="font-mono font-bold text-orange-600">{selectedTshirt.required_print_copies || 1} copy</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-zinc-400 text-xs">
              Select an order on the left to inspect and download print files.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
