'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Palette,
  Factory,
  CreditCard
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@jkempress.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      // Persist in localStorage and session cookie
      localStorage.setItem('jkempress_admin_user', JSON.stringify(data.user));
      if (data.token) {
        document.cookie = `jkempress_admin_session=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect') || '/admin';
      router.refresh();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@jkempress.com');
    setPassword('12345678');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & Admin System Highlights */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JK EMPRESS MANAGEMENT SYSTEM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              Admin Portal
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Complete business operations for batch orders, personalized college farewell t-shirts, DTF print generation, and customer manifests.
            </p>
          </div>

          {/* Key Admin Pillars */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm space-y-2 text-xs">
              <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Single Master Administrator Access</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Full administrative authority over orders, customers, personalized print graphics, and financial records.
              </p>
            </div>

            {/* Quick Fill Button */}
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full p-3 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/80 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-700 dark:text-orange-300">Quick-Fill Admin Credentials</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800 text-orange-600">
                  Click to Fill
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                admin@jkempress.com · pass: 12345678
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="md:col-span-7">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-950/5">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold font-heading">Sign In to Dashboard</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Enter authorized credentials to continue</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black">
                JK
              </div>
            </div>

            {/* Credentials Callout */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Admin Credentials:</span>
                  <span className="ml-1 text-zinc-600 dark:text-zinc-400">admin@jkempress.com</span>
                </div>
              </div>
              <div className="font-mono font-bold bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-orange-600 dark:text-orange-400">
                12345678
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@jkempress.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-800 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Secure SSL · Role Based Access</span>
              <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                ← Back to Customer Website
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold font-heading">Reset Administrator Password</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enter your registered staff email to receive secure password recovery instructions.
            </p>

            {resetSuccess ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Reset link dispatched!
                </div>
                <p>Instructions have been delivered to your email. Check your inbox.</p>
              </div>
            ) : (
              <div className="my-4 space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@jkempress.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setForgotModal(false); setResetSuccess(false); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              {!resetSuccess && (
                <button
                  type="button"
                  onClick={() => setResetSuccess(true)}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
                >
                  Send Recovery Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
