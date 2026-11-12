'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Palette,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  Check,
  RefreshCw,
  FileCheck,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';

interface DesignFile {
  id: string;
  order_id: string;
  tshirt_id?: string;
  side: 'front' | 'back' | 'left_sleeve' | 'right_sleeve';
  artwork_url?: string;
  mockup_url?: string;
  print_width_in: number;
  print_height_in: number;
  dpi: number;
  format: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_requested';
  approval_notes?: string;
  approved_by?: string;
  approved_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  college_name?: string;
  event_name?: string;
  order_status?: string;
  delivery_required_date?: string;
  tshirts_count?: number;
}

interface Stats {
  total: number;
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
}

export default function DesignsManagementPage() {
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Inspection / Edit Modal
  const [selectedDesign, setSelectedDesign] = useState<DesignFile | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editWidth, setEditWidth] = useState<number>(10);
  const [editHeight, setEditHeight] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sideFilter !== 'all') params.append('side', sideFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/designs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDesigns(data.data || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [statusFilter, sideFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDesigns();
  };

  const openInspection = (design: DesignFile) => {
    setSelectedDesign(design);
    setEditStatus(design.status);
    setEditNotes(design.approval_notes || '');
    setEditWidth(design.print_width_in || 10);
    setEditHeight(design.print_height_in || 12);
    setActionSuccess(null);
  };

  const handleQuickApprove = async (design: DesignFile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/admin/designs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: design.id,
          status: 'approved',
          approval_notes: 'Approved for production by Administrator.'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchDesigns();
      }
    } catch (err) {
      console.error('Failed to approve design:', err);
    }
  };

  const handleSaveModal = async () => {
    if (!selectedDesign) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/designs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDesign.id,
          status: editStatus,
          approval_notes: editNotes,
          print_width_in: editWidth,
          print_height_in: editHeight
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Design proof successfully updated!');
        setTimeout(() => {
          setSelectedDesign(null);
          setActionSuccess(null);
          fetchDesigns();
        }, 900);
      } else {
        alert(data.error || 'Failed to update design');
      }
    } catch (err) {
      console.error('Error updating design:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sliders className="w-3.5 h-3.5" /> In Review
          </span>
        );
      case 'rejected':
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Revision Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            {status}
          </span>
        );
    }
  };

  const getSideLabel = (side: string) => {
    switch (side) {
      case 'front': return 'Front Chest';
      case 'back': return 'Back Jersey / Signature';
      case 'left_sleeve': return 'Left Sleeve';
      case 'right_sleeve': return 'Right Sleeve';
      default: return side;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/admin" className="hover:text-zinc-800">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-800 font-medium">Design Proofing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-indigo-600" />
            Design Approval & Proofing Gallery
          </h1>
          <p className="text-sm text-zinc-500">
            Review student collages, verify 300 DPI print-readiness, manage client approvals, and dispatch to RIP/DTF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDesigns}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/print-files"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Print Files Center
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500 uppercase">Total Files</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</p>
          <span className="text-[11px] text-zinc-500">Active design records</span>
        </div>
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase">Pending Review</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{stats.pending}</p>
          <span className="text-[11px] text-amber-600">Requires proofing</span>
        </div>
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-xs font-semibold text-blue-700 uppercase">In Review</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{stats.in_review}</p>
          <span className="text-[11px] text-blue-600">Pre-press inspection</span>
        </div>
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Approved</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.approved}</p>
          <span className="text-[11px] text-emerald-600">Production ready</span>
        </div>
        <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-xs font-semibold text-rose-700 uppercase">Revision Req.</p>
          <p className="text-2xl font-bold text-rose-800 mt-1">{stats.rejected}</p>
          <span className="text-[11px] text-rose-600">Needs designer edit</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, College, Customer, or Event..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </form>

        {/* Side Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['all', 'front', 'back', 'left_sleeve', 'right_sleeve'].map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                sideFilter === s
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'text-zinc-600 bg-zinc-50 hover:bg-zinc-100'
              }`}
            >
              {s === 'all' ? 'All Sides' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Revision Requested</option>
          </select>
        </div>
      </div>

      {/* Design Gallery Grid */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-xl border border-zinc-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600">Loading design gallery & proofs...</p>
        </div>
      ) : designs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-zinc-200">
          <Palette className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800">No Design Proofs Found</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'all' || sideFilter !== 'all'
              ? 'No design files match your current filters. Try resetting search or status filters.'
              : 'There are no artwork files uploaded for current orders yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {designs.map((design) => (
            <div
              key={design.id}
              onClick={() => openInspection(design)}
              className="group bg-white rounded-xl border border-zinc-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden"
            >
              {/* Thumbnail / Preview Area */}
              <div className="relative aspect-[4/3] bg-zinc-950 flex items-center justify-center p-4 border-b border-zinc-100 overflow-hidden">
                {design.mockup_url || design.artwork_url ? (
                  <img
                    src={design.mockup_url || design.artwork_url}
                    alt={`${design.side} artwork`}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-zinc-400">
                    <Palette className="w-8 h-8 mx-auto mb-1 text-zinc-500" />
                    <span className="text-xs">Artwork Rendering</span>
                  </div>
                )}

                {/* Side Tag Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-zinc-900/80 text-white backdrop-blur-sm">
                    {design.side}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  {getStatusBadge(design.status)}
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[1px]">
                  <Eye className="w-4 h-4" /> Inspect Proof
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {design.order_id}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      v{design.version || 1} • {design.format || 'PNG'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">
                    {design.college_name || 'JK Empress Batch'}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1 mb-2">
                    {design.customer_name} • {design.event_name || 'Graduation'}
                  </p>

                  {/* Print Dimensions */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100 mb-3">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {design.print_width_in || 10}&quot; &times; {design.print_height_in || 12}&quot; @ {design.dpi || 300} DPI
                    </span>
                  </div>

                  {design.approval_notes && (
                    <p className="text-xs text-zinc-500 italic bg-amber-50/50 p-2 rounded border border-amber-100/60 mb-2 line-clamp-2">
                      &ldquo;{design.approval_notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400">
                    {design.approved_by ? `By: ${design.approved_by}` : 'Unverified'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {design.status !== 'approved' && (
                      <button
                        onClick={(e) => handleQuickApprove(design, e)}
                        title="Quick Approve"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInspection(design);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                      title="Inspect & Edit"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspection & Approval Modal */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    Inspect Design Proof — {selectedDesign.order_id} ({getSideLabel(selectedDesign.side)})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {selectedDesign.college_name} • {selectedDesign.customer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDesign(null)}
                className="text-zinc-400 hover:text-zinc-700 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {actionSuccess}
                </div>
              )}

              {/* Visual Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 rounded-xl p-4 flex flex-col items-center justify-center border border-zinc-800 min-h-[220px]">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Print Artwork
                  </span>
                  {selectedDesign.artwork_url ? (
                    <img
                      src={selectedDesign.artwork_url}
                      alt="Artwork Full"
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <div className="text-zinc-500 text-xs">No artwork file uploaded</div>
                  )}
                  {selectedDesign.artwork_url && (
                    <a
                      href={selectedDesign.artwork_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Open Full Resolution
                    </a>
                  )}
                </div>

                <div className="bg-zinc-100 rounded-xl p-4 flex flex-col items-center justify-center border border-zinc-200 min-h-[220px]">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Garment Mockup Preview
                  </span>
                  {selectedDesign.mockup_url ? (
                    <img
                      src={selectedDesign.mockup_url}
                      alt="Mockup Preview"
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <div className="text-zinc-400 text-xs">No 3D mockup generated</div>
                  )}
                  {selectedDesign.mockup_url && (
                    <a
                      href={selectedDesign.mockup_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Mockup Fullscreen
                    </a>
                  )}
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Approval & Quality Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="in_review">In Review / RIP Prep</option>
                    <option value="approved">Approved & Ready for DTF</option>
                    <option value="rejected">Rejected / Revision Required</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Print Width (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editWidth}
                      onChange={(e) => setEditWidth(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Print Height (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editHeight}
                      onChange={(e) => setEditHeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Approval Notes / Production Guidance
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Verified 300 DPI transparency. Center chest aligned with 2 inches margin from neckline."
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Order Reference Info */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-700">Associated Order:</span>{' '}
                  <span className="text-indigo-600 font-mono font-medium">{selectedDesign.order_id}</span>
                </div>
                <Link
                  href={`/admin/orders/${selectedDesign.order_id}`}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Go to Order Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedDesign(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/70 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveModal}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Update Proof'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
