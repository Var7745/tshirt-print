'use client';

import React from 'react';
import { X, Printer, Download, Sparkles } from 'lucide-react';

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.id}`;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in">
      
      {/* Modal Container */}
      <div className="bg-white text-zinc-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl print:shadow-none print:p-0 print:border-none print:max-w-none">
        
        {/* Controls - Hidden on print */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 print:hidden mb-6">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-lg">Tax Invoice / Bill of Supply</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
              {invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-sm">
                  JK
                </div>
                <span className="text-xl font-black font-heading tracking-tight text-orange-600">JK EMPRESS</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Custom Apparel & Signature Day Merchandise</p>
              <p className="text-xs text-zinc-600 mt-0.5">Plot 42, Hitech City Apparel Zone, Hyderabad, TS - 500081</p>
              <p className="text-xs text-zinc-600">GSTIN: <span className="font-mono font-bold">36AABCU9603R1ZM</span> · Phone: +91 98490 12345</p>
              <p className="text-xs text-zinc-600">Email: orders@jkempress.com · Web: www.jkempress.com</p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black font-heading text-zinc-800">INVOICE</div>
              <p className="text-xs font-bold font-mono text-zinc-600 mt-1">Invoice #: {invoiceNumber}</p>
              <p className="text-xs text-zinc-500">Date: {today}</p>
              <p className="text-xs text-zinc-500">Order ID: <span className="font-mono font-bold">{order.id}</span></p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                Status: {order.payment_status?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Billed To & Event Details */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <div className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">BILLED TO:</div>
              <div className="font-extrabold text-sm text-zinc-900">{order.customer_name}</div>
              <div className="font-semibold text-zinc-700">{order.college_name}</div>
              {order.department && <div className="text-zinc-600">Dept: {order.department} ({order.batch || 'Batch 2026'})</div>}
              <div className="text-zinc-600">Phone: {order.phone}</div>
              {order.delivery_address && (
                <div className="text-zinc-600 mt-1 text-[11px] leading-relaxed">
                  Delivery: {order.delivery_address}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <div className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">EVENT SPECIFICATIONS:</div>
              <div className="font-extrabold text-sm text-zinc-900">{order.event_name}</div>
              <div className="text-zinc-700">Category: <span className="font-bold">{order.event_category}</span></div>
              <div className="text-zinc-700">Participants Registered: <span className="font-bold">{order.participants_count}</span></div>
              <div className="text-zinc-700">Physical T-Shirts: <span className="font-bold">{order.tshirts_count} pcs</span></div>
              <div className="text-zinc-700">Delivery Deadline: <span className="font-bold">{order.delivery_required_date || 'Standard'}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden border border-zinc-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">HSN/SAC</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-zinc-900">Customized Batch T-Shirt ({order.event_category})</div>
                    <div className="text-[11px] text-zinc-500">
                      100% Bio-Washed Cotton 220 GSM · High-Res DTF Multi-Photo Print
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono">61091000</td>
                  <td className="p-3 text-center font-bold">{order.tshirts_count}</td>
                  <td className="p-3 text-right font-mono">₹{order.price_per_tshirt}</td>
                  <td className="p-3 text-right font-mono font-bold">₹{(order.tshirts_count * order.price_per_tshirt).toFixed(2)}</td>
                </tr>

                {Number(order.printing_charges) > 0 && (
                  <tr>
                    <td className="p-3">
                      <div className="font-medium text-zinc-800">Multi-Side DTF Print Charges (Sleeve / Back)</div>
                    </td>
                    <td className="p-3 text-center font-mono">9988</td>
                    <td className="p-3 text-center">1</td>
                    <td className="p-3 text-right font-mono">₹{order.printing_charges}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{Number(order.printing_charges).toFixed(2)}</td>
                  </tr>
                )}

                {Number(order.shipping_charges) > 0 && (
                  <tr>
                    <td className="p-3">
                      <div className="font-medium text-zinc-800">Express Insured Courier Shipping</div>
                    </td>
                    <td className="p-3 text-center font-mono">9968</td>
                    <td className="p-3 text-center">1</td>
                    <td className="p-3 text-right font-mono">₹{order.shipping_charges}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{Number(order.shipping_charges).toFixed(2)}</td>
                  </tr>
                )}

                {Number(order.discount_amount) > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/50">
                    <td className="p-3">
                      <div className="font-medium">Institutional Bulk Discount Applied</div>
                    </td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center">1</td>
                    <td className="p-3 text-right font-mono">-₹{order.discount_amount}</td>
                    <td className="p-3 text-right font-mono font-bold">-₹{Number(order.discount_amount).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex justify-end text-xs">
            <div className="w-72 space-y-2 border-t border-zinc-200 pt-3">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{(order.total_amount - (order.gst_amount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>GST (5% Apparel):</span>
                <span className="font-mono">₹{Number(order.gst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-zinc-900 border-t border-zinc-300 pt-2">
                <span>Grand Total:</span>
                <span className="text-orange-600 font-mono">₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-700 pt-1">
                <span>Advance Paid:</span>
                <span className="font-mono font-bold text-emerald-600">₹{Number(order.advance_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-700 font-bold border-t border-dashed border-zinc-200 pt-1">
                <span>Balance Payable:</span>
                <span className="font-mono text-rose-600">₹{Number(order.remaining_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-4 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-1">
            <div className="font-bold text-zinc-700 uppercase">Terms & Conditions:</div>
            <p>1. 50% advance payable at design signoff, remainder upon dispatch or delivery confirmation.</p>
            <p>2. Customized apparel cannot be returned once printed as per approved individual roster.</p>
            <p>3. This is a computer-generated tax invoice issued by JK Empress.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
