'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, Building2, CreditCard } from 'lucide-react';

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
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
        .catch((err) => console.warn('Could not fetch settings for invoice:', err));
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `${settings.invoice_prefix || 'INV-JK'}-${order.id?.replace(/^JK-/, '') || order.id}`;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const companyName = settings.company_name || 'JK Empress';
  const tagline = settings.brand_tagline || 'Custom Apparel & Signature Day Merchandise';
  const address = settings.business_address || 'Plot 42, Hitech City Main Road, Madhapur, Hyderabad, TS - 500081';
  const gstin = settings.gst_number || '36AAACJ1234F1Z8';
  const phone = settings.contact_phone || '+91 98765 43210';
  const email = settings.support_email || 'support@jkempress.com';
  const bankName = settings.bank_name || 'HDFC Bank Ltd';
  const accountNo = settings.bank_account_no || '50200012345678';
  const ifsc = settings.bank_ifsc || 'HDFC0001234';
  const upiId = settings.upi_id || 'jkempress@upi';

  const gstAmount = Number(order.gst_amount || 0);
  const totalAmount = Number(order.total_amount || 0);
  const subtotal = totalAmount - gstAmount;
  const halfGst = gstAmount / 2;

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
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
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
                <span className="text-xl font-black font-heading tracking-tight text-orange-600 uppercase">
                  {companyName}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{tagline}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{address}</p>
              <p className="text-xs text-zinc-600">
                GSTIN: <span className="font-mono font-bold">{gstin}</span> · Phone: {phone}
              </p>
              <p className="text-xs text-zinc-600">
                Email: {email} · Web: www.jkempress.com
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black font-heading text-zinc-800">TAX INVOICE</div>
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
              {order.department && (
                <div className="text-zinc-600">
                  Dept: {order.department} ({order.batch || 'Batch 2027'})
                </div>
              )}
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

          {/* Payment Instructions & Tax Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Bank Transfer Details */}
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5">
              <div className="font-bold text-zinc-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                Bank Transfer & UPI Details
              </div>
              <div className="text-zinc-600">
                Bank: <span className="font-semibold text-zinc-800">{bankName}</span>
              </div>
              <div className="text-zinc-600 font-mono">
                A/C No: <span className="font-bold text-zinc-900">{accountNo}</span>
              </div>
              <div className="text-zinc-600 font-mono">
                IFSC: <span className="font-bold text-zinc-900">{ifsc}</span>
              </div>
              <div className="text-zinc-600 font-mono">
                UPI ID: <span className="font-bold text-zinc-900">{upiId}</span>
              </div>
            </div>

            {/* Financial Calculation Summary with CGST / SGST split */}
            <div className="space-y-1.5 border border-zinc-200 bg-zinc-50 p-3.5 rounded-2xl">
              <div className="flex justify-between text-zinc-600">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>CGST (2.5%):</span>
                <span className="font-mono">₹{halfGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>SGST (2.5%):</span>
                <span className="font-mono">₹{halfGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-zinc-900 border-t border-zinc-300 pt-2">
                <span>Grand Total:</span>
                <span className="text-orange-600 font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-700 pt-1">
                <span>Advance Paid:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{Number(order.advance_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-700 font-bold border-t border-dashed border-zinc-300 pt-1">
                <span>Balance Payable:</span>
                <span className="font-mono text-rose-600">
                  ₹{Number(order.remaining_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-4 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-1">
            <div className="font-bold text-zinc-700 uppercase">Terms & Conditions:</div>
            <p>1. 50% advance payable at design signoff, remainder upon dispatch or delivery confirmation.</p>
            <p>2. Customized apparel cannot be returned once printed as per approved individual roster.</p>
            <p>3. This is a computer-generated tax invoice issued by {companyName}.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
