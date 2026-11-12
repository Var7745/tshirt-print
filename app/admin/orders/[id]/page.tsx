'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Users,
  Calendar,
  Clock,
  Printer,
  Factory,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Sparkles,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Layers,
  Check,
  X,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import InvoiceModal from '@/components/admin/InvoiceModal';
import ProductionSheetModal from '@/components/admin/ProductionSheetModal';
import TshirtMockup from '@/components/TshirtMockup';
import {
  downloadSvgElementAsPng,
  downloadSvgElementAsSvg,
  downloadOrderBatchZip
} from '@/lib/downloadPrint';

interface PageProps {
  params: { id: string };
}

export default function OrderDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const orderId = params.id;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [tshirts, setTshirts] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [production, setProduction] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedShirtIndex, setSelectedShirtIndex] = useState(0);
  const activeShirt = tshirts[selectedShirtIndex] || tshirts[0] || null;

  // Design Preview Active View
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'left_sleeve' | 'right_sleeve'>('front');

  // Modals state
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [prodSheetOpen, setProdSheetOpen] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const [addShirtModalOpen, setAddShirtModalOpen] = useState(false);
  const [editShirtModal, setEditShirtModal] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // New Shirt Form
  const [newShirt, setNewShirt] = useState({
    person_name: '',
    jersey_name: '',
    roll_number: '',
    size: 'L',
    colour: 'White',
    fabric: '100% Bio-Washed Cotton (220 GSM)',
    sleeve_type: 'Half Sleeve',
    main_photo_url: '',
    custom_text: '',
    print_front: true,
    print_back: true,
    print_left_sleeve: false,
    print_right_sleeve: false,
    required_print_copies: 1
  });

  const [downloadingZip, setDownloadingZip] = useState(false);

  // Record Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 5000,
    payment_method: 'UPI',
    transaction_ref: '',
    notes: 'Advance installment'
  });

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data.order);
        setTshirts(data.data.individualTshirts || []);
        setDesigns(data.data.designFiles || []);
        setProduction(data.data.productionRecord);
        setPayments(data.data.payments || []);
      } else {
        alert(data.error || 'Failed to fetch order');
      }
    } catch (e) {
      console.error('Error fetching order details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Handle Add Shirt
  const handleAddTshirt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tshirts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShirt)
      });
      const data = await res.json();
      if (data.success) {
        setAddShirtModalOpen(false);
        setNewShirt({
          person_name: '',
          jersey_name: '',
          roll_number: '',
          size: 'L',
          colour: 'White',
          fabric: '100% Bio-Washed Cotton (220 GSM)',
          sleeve_type: 'Half Sleeve',
          main_photo_url: '',
          custom_text: '',
          print_front: true,
          print_back: true,
          print_left_sleeve: false,
          print_right_sleeve: false,
          required_print_copies: 1
        });
        fetchOrderDetails();
      } else {
        alert(data.error || 'Failed to add t-shirt');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  // Handle Edit Shirt
  const handleUpdateTshirt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShirtModal) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tshirts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editShirtModal)
      });
      const data = await res.json();
      if (data.success) {
        setEditShirtModal(null);
        fetchOrderDetails();
      } else {
        alert(data.error || 'Failed to update t-shirt');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  // Handle Delete Shirt
  const handleDeleteTshirt = async (tshirtId: string, tshirtNumber: string) => {
    if (!confirm(`Are you sure you want to remove individual T-Shirt ${tshirtNumber}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tshirts?tshirt_id=${tshirtId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchOrderDetails();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  // Handle Design Approval
  const handleDesignStatusUpdate = async (side: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/designs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, status, approval_notes: notes || `Marked ${status} by Admin`, admin_name: 'Admin' })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrderDetails();
      }
    } catch (e) {
      console.error('Error updating design status', e);
    }
  };

  // Handle Status Update
  const handleOrderStatusUpdate = async (newProductionStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_status: newProductionStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusModalOpen(false);
        fetchOrderDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Payment Record
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: Number(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          transaction_ref: paymentForm.transaction_ref || `UPI-${Date.now()}`,
          notes: paymentForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentModalOpen(false);
        fetchOrderDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-500">Loading Order {orderId}...</p>
      </div>
    );
  }

  // Size breakdown map
  const sizeMap: Record<string, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 };
  let totalPrintCopies = 0;
  let totalUniquePhotos = 0;
  let frontPrintsCount = 0;
  let backPrintsCount = 0;
  let leftSleevePrintsCount = 0;
  let rightSleevePrintsCount = 0;

  tshirts.forEach((t) => {
    sizeMap[t.size] = (sizeMap[t.size] || 0) + 1;
    totalPrintCopies += Number(t.required_print_copies || 1);
    if (t.main_photo_url) totalUniquePhotos += 1;
    if (t.print_front) frontPrintsCount += 1;
    if (t.print_back) backPrintsCount += 1;
    if (t.print_left_sleeve) leftSleevePrintsCount += 1;
    if (t.print_right_sleeve) rightSleevePrintsCount += 1;
  });

  // Current active side design file
  const currentDesign = designs.find(d => d.side === activeSide);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Breadcrumb & Status Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/orders"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono font-black text-2xl tracking-tight text-orange-600 dark:text-orange-400">
              {order.id}
            </span>
            <span className="capitalize px-3 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              {order.production_status?.replace(/_/g, ' ')}
            </span>
            <span className={`capitalize px-3 py-0.5 rounded-full text-xs font-bold ${
              order.payment_status === 'fully_paid'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}>
              {order.payment_status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Last updated {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* SECTION 8: PRIMARY ORDER ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>Update Status</span>
          </button>
          
          <button
            onClick={() => setInvoiceOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Tax Invoice</span>
          </button>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* PHOTOS UPLOADING STATUS BANNER */}
      {order.production_status === 'photos_uploading' && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Upload className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Batch Status: Photos Uploading</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-xs">
                  {tshirts.filter((t) => t.main_photo_url).length} of {order.tshirts_count} Uploaded
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Students are uploading photos &amp; details. All {tshirts.length} individual t-shirt proofs are automatically generated with each person centered on the front and their details on the back.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-md shadow-amber-600/20 shrink-0"
          >
            Update Production Workflow
          </button>
        </div>
      )}

      {/* TOP OVERVIEW: SECTIONS 1 & 2 & 3 & 4 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1: CUSTOMER INFORMATION (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-zinc-400">
              Customer Details
            </h3>
            <span className="p-1 rounded-lg bg-orange-500/10 text-orange-600">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{order.customer_name}</div>
              <div className="font-semibold text-orange-600 dark:text-orange-400">{order.college_name}</div>
              {order.department && <div className="text-zinc-500">Dept: {order.department} ({order.batch || 'Batch 2026'})</div>}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Mobile
                </span>
                <a href={`tel:${order.phone}`} className="font-mono font-bold hover:underline">{order.phone}</a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                </span>
                <a
                  href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  className="font-mono font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Chat</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {order.email && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300">{order.email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1">
              <span className="text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Delivery Address
              </span>
              <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                {order.delivery_address || 'To be collected at college campus.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: EVENT INFORMATION (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-zinc-400">
              Event Specifications
            </h3>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{order.event_name}</div>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Category: {order.event_category}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Participants Registered:</span>
                <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400 text-sm">{order.participants_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total T-Shirts Ordered:</span>
                <span className="font-extrabold font-mono text-orange-600 dark:text-orange-400 text-sm">{order.tshirts_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Delivery Deadline:</span>
                <span className="font-bold text-rose-600">{order.delivery_required_date || 'Standard (7-10 Days)'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1">
              <span className="text-zinc-400 text-[10px] font-bold uppercase">Special Instructions:</span>
              <p className="text-zinc-600 dark:text-zinc-400 italic">
                {order.special_instructions || 'All tees bio-washed. Back signature plate honeycomb alignment required.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3 & 4: ORDER SUMMARY & SIZE BREAKDOWN (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-zinc-400">
              Print Copies & Size Matrix
            </h3>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Decoupled Print counts */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Unique Photos</div>
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{totalUniquePhotos}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <div className="text-[10px] text-orange-600 font-bold uppercase">Print Copies</div>
                <div className="text-lg font-black text-orange-600">{totalPrintCopies}</div>
              </div>
            </div>

            {/* Print sides summary */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Front: <strong className="text-zinc-900 dark:text-zinc-100">{frontPrintsCount}</strong></span>
              <span>Back: <strong className="text-zinc-900 dark:text-zinc-100">{backPrintsCount}</strong></span>
              <span>L Sleeve: <strong className="text-zinc-900 dark:text-zinc-100">{leftSleevePrintsCount}</strong></span>
              <span>R Sleeve: <strong className="text-zinc-900 dark:text-zinc-100">{rightSleevePrintsCount}</strong></span>
            </div>

            {/* SECTION 4: SIZE BREAKDOWN TABLE */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Size Breakdown:</div>
              <div className="grid grid-cols-6 border border-slate-200 dark:border-zinc-700 divide-x divide-slate-200 dark:divide-zinc-700 rounded-lg text-center overflow-hidden font-mono">
                {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                  <div key={s} className="bg-slate-100 dark:bg-zinc-800 py-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{s}</div>
                ))}
                {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                  <div key={s} className="py-1 font-bold text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {sizeMap[s] || (s === 'XXL' ? sizeMap['2XL'] || 0 : s === 'XXXL' ? sizeMap['3XL'] || 0 : 0)}
                  </div>
                ))}
              </div>
              <div className="text-right text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mt-1">
                Total: <span className="text-orange-600 dark:text-orange-400 font-black">{order.tshirts_count} Physical T-Shirts</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: PERSONALIZED BATCH T-SHIRT STUDIO & PRINT DOWNLOADER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-lg flex items-center gap-2">
                <span>Personalized Batch T-Shirt Generator &amp; Print Copy Studio</span>
                <span className="p-1 rounded-lg bg-orange-500/10 text-orange-600">
                  <Sparkles className="w-4 h-4" />
                </span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 capitalize">
                Style: {order.collage_shape || 'honeycomb'} Pattern
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select any member below to inspect their personalized t-shirt: they appear in the <strong>CENTER (&quot;YOU&quot;)</strong> on the front surrounded by all {Math.max(1, tshirts.length - 1)} classmates, with their custom jersey name and roll number on the back.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!order || tshirts.length === 0) return;
                setDownloadingZip(true);
                try {
                  await downloadOrderBatchZip(order, tshirts);
                } catch (err: any) {
                  alert(`Download failed: ${err.message}`);
                } finally {
                  setDownloadingZip(false);
                }
              }}
              disabled={downloadingZip}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-orange-600/20 disabled:opacity-60 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingZip ? 'Packaging Batch ZIP...' : `Download Batch Print Copies (${tshirts.length} Tees)`}</span>
            </button>
          </div>
        </div>

        {/* Member Selector Carousel Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              Select Person&apos;s T-Shirt ({selectedShirtIndex + 1} of {tshirts.length}):
            </span>
            <span className="text-[11px] text-zinc-400">
              Active: <strong className="text-orange-600">{activeShirt?.person_name}</strong> ({activeShirt?.tshirt_number})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {tshirts.map((shirt, idx) => {
              const isSelected = selectedShirtIndex === idx;
              return (
                <button
                  key={shirt.id}
                  onClick={() => setSelectedShirtIndex(idx)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 ring-2 ring-orange-500/30 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <img
                    src={shirt.main_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={shirt.person_name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                  />
                  <div className="text-xs">
                    <div className="font-mono text-[10px] text-orange-600 font-bold">{shirt.tshirt_number}</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 max-w-[100px] truncate">{shirt.person_name}</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200">
                    {shirt.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual-View Studio Pane */}
        {activeShirt && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            
            {/* Visualizer (7 cols) */}
            <div className="lg:col-span-7">
              <TshirtMockup
                shape={order.collage_shape || 'honeycomb'}
                peopleCount={tshirts.length || order.tshirts_count || 20}
                jerseyName={activeShirt.jersey_name}
                rollNumber={activeShirt.roll_number}
                collegeName={order.college_name}
                courseSection={order.department || order.batch}
                graduatingYear={order.batch?.replace(/[^0-9]/g, '') || 2027}
                centerMember={{
                  id: activeShirt.id,
                  name: activeShirt.person_name,
                  jerseyName: activeShirt.jersey_name,
                  rollNumber: activeShirt.roll_number,
                  photoUrl: activeShirt.main_photo_url,
                  size: activeShirt.size
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
                tshirtNumber={activeShirt.tshirt_number}
                frontSvgId="order-detail-front-svg"
                backSvgId="order-detail-back-svg"
              />
            </div>

            {/* Member Details & Print Specifications (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-4 text-xs">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
                <div>
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    {activeShirt.tshirt_number}
                  </span>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {activeShirt.person_name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-black font-mono text-sm border border-orange-200 dark:border-orange-800">
                  Size: {activeShirt.size}
                </span>
              </div>

              {/* Front Specification */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span className="text-orange-600 font-extrabold">FRONT DESIGN</span>
                  <span className="text-[10px] uppercase font-mono text-zinc-400">DTF 300 DPI</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  <strong>{activeShirt.person_name}</strong> is in the <strong>CENTER (&quot;YOU&quot;)</strong> rosette with {Math.max(1, tshirts.length - 1)} classmates surrounding.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const el = (document.getElementById('order-detail-front-svg') || document.querySelector('svg[id*="front-svg"]')) as SVGSVGElement | null;
                      if (el) {
                        downloadSvgElementAsPng(el, `${activeShirt.tshirt_number}_Front_${activeShirt.jersey_name}`);
                      } else {
                        alert('Front print element not found.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Front Print (PNG)</span>
                  </button>
                  <button
                    onClick={() => {
                      const el = (document.getElementById('order-detail-front-svg') || document.querySelector('svg[id*="front-svg"]')) as SVGSVGElement | null;
                      if (el) {
                        downloadSvgElementAsSvg(el, `${activeShirt.tshirt_number}_Front_${activeShirt.jersey_name}`);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] cursor-pointer"
                  >
                    SVG
                  </button>
                </div>
              </div>

              {/* Back Specification */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span className="text-stone-800 dark:text-stone-200 font-extrabold">BACK DESIGN</span>
                  <span className="text-[10px] uppercase font-mono text-zinc-400">Jersey Signature</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-zinc-400">Jersey Name:</span>
                    <div className="font-extrabold font-mono text-zinc-900 dark:text-zinc-100">{activeShirt.jersey_name || 'MEMBER'}</div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Roll Number:</span>
                    <div className="font-extrabold font-mono text-zinc-900 dark:text-zinc-100">{activeShirt.roll_number || '00'}</div>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const el = (document.getElementById('order-detail-back-svg') || document.querySelector('svg[id*="back-svg"]')) as SVGSVGElement | null;
                      if (el) {
                        downloadSvgElementAsPng(el, `${activeShirt.tshirt_number}_Back_${activeShirt.jersey_name}`);
                      } else {
                        alert('Back print element not found.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Back Print (PNG)</span>
                  </button>
                  <button
                    onClick={() => {
                      const el = (document.getElementById('order-detail-back-svg') || document.querySelector('svg[id*="back-svg"]')) as SVGSVGElement | null;
                      if (el) {
                        downloadSvgElementAsSvg(el, `${activeShirt.tshirt_number}_Back_${activeShirt.jersey_name}`);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] cursor-pointer"
                  >
                    SVG
                  </button>
                </div>
              </div>

              {/* Garment Details */}
              <div className="space-y-1.5 text-[11px] text-zinc-500 pt-1 border-t border-slate-200 dark:border-zinc-700">
                <div className="flex justify-between">
                  <span>Fabric:</span>
                  <strong className="text-zinc-700 dark:text-zinc-300">{activeShirt.fabric}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fit / Sleeve:</span>
                  <strong className="text-zinc-700 dark:text-zinc-300">{activeShirt.colour} · {activeShirt.sleeve_type}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Print Copies Required:</span>
                  <strong className="text-orange-600">{activeShirt.required_print_copies || 1} physical print</strong>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* SECTION 5: INDIVIDUAL T-SHIRT MANAGEMENT TABLE (CRITICAL REQUIREMENT) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg">
                Individual Physical T-Shirt Records
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600">
                {tshirts.length} Physical Units
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Every single manufactured garment has an assigned unique sequential ID (e.g. {orderId}-001). Photos and print copies are decoupled.
            </p>
          </div>

          <button
            onClick={() => setAddShirtModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Individual T-Shirt</span>
          </button>
        </div>

        {/* T-Shirt Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
              <tr>
                <th className="py-3 px-3">T-Shirt Number</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3 text-center">Size & Fit</th>
                <th className="py-3 px-3 text-center">Print Sides</th>
                <th className="py-3 px-3 text-center">Print Copies</th>
                <th className="py-3 px-3">Jersey Name / Text</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {tshirts.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  
                  {/* T-Shirt Number */}
                  <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {t.tshirt_number}
                  </td>

                  {/* Person's Name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{t.person_name}</div>
                    {t.roll_number && <div className="text-[10px] text-zinc-400 font-mono">Roll: {t.roll_number}</div>}
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="py-3 px-3">
                    {t.main_photo_url ? (
                      <div className="relative group/img inline-block">
                        <img
                          src={t.main_photo_url}
                          alt={t.person_name}
                          onClick={() => setPhotoModalUrl(t.main_photo_url)}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={() => setPhotoModalUrl(t.main_photo_url)}
                          className="absolute inset-0 bg-black/40 text-white rounded-xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">No Photo</span>
                    )}
                  </td>

                  {/* Size & Fabric */}
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-black font-mono text-xs bg-slate-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {t.size}
                    </span>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.sleeve_type}</div>
                  </td>

                  {/* Print Sides Matrix */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold">
                      <span className={t.print_front ? 'text-orange-600' : 'text-zinc-300'}>F</span>
                      <span>·</span>
                      <span className={t.print_back ? 'text-orange-600' : 'text-zinc-300'}>B</span>
                      <span>·</span>
                      <span className={t.print_left_sleeve ? 'text-orange-600' : 'text-zinc-300'}>LS</span>
                      <span>·</span>
                      <span className={t.print_right_sleeve ? 'text-orange-600' : 'text-zinc-300'}>RS</span>
                    </div>
                  </td>

                  {/* Required Print Copies (Decoupled!) */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {t.required_print_copies || 1} copies
                  </td>

                  {/* Jersey Name & Custom Text */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {t.jersey_name || 'Standard'}
                    </div>
                    {t.custom_text && <div className="text-[10px] text-zinc-400 italic">&ldquo;{t.custom_text}&rdquo;</div>}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          const idx = tshirts.findIndex((x) => x.id === t.id);
                          if (idx >= 0) setSelectedShirtIndex(idx);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        className="px-2 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center gap-1 font-bold text-[10px]"
                        title="View & Download Personalized T-Shirt Proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Proof</span>
                      </button>
                      <button
                        onClick={() => setEditShirtModal(t)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
                        title="Edit individual details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTshirt(t.id, t.tshirt_number)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete T-Shirt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* SECTION 7: ORDER FINANCIAL DETAILS & PAYMENT LOGS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="font-heading font-bold text-lg">Financial Details & Payment Records</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Commercial ledger, advance settlements, and tax calculation</p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Financial Breakdown Table (6 cols) */}
          <div className="md:col-span-6 space-y-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Base Garment Price:</span>
                <span className="font-mono">₹{order.price_per_tshirt} × {order.tshirts_count} tees = ₹{(order.price_per_tshirt * order.tshirts_count).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Printing & Multi-Side DTF:</span>
                <span className="font-mono">₹{Number(order.printing_charges || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Shipping & Packaging:</span>
                <span className="font-mono">₹{Number(order.shipping_charges || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>GST (5% Apparel):</span>
                <span className="font-mono">₹{Number(order.gst_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Institutional Discount:</span>
                <span className="font-mono">-₹{Number(order.discount_amount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                <span>Total Order Amount:</span>
                <span className="font-mono text-orange-600 dark:text-orange-400">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-emerald-600 pt-1">
                <span>Total Advance Settled:</span>
                <span className="font-mono">₹{Number(order.advance_amount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-rose-600 pt-0.5">
                <span>Outstanding Balance Payable:</span>
                <span className="font-mono">₹{Number(order.remaining_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Transactions Log (6 cols) */}
          <div className="md:col-span-6 space-y-2 text-xs">
            <span className="font-bold text-zinc-400 uppercase text-[10px]">Payment Audit History:</span>
            {payments.length === 0 ? (
              <p className="text-zinc-400 italic py-4">No payments logged yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{Number(p.amount).toLocaleString('en-IN')} ({p.payment_method})
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">Ref: {p.transaction_ref} · {p.payment_date}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      PAID
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* FULL PHOTO VIEWER MODAL */}
      {photoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setPhotoModalUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-2 flex items-center justify-center max-h-[75vh]">
              <img src={photoModalUrl} alt="Photograph" className="max-h-[70vh] rounded-2xl object-contain shadow-lg" />
            </div>
            <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 text-xs">
              <span className="font-bold text-zinc-500">Student Artwork Photo</span>
              {photoModalUrl && (photoModalUrl.startsWith('http://') || photoModalUrl.startsWith('https://') || photoModalUrl.startsWith('data:image/') || photoModalUrl.startsWith('/')) ? (
                <a
                  href={photoModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold inline-flex items-center gap-1.5 hover:bg-orange-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Photo</span>
                </a>
              ) : (
                <span className="text-rose-500 text-xs font-semibold">Invalid or Untrusted Photo URL</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD INDIVIDUAL T-SHIRT MODAL */}
      {addShirtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold font-heading">Add Individual Physical T-Shirt</h3>
              <button onClick={() => setAddShirtModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTshirt} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={newShirt.person_name}
                    onChange={(e) => setNewShirt({ ...newShirt, person_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Jersey Name / Nickname</label>
                  <input
                    type="text"
                    value={newShirt.jersey_name}
                    onChange={(e) => setNewShirt({ ...newShirt, jersey_name: e.target.value })}
                    placeholder="e.g. RAHUL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Size</label>
                  <select
                    value={newShirt.size}
                    onChange={(e) => setNewShirt({ ...newShirt, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  >
                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Sleeve Type</label>
                  <select
                    value={newShirt.sleeve_type}
                    onChange={(e) => setNewShirt({ ...newShirt, sleeve_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  >
                    <option value="Half Sleeve">Half Sleeve</option>
                    <option value="Full Sleeve">Full Sleeve</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Print Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={newShirt.required_print_copies}
                    onChange={(e) => setNewShirt({ ...newShirt, required_print_copies: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Photo URL</label>
                <input
                  type="url"
                  value={newShirt.main_photo_url}
                  onChange={(e) => setNewShirt({ ...newShirt, main_photo_url: e.target.value })}
                  placeholder="https://... photo url"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              {/* Print Sides Toggle */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-2">Print Areas Required:</label>
                <div className="grid grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShirt.print_front}
                      onChange={(e) => setNewShirt({ ...newShirt, print_front: e.target.checked })}
                    />
                    <span>Front</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShirt.print_back}
                      onChange={(e) => setNewShirt({ ...newShirt, print_back: e.target.checked })}
                    />
                    <span>Back</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShirt.print_left_sleeve}
                      onChange={(e) => setNewShirt({ ...newShirt, print_left_sleeve: e.target.checked })}
                    />
                    <span>L Sleeve</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newShirt.print_right_sleeve}
                      onChange={(e) => setNewShirt({ ...newShirt, print_right_sleeve: e.target.checked })}
                    />
                    <span>R Sleeve</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAddShirtModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
                >
                  Add T-Shirt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INDIVIDUAL T-SHIRT MODAL */}
      {editShirtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold font-heading">Edit T-Shirt {editShirtModal.tshirt_number}</h3>
              <button onClick={() => setEditShirtModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTshirt} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={editShirtModal.person_name}
                    onChange={(e) => setEditShirtModal({ ...editShirtModal, person_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Jersey Name</label>
                  <input
                    type="text"
                    value={editShirtModal.jersey_name || ''}
                    onChange={(e) => setEditShirtModal({ ...editShirtModal, jersey_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Size</label>
                  <select
                    value={editShirtModal.size}
                    onChange={(e) => setEditShirtModal({ ...editShirtModal, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold"
                  >
                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Print Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={editShirtModal.required_print_copies || 1}
                    onChange={(e) => setEditShirtModal({ ...editShirtModal, required_print_copies: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editShirtModal.roll_number || ''}
                    onChange={(e) => setEditShirtModal({ ...editShirtModal, roll_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Photo URL</label>
                <input
                  type="url"
                  value={editShirtModal.main_photo_url || ''}
                  onChange={(e) => setEditShirtModal({ ...editShirtModal, main_photo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditShirtModal(null)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold font-heading">Record Payment for {order.id}</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Amount Paid (INR) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Gateway">Razorpay / Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Transaction Ref / UTR</label>
                <input
                  type="text"
                  value={paymentForm.transaction_ref}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_ref: e.target.value })}
                  placeholder="e.g. 402919201948"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-heading">Update Order Workflow Status</h3>
            <div className="space-y-1.5 text-xs">
              {[
                'photos_uploading',
                'new',
                'confirmed',
                'design_pending',
                'design_approved',
                'printing',
                'production',
                'quality_check',
                'ready_for_dispatch',
                'shipped',
                'delivered',
                'completed',
                'cancelled'
              ].map((st) => (
                <button
                  key={st}
                  onClick={() => handleOrderStatusUpdate(st)}
                  className={`w-full text-left px-3 py-2 rounded-xl capitalize font-medium transition-colors ${
                    order.production_status === st
                      ? 'bg-orange-600 text-white font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStatusModalOpen(false)}
              className="w-full py-2 rounded-xl border font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      <InvoiceModal
        order={order}
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />

      {/* PRODUCTION WORK ORDER SHEET MODAL */}
      <ProductionSheetModal
        order={order}
        tshirts={tshirts}
        isOpen={prodSheetOpen}
        onClose={() => setProdSheetOpen(false)}
      />

    </div>
  );
}
