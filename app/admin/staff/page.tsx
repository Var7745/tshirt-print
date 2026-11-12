'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  Lock,
  UserCheck,
  Activity,
} from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'suspended';
  created_at: string;
  last_login_at?: string;
}

interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

const ROLES = ['Admin', 'Manager', 'Production Staff', 'Designer', 'Finance'];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'audit'>('team');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Production Staff');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success && data.data) {
        setStaff(data.data.staff || []);
        setLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          phone,
          password: password || 'JkStaff@2027#Secure',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        fetchStaff();
      } else {
        alert(data.error || 'Failed to add staff member');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating staff');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight">
                Staff & Team Management
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Admin users, role assignments, and security audit logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>

          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Active Team ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Security Audit Logs ({logs.length})
        </button>
      </div>

      {/* Tab 1: Team Members */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search team member by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-72"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
                  <tr>
                    <th className="p-3.5">Team Member</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5 text-center">Assigned Role</th>
                    <th className="p-3.5 text-center">Account Status</th>
                    <th className="p-3.5">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400">
                        No team members found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(s => (
                      <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover border border-zinc-200"
                            />
                            <div>
                              <div className="font-bold text-zinc-900">{s.name}</div>
                              <span className="font-mono text-[10px] text-zinc-400">{s.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            {s.email}
                          </div>
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-0.5">
                              <Phone className="w-3 h-3" />
                              {s.phone}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              s.role === 'Admin' || s.role === 'Super Admin'
                                ? 'bg-orange-50 text-[#D9531E] border-orange-200'
                                : s.role === 'Production Staff'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : s.role === 'Finance'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {s.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-zinc-500 font-mono text-[11px]">
                          {s.last_login_at ? new Date(s.last_login_at).toLocaleString() : 'Never logged in'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 font-black font-heading text-sm text-zinc-800">
            Recent System & Security Actions
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5 font-mono">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-50/60">
                      <td className="p-3.5 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-zinc-900 whitespace-nowrap">
                        {log.user_name} ({log.user_role})
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-600 max-w-md">
                        {log.details}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-black font-heading text-lg text-zinc-900">Add Team Member</h3>
                <p className="text-xs text-zinc-500 font-medium">Create staff account with role permissions</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="suresh@jkempress.com"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98490 00000"
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank for secure auto-generated password"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
