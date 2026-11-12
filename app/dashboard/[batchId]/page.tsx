'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Users,
  Image as ImageIcon,
  Tag,
  Grid,
  Plus,
  Trash2,
  Table,
  Eye,
  MessageCircle,
  QrCode,
  CheckCircle2,
  Shirt,
  Sparkles
} from 'lucide-react';
import TshirtMockup from '@/components/TshirtMockup';
import { getBatchById, saveBatch, BatchData, Member, SAMPLE_AVATARS } from '@/lib/store';

export default function BatchDashboardPage() {
  const params = useParams();
  const batchId = params?.batchId as string;

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'roster' | 'preview'>('roster');

  // Manual Add Member state
  const [newMemberName, setNewMemberName] = useState('');
  const [newJerseyName, setNewJerseyName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newSize, setNewSize] = useState<Member['size']>('M');

  useEffect(() => {
    if (batchId) {
      const data = getBatchById(batchId);
      if (data) setBatch(data);
    }
  }, [batchId]);

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#D9531E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-600 text-sm font-semibold">Loading batch dashboard...</p>
        </div>
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${batch.id}`
    : `https://jkimpress.store/join/${batch.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `🎓 *Batch Photo T-Shirt Alert by JK IMPRESS*\n\nHey everyone! We are collecting our photos and sizes for our ${batch.collegeName} (${batch.courseSection}) Class of ${batch.graduatingYear} farewell t-shirts.\n\n👉 Click this link to upload your photo & pick your size:\n${joinUrl}\n\nPlease submit today so we can finalize the print!\n\n✨ JK IMPRESS — Make Your Mark`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Export CSV
  const exportCSV = () => {
    if (!batch.members || batch.members.length === 0) {
      alert('No members have joined yet to export.');
      return;
    }
    const headers = 'ID,Full Name,Jersey Name,Roll Number,Size,Status,Joined At\n';
    const rows = batch.members
      .map(
        (m) =>
          `"${m.id}","${m.fullName}","${m.jerseyName}","${m.rollNumber}","${m.size}","${m.status}","${m.joinedAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.courseSection}_tshirt_roster.csv`;
    a.click();
  };

  // Manual Member Add
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const randomAvatar = SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)];
    const member: Member = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      fullName: newMemberName,
      jerseyName: (newJerseyName || newMemberName).toUpperCase(),
      rollNumber: newRollNo || '00',
      size: newSize,
      photoUrl: randomAvatar,
      joinedAt: 'Just now',
      status: 'confirmed',
    };

    const updatedBatch = {
      ...batch,
      members: [member, ...batch.members],
    };
    setBatch(updatedBatch);
    saveBatch(updatedBatch);

    setNewMemberName('');
    setNewJerseyName('');
    setNewRollNo('');
    setAddMemberModalOpen(false);
  };

  // Delete Member
  const handleDeleteMember = (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    const updatedBatch = {
      ...batch,
      members: batch.members.filter((m) => m.id !== memberId),
    };
    setBatch(updatedBatch);
    saveBatch(updatedBatch);
  };

  const membersCount = batch.members?.length || 0;
  const photosCount = batch.members?.filter((m) => !!m.photoUrl).length || 0;
  const sizesCount = batch.members?.filter((m) => !!m.size).length || 0;

  // Size breakdown
  const sizeBreakdown = (batch.members || []).reduce((acc, m) => {
    acc[m.size] = (acc[m.size] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Sidebar (Matches Screenshot 4) */}
      <aside className="w-64 bg-white border-r border-[#EBE4D8] hidden lg:flex flex-col justify-between p-6">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-amber-500/20 bg-[#1A1613] flex-shrink-0">
              <img
                src="/jk-impress-logo.jpg"
                alt="JK IMPRESS"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-[#1A1613] block leading-none">
                JK IMPRESS
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#C49746] uppercase">
                MAKE YOUR MARK
              </span>
            </div>
          </Link>

          <nav className="space-y-1">
            <Link
              href="/batches"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <Users className="w-4 h-4 text-stone-400" />
              My batches
            </Link>

            <Link
              href="/create"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#D9531E] hover:bg-orange-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Batch
            </Link>
          </nav>
        </div>

        <div className="border-t border-stone-200 pt-4">
          <div className="text-xs text-stone-400 mb-1">Signed in as</div>
          <div className="text-sm font-bold text-stone-900 truncate">
            {batch.email || 'organizer@batch'}
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 mt-2 block"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                {batch.collegeName} – {batch.courseSection}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-semibold text-stone-500">
                  Class of {batch.graduatingYear}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Collecting photos
                </span>
              </div>
            </div>

            {/* Actions: Share & Join Page */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-stone-300 text-stone-800 font-bold text-sm shadow-xs hover:bg-stone-50 transition-all"
              >
                <Share2 className="w-4 h-4 text-stone-600" />
                Share
              </button>

              <Link
                href={`/join/${batch.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1A1613] hover:bg-[#2C2723] text-white font-bold text-sm shadow-sm transition-all"
              >
                <Eye className="w-4 h-4 text-[#D9531E]" />
                Join Page
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards (Matching Screenshot 4 & 5) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Joined */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                JOINED
              </span>
              <div className="text-3xl font-black text-stone-900 mt-1 font-mono">
                {membersCount}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                people
              </span>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                PHOTOS
              </span>
              <div className="text-3xl font-black text-stone-900 mt-1 font-mono">
                {photosCount}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                of {membersCount} members
              </span>
            </div>

            {/* Sizes */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                SIZES
              </span>
              <div className="text-3xl font-black text-stone-900 mt-1 font-mono">
                {sizesCount}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                of {membersCount} members
              </span>
            </div>

            {/* Layout */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                LAYOUT
              </span>
              <div className="text-2xl font-black text-stone-900 mt-1 capitalize truncate">
                {batch.collageShape}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                grid
              </span>
            </div>

          </div>

          {/* Size distribution badge row */}
          {membersCount > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-stone-600">Size Breakdown:</span>
              {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 font-semibold"
                >
                  {s}: <strong>{sizeBreakdown[s] || 0}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Main Grid: Roster List & Live Grid Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Roster Section (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                    ROSTER
                  </span>
                  <h2 className="text-xl font-black text-stone-900">
                    Members ({membersCount})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMemberModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#D9531E] border border-orange-200 font-bold text-xs hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Member
                  </button>

                  <button
                    type="button"
                    onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>

              {/* Empty state or Table */}
              {membersCount === 0 ? (
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      No members yet
                    </h3>
                    <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                      Share this link with your batch — they&apos;ll join in seconds.
                    </p>
                  </div>

                  {/* Share link input */}
                  <div className="flex items-center gap-2 max-w-md mx-auto pt-2">
                    <input
                      type="text"
                      readOnly
                      value={joinUrl}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-4 py-2.5 rounded-xl bg-[#1A1613] hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShareModalOpen(true)}
                      className="text-xs font-bold text-[#D9531E] hover:underline"
                    >
                      More share options →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider font-bold border-b border-stone-200">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Jersey Name</th>
                          <th className="px-4 py-3">Roll No</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {batch.members.map((member) => (
                          <tr key={member.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2.5">
                              <img
                                src={member.photoUrl || SAMPLE_AVATARS[0]}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-stone-200"
                              />
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  {member.fullName}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  {member.joinedAt}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-stone-800 uppercase">
                              {member.jerseyName}
                            </td>
                            <td className="px-4 py-3 font-mono font-extrabold text-[#D9531E]">
                              #{member.rollNumber}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-extrabold text-stone-700">
                                {member.size}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Live Grid Preview Section (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                  LIVE
                </span>
                <h2 className="text-xl font-black text-stone-900">
                  Grid preview
                </h2>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
                <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-stone-200 mb-4">
                  <TshirtMockup
                    shape={batch.collageShape}
                    peopleCount={batch.members?.length > 0 ? batch.members.length : (batch.expectedMembers || 25)}
                    jerseyName={batch.members[0]?.jerseyName || 'NEHA'}
                    rollNumber={batch.members[0]?.rollNumber || '021'}
                    collegeName={batch.collegeName}
                    courseSection={batch.courseSection}
                    graduatingYear={batch.graduatingYear}
                    membersPhotos={batch.members.map((m) => m.photoUrl).filter(Boolean)}
                    viewMode="both"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Batch Pack:</span>
                    <strong className="text-stone-900 capitalize">{batch.pack} (₹{batch.packPrice}/tee)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Collage Shape:</span>
                    <strong className="text-stone-900 capitalize">{batch.collageShape}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Print Status:</span>
                    <strong className="text-amber-700 capitalize">Collecting Photos</strong>
                  </div>
                </div>

                {/* Quick Share action button */}
                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                  <button
                    type="button"
                    onClick={shareToWhatsApp}
                    className="flex-1 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                    Share to WhatsApp
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Share Modal Dialog */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-stone-900">
                  Share Batch Invite Link
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Send this link to your class group. Anyone with the link can join.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* WhatsApp 1-Click Button */}
            <button
              type="button"
              onClick={shareToWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all hover:scale-[1.01]"
            >
              <MessageCircle className="w-5 h-5 fill-white stroke-none" />
              Share to Class WhatsApp Group
            </button>

            {/* Direct Copy */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Direct Invite URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono select-all text-stone-800"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-4 py-2.5 bg-[#1A1613] hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Member Add Modal */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMember}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-stone-900">
                  Add Member Manually
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  For students who requested the organizer to fill their details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Neha Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Jersey Name
                  </label>
                  <input
                    type="text"
                    value={newJerseyName}
                    onChange={(e) => setNewJerseyName(e.target.value)}
                    placeholder="e.g. NEHA"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200 text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={newRollNo}
                    onChange={(e) => setNewRollNo(e.target.value)}
                    placeholder="e.g. 021"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  T-Shirt Size
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['S', 'M', 'L', 'XL', '2XL'] as Member['size'][]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewSize(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        newSize === s
                          ? 'bg-[#1A1613] text-white border-[#1A1613]'
                          : 'bg-[#FAF7F2] text-stone-700 border-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#1A1613] hover:bg-black text-white font-bold text-xs"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
