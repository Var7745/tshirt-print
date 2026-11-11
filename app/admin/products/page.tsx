'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Sparkles,
  Tag,
  CheckCircle2,
  Package,
  X
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Signature Day',
    price: 150,
    description: '',
    fabric: '100% Bio-Washed Cotton (220 GSM)',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80'
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = editingProduct ? { ...form, id: editingProduct.id } : form;
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      description: p.description || '',
      fabric: p.fabric || '100% Bio-Washed Cotton (220 GSM)',
      image_url: p.image_url || ''
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Product Catalog & Pricing Tiers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Module 7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage institutional batch packages, custom apparel lines, bundle add-ons (Marker &amp; Shades), and base price rules.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setForm({
              name: '',
              sku: `JK-${Math.floor(1000 + Math.random() * 9000)}`,
              category: 'Signature Day',
              price: 150,
              description: '',
              fabric: '100% Bio-Washed Cotton (220 GSM)',
              image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80'
            });
            setModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product Tier</span>
        </button>
      </div>

      {/* Featured Pricing Packages Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-orange-600">
          <Sparkles className="w-4 h-4" />
          <span>OFFICIAL JK EMPRESS 2026 PRICING SLABS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
            <div className="font-extrabold text-orange-600 text-base">₹130 Tier</div>
            <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">T-Shirt + Marker</div>
            <div className="text-[11px] text-zinc-400">Essential signature package with permanent fabric marker.</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-300 dark:border-zinc-800 shadow-sm">
            <div className="font-extrabold text-orange-600 text-base">₹150 Tier (Most Popular)</div>
            <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">T-Shirt + Marker + Shades</div>
            <div className="text-[11px] text-zinc-400">Complete farewell combo with UV shades and marker.</div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
            <div className="font-extrabold text-orange-600 text-base">₹200 Tier (Premium)</div>
            <div className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">Tee + Photo Frame + Marker + Shades</div>
            <div className="text-[11px] text-zinc-400">Deluxe keepsake package with framed batch memories.</div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading catalog...</p>
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white font-mono font-black text-sm">
                  ₹{p.price}
                </div>
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-orange-600 text-white font-mono text-[10px] font-bold">
                  {p.sku}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{p.category}</div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{p.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between">
                  <span>Fabric:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{p.fabric}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sizes:</span>
                  <span className="font-mono font-bold">XS, S, M, L, XL, XXL, 3XL</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => openEdit(p)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold font-heading">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Signature Day Tee + Shades Combo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Price Per T-Shirt (INR) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                >
                  <option value="Signature Day">Signature Day</option>
                  <option value="College Farewell">College Farewell</option>
                  <option value="Batch T-Shirts">Batch T-Shirts</option>
                  <option value="College Fest">College Fest</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Fabric Specification</label>
                <input
                  type="text"
                  value={form.fabric}
                  onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
