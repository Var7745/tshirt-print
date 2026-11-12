'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Factory, CheckSquare } from 'lucide-react';

interface ProductionSheetModalProps {
  order: any;
  tshirts: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductionSheetModal({ order, tshirts, isOpen, onClose }: ProductionSheetModalProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSettings(data.data);
          }
        })
        .catch((err) => console.warn('Could not fetch settings for production sheet:', err));
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = settings.company_name || 'JK Empress';

  // Compute size counts
  const sizeCounts: Record<string, number> = {};
  tshirts.forEach((t: any) => {
    sizeCounts[t.size] = (sizeCounts[t.size] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl print:shadow-none print:p-0 print:border-none print:max-w-none">
        
        {/* Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 print:hidden mb-6">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-orange-600" />
            <span className="font-heading font-black text-lg">Shop-Floor Production Work Order</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-zinc-100 text-zinc-800">
              {order.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Production Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div>
              <div className="text-xl font-black font-heading tracking-tight uppercase">
                {companyName} — PRODUCTION WORK ORDER
              </div>
              <p className="text-xs font-semibold text-zinc-600 mt-0.5">
                Manufacturing, DTF Printing & Quality Control Traveler
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                <span>ORDER: <strong className="text-sm">{order.id}</strong></span>
                <span>JOB DATE: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
                <span>TARGET DISPATCH: <strong className="text-rose-600">{order.delivery_required_date || 'URGENT'}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="border-2 border-zinc-900 px-3 py-1 text-center font-mono font-black text-xs uppercase">
                PRIORITY: {order.priority ? String(order.priority).toUpperCase() : 'EXPRESS'}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                Total Units: <strong>{order.tshirts_count} PCS</strong>
              </div>
            </div>
          </div>

          {/* Job Specs */}
          <div className="grid grid-cols-3 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div>
              <div className="font-bold text-zinc-400 uppercase text-[10px]">Client / College</div>
              <div className="font-extrabold text-sm">{order.college_name}</div>
              <div className="text-zinc-600">{order.customer_name} ({order.phone})</div>
            </div>
            <div>
              <div className="font-bold text-zinc-400 uppercase text-[10px]">Event & Garment</div>
              <div className="font-extrabold text-sm">{order.event_name}</div>
              <div className="text-zinc-600">Fabric: 100% Bio-Wash 220 GSM Cotton</div>
            </div>
            <div>
              <div className="font-bold text-zinc-400 uppercase text-[10px]">Special Instructions</div>
              <div className="text-zinc-700 italic">
                {order.special_instructions || 'Ensure HD color vibrance on signature backplate. 300 DPI cold peel.'}
              </div>
            </div>
          </div>

          {/* Size Breakdown Matrix */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-600 mb-2">
              Blank Garment Allocation Checklist (Total: {order.tshirts_count} pcs)
            </div>
            <div className="grid grid-cols-7 border border-zinc-300 divide-x divide-zinc-300 text-center font-mono text-xs">
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'TOTAL'].map((sz) => (
                <div key={sz} className="py-1.5 bg-zinc-100 font-bold text-[11px]">{sz}</div>
              ))}
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((sz) => (
                <div key={sz} className="py-2 font-bold text-sm bg-white">
                  {sizeCounts[sz] || (sz === 'XXL' ? sizeCounts['2XL'] || 0 : sz === 'XXXL' ? sizeCounts['3XL'] || 0 : 0)}
                </div>
              ))}
              <div className="py-2 font-black text-sm bg-orange-50 text-orange-600">
                {order.tshirts_count}
              </div>
            </div>
          </div>

          {/* Individual Physical T-Shirt Roster */}
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-600 mb-2">
              Individual Garment Printing Matrix ({tshirts.length} Units)
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-600 sticky top-0">
                  <tr>
                    <th className="p-2">T-Shirt Number</th>
                    <th className="p-2">Name / Jersey</th>
                    <th className="p-2 text-center">Size</th>
                    <th className="p-2 text-center">F / B / LS / RS</th>
                    <th className="p-2 text-center">Print Copies</th>
                    <th className="p-2 text-center">QC Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {tshirts.map((t: any) => (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="p-2 font-bold text-orange-600">{t.tshirt_number}</td>
                      <td className="p-2">
                        <span className="font-sans font-bold">{t.person_name}</span>
                        {t.roll_number && <span className="text-zinc-500 text-[11px] ml-1">({t.roll_number})</span>}
                      </td>
                      <td className="p-2 text-center font-bold">{t.size}</td>
                      <td className="p-2 text-center text-[11px]">
                        <span className={t.print_front ? 'font-bold text-zinc-900' : 'text-zinc-300'}>F</span> ·{' '}
                        <span className={t.print_back ? 'font-bold text-zinc-900' : 'text-zinc-300'}>B</span> ·{' '}
                        <span className={t.print_left_sleeve ? 'font-bold text-zinc-900' : 'text-zinc-300'}>L</span> ·{' '}
                        <span className={t.print_right_sleeve ? 'font-bold text-zinc-900' : 'text-zinc-300'}>R</span>
                      </td>
                      <td className="p-2 text-center font-bold">{t.required_print_copies || 1}</td>
                      <td className="p-2 text-center">
                        <span className="inline-block w-4 h-4 border border-zinc-400 rounded"></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shop Floor Signatures Matrix */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-zinc-200 text-xs">
            <div className="p-2.5 border border-zinc-200 rounded-lg text-center">
              <div className="font-bold text-[10px] text-zinc-400 uppercase">1. Pretreatment & Blanks Pull</div>
              <div className="h-6"></div>
              <div className="text-[10px] text-zinc-400 border-t border-zinc-200 pt-1">Sign / Date</div>
            </div>
            <div className="p-2.5 border border-zinc-200 rounded-lg text-center">
              <div className="font-bold text-[10px] text-zinc-400 uppercase">2. DTF Print & Cure</div>
              <div className="h-6"></div>
              <div className="text-[10px] text-zinc-400 border-t border-zinc-200 pt-1">Sign / Date</div>
            </div>
            <div className="p-2.5 border border-zinc-200 rounded-lg text-center">
              <div className="font-bold text-[10px] text-zinc-400 uppercase">3. Heat Press & Cold Peel</div>
              <div className="h-6"></div>
              <div className="text-[10px] text-zinc-400 border-t border-zinc-200 pt-1">Sign / Date</div>
            </div>
            <div className="p-2.5 border border-zinc-200 rounded-lg text-center">
              <div className="font-bold text-[10px] text-zinc-400 uppercase">4. QC & Final Pack</div>
              <div className="h-6"></div>
              <div className="text-[10px] text-zinc-400 border-t border-zinc-200 pt-1">Sign / Date</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
