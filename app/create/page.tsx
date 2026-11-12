'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Grid, 
  Hexagon, 
  Layers, 
  Zap, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Image as ImageIcon,
  Circle,
  Square as SquareIcon,
  RectangleHorizontal,
  Diamond,
  Camera
} from 'lucide-react';
import TshirtMockup from '@/components/TshirtMockup';
import CollagePattern, { CollageShapeType } from '@/components/CollagePattern';
import { saveBatch, BatchData } from '@/lib/store';

const POPULAR_COLLEGES = [
  'A K P S GOVT JR College - O4380, West Godavari',
  'IIT Bombay - Indian Institute of Technology',
  'IIT Delhi - Indian Institute of Technology',
  'BITS Pilani - Hyderabad Campus',
  'SRM Institute of Science and Technology, Chennai',
  'VIT Vellore - Vellore Institute of Technology',
  'Delhi University - St. Stephen\'s College',
  'Christ University, Bangalore',
  'JNTU Hyderabad - College of Engineering',
  'Manipal Institute of Technology (MIT)',
  'PSG College of Technology, Coimbatore',
  'St. Xavier\'s College, Mumbai',
];

function CreateBatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Batch Info
  const [collegeName, setCollegeName] = useState('A K P S GOVT JR College - O4380, West Godavari');
  const [courseSection, setCourseSection] = useState('ECE-B');
  const [graduatingYear, setGraduatingYear] = useState(2027);
  const [durationYears, setDurationYears] = useState(4);
  const startYear = graduatingYear - durationYears;

  // Step 2: Contact
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Pack
  const initialPack = (searchParams.get('pack') as 'basic' | 'salina' | 'top') || 'salina';
  const [pack, setPack] = useState<'basic' | 'salina' | 'top'>(initialPack);
  const [isExpress, setIsExpress] = useState(false);

  // Step 4: Design
  const [collageShape, setCollageShape] = useState<CollageShapeType>('honeycomb');
  const [backTemplate, setBackTemplate] = useState<'jersey' | 'varsity' | 'minimal'>('jersey');
  const [rollDigits, setRollDigits] = useState<number>(3);
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);

  // Preview Slider
  const [peopleCount, setPeopleCount] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'both' | 'card'>('both');

  // Price Calculation
  const basePackPrice = pack === 'top' ? 200 : pack === 'salina' ? 150 : 130;
  const perPersonPrice = isExpress ? Math.round(basePackPrice * 1.2) : basePackPrice;
  const totalEstimated = perPersonPrice * peopleCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !courseSection.trim()) {
      alert('Please fill in your College Name and Course/Section.');
      return;
    }

    setIsSubmitting(true);

    const batchId = 'b' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);
    
    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ];

    const initialMembers = Array.from({ length: peopleCount }).map((_, i) => ({
      id: `m_${i + 1}`,
      fullName: i === 0 ? (email ? email.split('@')[0] : 'Batch Coordinator') : `Classmate ${i + 1}`,
      jerseyName: i === 0 ? (email ? email.split('@')[0].toUpperCase() : 'LEAD') : `MEMBER ${i + 1}`,
      rollNumber: String(i + 1).padStart(2, '0'),
      size: (i % 3 === 0 ? 'L' : i % 2 === 0 ? 'S' : 'M') as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL',
      photoUrl: sampleAvatars[i % sampleAvatars.length],
      joinedAt: 'Just now',
      status: 'confirmed' as const,
    }));

    const newBatch: BatchData = {
      id: batchId,
      collegeName,
      courseSection,
      graduatingYear,
      durationYears,
      startYear,
      email: email || 'organizer@batch.edu',
      phone: phone || '+91 98765 00000',
      pack,
      packPrice: perPersonPrice,
      isExpress,
      collageShape,
      backTemplate,
      rollDigits,
      includeLogo,
      expectedMembers: peopleCount,
      createdAt: new Date().toISOString(),
      status: 'collecting',
      members: initialMembers,
    };

    saveBatch(newBatch);

    // Sync to SQLite Database in background via secured public order submission endpoint
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: email ? email.split('@')[0] : 'Batch Coordinator',
        phone: phone || '+91 98765 00000',
        email: email || undefined,
        college_name: collegeName,
        department: courseSection,
        batch: `Class of ${graduatingYear}`,
        event_name: `${courseSection} Graduation Batch`,
        event_category: 'Batch T-Shirts',
        participants_count: peopleCount,
        tshirts_count: peopleCount,
        price_per_tshirt: perPersonPrice,
        advance_amount: Math.round(totalEstimated * 0.5),
        collage_shape: collageShape,
        back_template: backTemplate,
        pack_name: pack,
        production_status: 'photos_uploading',
        batch_id: batchId
      })
    }).catch((err) => console.error('Silent sync to db error', err));

    setTimeout(() => {
      router.push(`/dashboard/${batchId}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* Top Header Bar */}
      <header className="border-b border-[#EBE4D8] bg-[#FAF7F2]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <img
              src="/jk-impress-logo.jpg"
              alt="JK IMPRESS"
              className="w-7 h-7 rounded-lg object-cover border border-amber-500/20"
            />
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-[#1A1613]">
              JK IMPRESS
            </span>
          </Link>

          <Link
            href="/batches"
            className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            My batches →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#8C461E] bg-[#F3ECE1] px-3.5 py-1 rounded-full border border-[#E5DAC8] mb-2">
            SIGNATURE DAY CELEBRATION
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1613] tracking-tight">
            Let&apos;s print your Signature Day memories.
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-1">
            Fill these once, share the link with your class, and we&apos;ll ship the shirts with permanent fabric markers for signing.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Steps Column (Form) */}
            <div className="lg:col-span-7 space-y-6">

              {/* STEP 1: About your batch */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-800 font-black text-sm flex items-center justify-center border border-stone-200 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-stone-900">
                      About your batch
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Who you are and when you graduate.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* College Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      College Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="Search or type your college..."
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40 focus:border-[#D9531E] transition-all"
                        list="college-list"
                      />
                      <datalist id="college-list">
                        {POPULAR_COLLEGES.map((c, i) => (
                          <option key={i} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Course / Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Course / Section *
                    </label>
                    <input
                      type="text"
                      required
                      value={courseSection}
                      onChange={(e) => setCourseSection(e.target.value)}
                      placeholder="e.g., ECE-B or CSE-Core"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40 focus:border-[#D9531E] transition-all"
                    />
                  </div>

                  {/* Graduating Year & Course Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Graduating Year *
                      </label>
                      <input
                        type="number"
                        min="2020"
                        max="2035"
                        value={graduatingYear}
                        onChange={(e) => setGraduatingYear(parseInt(e.target.value) || 2027)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Course Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 4, 5].map((yrs) => (
                          <button
                            key={yrs}
                            type="button"
                            onClick={() => setDurationYears(yrs)}
                            className={`py-3 rounded-2xl text-xs font-extrabold border transition-all ${
                              durationYears === yrs
                                ? 'bg-[#1A1613] text-white border-[#1A1613]'
                                : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {yrs} yr
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Computed Batch badge */}
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                    <Calendar className="w-3.5 h-3.5 text-[#D9531E]" />
                    <span>Batch: {startYear} - {graduatingYear}</span>
                  </div>
                </div>
              </div>

              {/* STEP 2: Contact */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-800 font-black text-sm flex items-center justify-center border border-stone-200 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-stone-900">
                      Contact
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Use this email and phone number to retrieve your batch anytime and track its progress.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Phone / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: Pick a pack */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-800 font-black text-sm flex items-center justify-center border border-stone-200 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-stone-900">
                      Pick a pack
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      All-in per-person price. No hidden fees.
                    </p>
                  </div>
                </div>

                {/* 3 Pack Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* BASIC */}
                  <button
                    type="button"
                    onClick={() => setPack('basic')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all relative ${
                      pack === 'basic'
                        ? 'border-[#D9531E] bg-orange-50/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-[#FAF7F2]'
                    }`}
                  >
                    {pack === 'basic' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#D9531E] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-1">
                      BASIC
                    </span>
                    <div className="text-2xl font-black text-stone-900 mb-1">
                      ₹130 <span className="text-xs font-normal text-stone-500">/ person</span>
                    </div>
                    <div className="text-xs text-stone-600 font-medium">
                      T-shirt with Marker
                    </div>
                  </button>

                  {/* SALINA (Default / Recommended) */}
                  <button
                    type="button"
                    onClick={() => setPack('salina')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all relative ${
                      pack === 'salina'
                        ? 'border-[#D9531E] bg-orange-50/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-[#FAF7F2]'
                    }`}
                  >
                    {pack === 'salina' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#D9531E] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D9531E] block mb-1">
                      SALINA
                    </span>
                    <div className="text-2xl font-black text-stone-900 mb-1">
                      ₹150 <span className="text-xs font-normal text-stone-500">/ person</span>
                    </div>
                    <div className="text-xs text-stone-600 font-medium">
                      T-shirt along with Marker & Shades
                    </div>
                  </button>

                  {/* TOP */}
                  <button
                    type="button"
                    onClick={() => setPack('top')}
                    className={`p-5 rounded-2xl text-left border-2 transition-all relative ${
                      pack === 'top'
                        ? 'border-[#D9531E] bg-orange-50/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-[#FAF7F2]'
                    }`}
                  >
                    {pack === 'top' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#D9531E] text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-1">
                      TOP
                    </span>
                    <div className="text-2xl font-black text-stone-900 mb-1">
                      ₹200 <span className="text-xs font-normal text-stone-500">/ person</span>
                    </div>
                    <div className="text-xs text-stone-600 font-medium">
                      T-shirt, Photo Frame, Marker, Shades
                    </div>
                  </button>
                </div>

                {/* Express toggle */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        Express order <span className="text-[#D9531E] font-extrabold">+20% / person</span>
                      </div>
                      <div className="text-xs text-stone-500">
                        Jump the queue — priority printing and fastest dispatch.
                      </div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExpress}
                      onChange={(e) => setIsExpress(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D9531E]"></div>
                  </label>
                </div>
              </div>

              {/* STEP 4: Design options */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-800 font-black text-sm flex items-center justify-center border border-stone-200 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-stone-900">
                      Design
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Pick your back design template.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                    Back Design Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Template 1 */}
                    <button
                      type="button"
                      onClick={() => setBackTemplate('jersey')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        backTemplate === 'jersey'
                          ? 'border-[#D9531E] bg-orange-50/20'
                          : 'border-stone-200 bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="w-16 h-20 mx-auto bg-white rounded border border-stone-300 flex flex-col items-center justify-center p-1 shadow-xs mb-2">
                        <span className="text-[7px] text-stone-400 font-bold">LOGO</span>
                        <span className="text-sm font-black text-stone-900 leading-none">785</span>
                        <span className="text-[6px] font-bold text-stone-700 uppercase">FULL NAME</span>
                        <span className="text-[5px] text-stone-500">DEPT - BATCH</span>
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">Classic Jersey</span>
                      <span className="text-[10px] text-stone-500">Number + Name + Dept</span>
                    </button>

                    {/* Template 2 */}
                    <button
                      type="button"
                      onClick={() => setBackTemplate('varsity')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        backTemplate === 'varsity'
                          ? 'border-[#D9531E] bg-orange-50/20'
                          : 'border-stone-200 bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="w-16 h-20 mx-auto bg-white rounded border border-stone-300 flex flex-col items-center justify-center p-1 shadow-xs mb-2">
                        <span className="text-[6px] text-stone-500 font-bold">COLLEGE NAME</span>
                        <span className="text-[6px] text-stone-400">DEPARTMENT</span>
                        <span className="text-[7px] font-bold text-stone-800">ROLL NUMBER</span>
                        <span className="text-[8px] font-extrabold text-stone-900">FULL NAME</span>
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">College Varsity</span>
                      <span className="text-[10px] text-stone-500">Detailed Institutional</span>
                    </button>

                    {/* Template 3 */}
                    <button
                      type="button"
                      onClick={() => setBackTemplate('minimal')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        backTemplate === 'minimal'
                          ? 'border-[#D9531E] bg-orange-50/20'
                          : 'border-stone-200 bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="w-16 h-20 mx-auto bg-white rounded border border-stone-300 flex flex-col items-center justify-center p-1 shadow-xs mb-2">
                        <span className="text-[7px] font-bold text-stone-700">FULL NAME</span>
                        <span className="text-base font-black text-stone-900">076</span>
                        <span className="text-[6px] text-stone-500 font-semibold">COLLEGE</span>
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">Bold Minimal</span>
                      <span className="text-[10px] text-stone-500">Big Number Focus</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      Roll Number Digits
                    </label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setRollDigits(d)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            rollDigits === d
                              ? 'bg-[#1A1613] text-white border-[#1A1613]'
                              : 'bg-[#FAF7F2] text-stone-700 border-stone-200'
                          }`}
                        >
                          {d} digits
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                      College Logo
                    </label>
                    <button
                      type="button"
                      onClick={() => setIncludeLogo(!includeLogo)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
                        includeLogo
                          ? 'bg-orange-50 border-[#D9531E] text-stone-900'
                          : 'bg-[#FAF7F2] border-stone-200 text-stone-600'
                      }`}
                    >
                      <span>{includeLogo ? '✓ Include college logo' : 'No logo'}</span>
                      <span className="text-[10px] text-stone-500">Toggle</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Sticky Preview Column (Matching Screenshot 2 & 3) */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-md">
                
                {/* Live Preview Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500">
                      LIVE PREVIEW
                    </span>
                    <span className="text-xs font-bold text-[#D9531E] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      Print Preview
                    </span>
                  </div>

                  {/* Collage Shape Switcher Buttons */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-stone-600 mb-2">
                      Front collage shape
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCollageShape('honeycomb')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          collageShape === 'honeycomb'
                            ? 'bg-[#1A1613] text-white border-[#1A1613] shadow-xs'
                            : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <Hexagon className="w-4 h-4 mb-1" />
                        Honeycomb
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollageShape('square')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          collageShape === 'square'
                            ? 'bg-[#1A1613] text-white border-[#1A1613] shadow-xs'
                            : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <Grid className="w-4 h-4 mb-1" />
                        Square
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollageShape('chain')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          collageShape === 'chain'
                            ? 'bg-[#1A1613] text-white border-[#1A1613] shadow-xs'
                            : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <Layers className="w-4 h-4 mb-1" />
                        Chain
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pure Print Style Preview Card (No T-shirt Outline) */}
                <div className="mb-5 flex items-center justify-center">
                  <CollagePattern
                    shape={collageShape}
                    peopleCount={peopleCount}
                    graduatingYear={graduatingYear}
                    isStandaloneCard={true}
                  />
                </div>

                {/* People slider */}
                <div className="mb-5 bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-stone-700">People in batch</span>
                    <span className="text-sm font-black text-stone-900 font-mono">
                      {peopleCount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                    className="w-full accent-[#D9531E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>1 person</span>
                    <span>150 people</span>
                  </div>
                </div>

                {/* Summary Table (Matching Screenshot 3) */}
                <div className="space-y-2 text-xs border-t border-stone-200 pt-4 mb-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                    SUMMARY
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Batch</span>
                    <span className="font-semibold text-stone-900 max-w-[200px] truncate text-right">
                      {courseSection || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Year</span>
                    <span className="font-semibold text-stone-900">
                      {startYear} - {graduatingYear}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Shape</span>
                    <span className="font-semibold text-stone-900 capitalize">
                      {collageShape}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Back design</span>
                    <span className="font-semibold text-stone-900 capitalize">
                      {backTemplate}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Roll digits</span>
                    <span className="font-semibold text-stone-900">
                      {rollDigits}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Logo</span>
                    <span className="font-semibold text-stone-900">
                      {includeLogo ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">People</span>
                    <span className="font-semibold text-stone-900">
                      {peopleCount}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Pack</span>
                    <span className="font-semibold text-stone-900 capitalize">
                      {pack}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-sm">
                    <span className="font-bold text-stone-800">Per person</span>
                    <span className="font-extrabold text-[#D9531E]">
                      ₹{perPersonPrice}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-base border-t border-stone-200">
                    <span className="font-extrabold text-stone-900">Total estimated</span>
                    <span className="font-black text-stone-900">
                      ₹{totalEstimated.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-[#1A1613] hover:bg-[#2C2723] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-75"
                >
                  {isSubmitting ? (
                    'Generating batch link...'
                  ) : (
                    <>
                      Create Batch & Get Invite Link
                      <ArrowRight className="w-4 h-4 text-[#D9531E] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
}

export default function CreateBatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[#D9531E] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CreateBatchForm />
    </Suspense>
  );
}

