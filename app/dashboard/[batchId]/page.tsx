'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  Camera,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'roster' | 'photos' | 'preview'>('roster');

  // Real-time polling & synchronization state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const prevCountRef = useRef<{ members: number; photos: number }>({ members: 0, photos: 0 });

  // Photo gallery filter
  const [photoFilter, setPhotoFilter] = useState<'all' | 'uploaded' | 'pending'>('all');

  // Manual Add Member state
  const [newMemberName, setNewMemberName] = useState('');
  const [newJerseyName, setNewJerseyName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newSize, setNewSize] = useState<Member['size']>('M');

  // Standardized sizes: No XS, includes XXXL
  const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const fetchLiveBatch = (isBackground = false) => {
    if (!batchId) return;
    if (!isBackground) setIsRefreshing(true);

    // Call API with view=creator to receive all uploaded photos & bypass browser cache
    fetch(`/api/batches/${batchId}?view=creator&_t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batch) {
          const newBatch = data.batch;
          const membersList = newBatch.members || [];
          const newMembersCount = membersList.length;
          const newPhotosCount = membersList.filter((m: any) => Boolean(m.photoUrl)).length;

          // Real-time alert on new arrivals
          if (prevCountRef.current.members > 0) {
            if (newPhotosCount > prevCountRef.current.photos) {
              const latestWithPhoto = [...membersList].reverse().find((m: any) => Boolean(m.photoUrl));
              setLiveAlert(`📸 New photo received from ${latestWithPhoto?.fullName || 'a student'}!`);
              setTimeout(() => setLiveAlert(null), 5000);
            } else if (newMembersCount > prevCountRef.current.members) {
              const latestMember = membersList[membersList.length - 1];
              setLiveAlert(`🎓 ${latestMember?.fullName || 'New student'} joined the batch!`);
              setTimeout(() => setLiveAlert(null), 5000);
            }
          }
          prevCountRef.current = { members: newMembersCount, photos: newPhotosCount };

          setBatch(newBatch);
          setLastSyncedAt(new Date());
        } else {
          const fallback = getBatchById(batchId);
          if (fallback) setBatch(fallback);
        }
      })
      .catch(() => {
        const fallback = getBatchById(batchId);
        if (fallback) setBatch(fallback);
      })
      .finally(() => {
        if (!isBackground) setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchLiveBatch();
    // Real-time synchronization interval: auto-polls every 3.5 seconds
    const interval = setInterval(() => {
      fetchLiveBatch(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [batchId]);

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#D9531E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-600 text-sm font-semibold">Connecting to live batch updates...</p>
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
    const headers = 'ID,Full Name,Jersey Name,Roll Number,Size,Status,Photo Uploaded,Joined At\n';
    const rows = batch.members
      .map(
        (m) =>
          `"${m.id}","${m.fullName}","${m.jerseyName}","${m.rollNumber}","${m.size}","${m.status}","${m.photoUrl ? 'YES' : 'NO'}","${m.joinedAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.courseSection}_tshirt_roster.csv`;
    a.click();
  };

  // Manual Member Add with backend persistence
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const jName = (newJerseyName || newMemberName.split(' ')[0]).toUpperCase().trim();
    const roll = newRollNo.trim() || String((batch.members?.length || 0) + 1).padStart(2, '0');
    const randomAvatar = SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)];

    try {
      const res = await fetch(`/api/batches/${batch.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newMemberName.trim(),
          jerseyName: jName,
          rollNumber: roll,
          size: newSize,
          photoUrl: randomAvatar,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to add member');
        return;
      }
      fetchLiveBatch();
      setNewMemberName('');
      setNewJerseyName('');
      setNewRollNo('');
      setAddMemberModalOpen(false);
    } catch {
      // Fallback local update
      const member: Member = {
        id: 'm_' + Math.random().toString(36).substring(2, 9),
        fullName: newMemberName,
        jerseyName: jName,
        rollNumber: roll,
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
    }
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
  const photosCount = batch.members?.filter((m) => Boolean(m.photoUrl)).length || 0;
  const sizesCount = batch.members?.filter((m) => Boolean(m.size)).length || 0;

  // Normalized Size breakdown (S, M, L, XL, XXL, XXXL)
  const sizeBreakdown = (batch.members || []).reduce((acc, m) => {
    let s = (m.size || 'M').toUpperCase();
    if (s === '2XL') s = 'XXL';
    if (s === '3XL') s = 'XXXL';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter members for Photo Gallery tab
  const filteredPhotoMembers = (batch.members || []).filter((m) => {
    if (photoFilter === 'uploaded') return Boolean(m.photoUrl);
    if (photoFilter === 'pending') return !m.photoUrl;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Sidebar */}
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
        
        {/* Real-time Toast Alert */}
        {liveAlert && (
          <div className="sticky top-0 z-40 bg-emerald-600 text-white px-4 py-2.5 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
            <span>{liveAlert}</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Top Bar with Real-Time Indicator & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#8C461E] bg-[#F3ECE1] px-3 py-1 rounded-full border border-[#E5DAC8]">
                  {batch.courseSection} • CLASS OF {batch.graduatingYear}
                </div>
                {/* Real-Time Live Sync Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Sync (Auto-Updating)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
                {batch.collegeName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLiveBatch(false)}
                title="Force refresh data"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-stone-300 text-stone-800 font-bold text-xs shadow-xs hover:bg-stone-50 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                Share Link
              </button>

              <Link
                href={`/join/${batch.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1A1613] hover:bg-[#2C2723] text-white font-bold text-xs shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C49746]" />
                Join Page
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
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
                of {batch.expectedMembers || membersCount} students
              </span>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                PHOTOS UPLOADED
              </span>
              <div className="text-3xl font-black text-[#D9531E] mt-1 font-mono">
                {photosCount}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                {membersCount > 0 ? `${Math.round((photosCount / membersCount) * 100)}% completed` : '0%'}
              </span>
            </div>

            {/* Sizes */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                SIZES CONFIRMED
              </span>
              <div className="text-3xl font-black text-stone-900 mt-1 font-mono">
                {sizesCount}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                garments selected
              </span>
            </div>

            {/* Layout */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
                PRINT MOSAIC
              </span>
              <div className="text-2xl font-black text-stone-900 mt-1 capitalize truncate">
                {batch.collageShape}
              </div>
              <span className="text-xs text-stone-500 mt-1 block">
                front center pattern
              </span>
            </div>
          </div>

          {/* Size distribution badge row (Standardized S to XXXL, No XS) */}
          {membersCount > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-stone-600">Garment Breakdown:</span>
              {AVAILABLE_SIZES.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 font-semibold"
                >
                  {s}: <strong>{sizeBreakdown[s] || 0}</strong>
                </span>
              ))}
            </div>
          )}

          {/* View Tab Selector: Roster vs Uploaded Photos vs T-Shirt Preview */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <button
              onClick={() => setActiveTab('roster')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roster'
                  ? 'bg-[#1A1613] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Roster Table ({membersCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'photos'
                  ? 'bg-[#D9531E] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Uploaded Photos ({photosCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#1A1613] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live T-Shirt Mockup</span>
            </button>
          </div>

          {/* TAB 1: Roster Table View */}
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Roster Section (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-stone-900">
                      Class Roster ({membersCount})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Live student responses submitted through your batch link.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMemberModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#D9531E] border border-orange-200 font-bold text-xs hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Member
                    </button>

                    <button
                      type="button"
                      onClick={exportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {membersCount === 0 ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/80 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">
                        No members joined yet
                      </h3>
                      <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                        Share this link with your classmates — they can submit their photo and size in seconds.
                      </p>
                    </div>

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
                        className="px-4 py-2.5 rounded-xl bg-[#1A1613] hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider font-bold border-b border-stone-200">
                          <tr>
                            <th className="px-4 py-3">Member & Photo</th>
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
                                {member.photoUrl ? (
                                  <img
                                    src={member.photoUrl}
                                    alt=""
                                    className="w-9 h-9 rounded-xl object-cover border border-stone-300 shadow-2xs"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-[10px]">
                                    PENDING
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-stone-900 block">
                                    {member.fullName}
                                  </span>
                                  <span className="text-[10px] text-stone-400">
                                    {member.photoUrl ? '✓ Photo submitted' : 'Photo pending'}
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
                                <span className="px-2.5 py-1 rounded-md bg-stone-100 font-extrabold text-stone-800">
                                  {member.size}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
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
                  <h2 className="text-xl font-black text-stone-900">
                    Garment Preview
                  </h2>
                  <p className="text-xs text-stone-500">
                    Real-time front mosaic rendered with received photos.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
                  <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-stone-200 mb-4">
                    <TshirtMockup
                      shape={batch.collageShape}
                      peopleCount={batch.members?.length > 0 ? batch.members.length : (batch.expectedMembers || 25)}
                      jerseyName={batch.members[0]?.jerseyName || 'MEMBER'}
                      rollNumber={batch.members[0]?.rollNumber || '01'}
                      collegeName={batch.collegeName}
                      courseSection={batch.courseSection}
                      graduatingYear={batch.graduatingYear}
                      membersPhotos={batch.members.map((m) => m.photoUrl).filter(Boolean)}
                      viewMode="both"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={shareToWhatsApp}
                    className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                    Share Invite to WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Uploaded Photos Gallery (Batch Creator Gets All Photos) */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#D9531E]" />
                    Uploaded Student Photo Gallery ({photosCount} of {membersCount})
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    As the batch creator, you can view, review, and download every student photo submitted using your link.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setPhotoFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      photoFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    All ({membersCount})
                  </button>
                  <button
                    onClick={() => setPhotoFilter('uploaded')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      photoFilter === 'uploaded' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Photos Uploaded ({photosCount})
                  </button>
                  <button
                    onClick={() => setPhotoFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      photoFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Pending ({membersCount - photosCount})
                  </button>
                </div>
              </div>

              {filteredPhotoMembers.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                  <Camera className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700">No photos match the selected filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPhotoMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-[#D9531E] transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-1 opacity-70" />
                            <span className="text-[11px] font-bold text-amber-700 block">Photo Pending</span>
                          </div>
                        )}

                        {/* Size Badge */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-900 text-white shadow-xs">
                            {member.size}
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black text-stone-900 truncate">
                            {member.fullName}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#D9531E]">
                            #{member.rollNumber}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          Jersey: {member.jerseyName}
                        </div>

                        {member.photoUrl && (
                          <a
                            href={member.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`${member.rollNumber}_${member.jerseyName}.jpg`}
                            className="mt-2.5 w-full py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Photo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Full Size Mockup View */}
          {activeTab === 'preview' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs max-w-4xl mx-auto">
              <div className="text-center max-w-md mx-auto mb-6">
                <h2 className="text-2xl font-black text-stone-900">
                  Full Memorial T-Shirt Mockup
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Preview how the batch collage looks with current classmate submissions.
                </p>
              </div>

              <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-stone-200">
                <TshirtMockup
                  shape={batch.collageShape}
                  peopleCount={batch.members?.length > 0 ? batch.members.length : (batch.expectedMembers || 25)}
                  jerseyName={batch.members[0]?.jerseyName || 'CLASS LEAD'}
                  rollNumber={batch.members[0]?.rollNumber || '01'}
                  collegeName={batch.collegeName}
                  courseSection={batch.courseSection}
                  graduatingYear={batch.graduatingYear}
                  membersPhotos={batch.members.map((m) => m.photoUrl).filter(Boolean)}
                  viewMode="both"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Share Modal Dialog */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-stone-900">
                  Share Batch Invite Link
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Send this link to your batch WhatsApp group or classmates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={shareToWhatsApp}
                className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white stroke-none" />
                Share Directly to WhatsApp
              </button>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono select-all text-stone-800"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-4 py-2.5 bg-[#1A1613] hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
                className="text-xs font-bold text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Member Add Modal (Standardized S to XXXL) */}
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
                  For students who requested the organizer to enter their size & details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
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
                  T-Shirt Size (No XS • Includes XXXL)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVAILABLE_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewSize(s as Member['size'])}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newSize === s
                          ? 'bg-[#1A1613] text-white border-[#1A1613]'
                          : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#D9531E] hover:bg-[#BF4314] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
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
