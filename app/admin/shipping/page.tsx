'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Edit2,
  RefreshCw,
  X,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface Shipment {
  id: string;
  order_id: string;
  customer_name: string;
  college_name: string;
  phone: string;
  delivery_address: string;
  packages_count: number;
  total_tshirts: number;
  courier_name?: string;
  tracking_number?: string;
  shipment_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: string;
  delivery_notes?: string;
  updated_at: string;
}

const COURIER_OPTIONS = ['DTDC Express', 'Delhivery Surface', 'BlueDart Express', 'Xpressbees', 'Professional Couriers', 'Speed Post (India Post)'];

export default function ShippingLogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit Modal
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [status, setStatus] = useState('packing_pending');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchShipping = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/shipping');
      const data = await res.json();
      if (data.success && data.data) {
        setShipments(data.data);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, []);

  const openEditModal = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setCourierName(shipment.courier_name || COURIER_OPTIONS[0]);
    setTrackingNumber(shipment.tracking_number || '');
    setStatus(shipment.status || 'packing_pending');
    setDeliveryNotes(shipment.delivery_notes || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    try {
      setSaving(true);
      const res = await fetch('/api/admin/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: editingShipment.order_id,
          courier_name: courierName,
          tracking_number: trackingNumber,
          status,
          delivery_notes: deliveryNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingShipment(null);
        fetchShipping();
      } else {
        alert(data.error || 'Failed to update tracking');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating shipment');
    } finally {
      setSaving(false);
    }
  };

  const filteredShipments = shipments.filter(
    s =>
      s.order_id.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.college_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.tracking_number && s.tracking_number.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingCount = shipments.filter(s => s.status === 'packing_pending').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit' || s.status === 'dispatched').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">
                Shipping & Courier Logistics
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Dispatch management, tracking numbers, and delivery confirmation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search order or tracking #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={fetchShipping}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Pending Packing</span>
          <div className="text-2xl font-black font-heading text-amber-600 flex items-center justify-between">
            <span>{pendingCount} orders</span>
            <Package className="w-6 h-6 text-amber-500 opacity-80" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">In warehouse packing queue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">In Transit with Courier</span>
          <div className="text-2xl font-black font-heading text-indigo-600 flex items-center justify-between">
            <span>{inTransitCount} shipments</span>
            <Truck className="w-6 h-6 text-indigo-500 opacity-80" />
          </div>
          <span className="text-xs text-indigo-600 font-semibold">Tracking numbers active</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Successfully Delivered</span>
          <div className="text-2xl font-black font-heading text-emerald-600 flex items-center justify-between">
            <span>{deliveredCount} completed</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
          </div>
          <span className="text-xs text-emerald-600 font-semibold">Received by coordinators</span>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
              <tr>
                <th className="p-3.5">Order ID & College</th>
                <th className="p-3.5">Recipient & Delivery Address</th>
                <th className="p-3.5 text-center">T-Shirts</th>
                <th className="p-3.5">Courier & Tracking</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(s => {
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-3.5">
                        <Link
                          href={`/admin/orders/${s.order_id}`}
                          className="font-mono font-bold text-orange-600 hover:underline flex items-center gap-1"
                        >
                          {s.order_id}
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </Link>
                        <div className="font-bold text-zinc-900 mt-0.5">{s.college_name}</div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-zinc-800">{s.customer_name} ({s.phone})</div>
                        <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          {s.delivery_address || 'Address pending'}
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-black font-mono text-zinc-900">
                        {s.total_tshirts} pcs
                        <div className="text-[10px] text-zinc-400 font-normal">{s.packages_count} box(es)</div>
                      </td>

                      <td className="p-3.5">
                        {s.tracking_number ? (
                          <div>
                            <span className="font-bold text-zinc-800 block">{s.courier_name}</span>
                            <span className="font-mono text-indigo-600 font-bold text-[11px]">
                              {s.tracking_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Awaiting courier dispatch</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : s.status === 'in_transit' || s.status === 'dispatched'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openEditModal(s)}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#D9531E] font-bold text-xs border border-orange-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Update Tracking
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tracking Modal */}
      {editingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-black font-heading text-lg text-zinc-900">Update Courier & Tracking</h3>
                <p className="text-xs text-zinc-500 font-medium font-mono">{editingShipment.order_id}</p>
              </div>
              <button
                onClick={() => setEditingShipment(null)}
                className="p-1 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Courier Partner</label>
                <select
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {COURIER_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Tracking / AWB Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. D102938475"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Shipment Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="packing_pending">Packing Pending</option>
                  <option value="packed">Packed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out For Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Delivery Notes / Handover Details</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Picked up by Hyderabad central hub..."
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
