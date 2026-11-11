'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Users, 
  Camera, 
  Truck, 
  ShieldCheck, 
  ChevronDown, 
  Heart,
  Grid,
  Hexagon,
  Layers,
  Star,
  Circle,
  Square as SquareIcon,
  RectangleHorizontal,
  Diamond
} from 'lucide-react';
import TshirtMockup from '@/components/TshirtMockup';
import { CollageShapeType } from '@/components/CollagePattern';

export default function HomePage() {
  const [selectedShape, setSelectedShape] = useState<CollageShapeType>('honeycomb');
  const [peopleCount, setPeopleCount] = useState(45);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How do my classmates submit their photos?',
      a: 'Once you create your batch, you get a unique invite link (e.g., jkimpress.store/join/your-batch). Share this directly in your class WhatsApp group. Each student clicks the link, uploads their favorite photo, picks their T-shirt size, and adds their name/roll number in less than 30 seconds—no app download or sign-up needed!'
    },
    {
      q: 'What is the quality of the t-shirts and print?',
      a: 'We use premium 220+ GSM 100% super-combed bio-washed cotton. The front mosaic is printed using ultra-high-definition direct-to-garment (DTG) or high-density reactive printing so every single classmate face is crisp, vibrant, and guaranteed not to peel or fade after washing.'
    },
    {
      q: 'What is the minimum order quantity (MOQ)?',
      a: 'Our minimum batch size is just 10 shirts! Whether you are a small project group of 15 or an entire engineering department of 180 students, we handle the batch effortlessly.'
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard dispatch takes 5-7 business days after the batch organizer closes submissions and approves the print proof. Need it urgently for your farewell? Choose "Express Order" at checkout for 3-4 day priority production and air shipping across India.'
    },
    {
      q: 'Can members pay individually or does the organizer pay all at once?',
      a: 'You have full flexibility! The organizer can collect funds through UPI/cash and pay in one go, or export the verified roster sheet with member breakdown and coordinate seamlessly.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1613]">
      {/* Hero Section */}
      <section className="relative pt-8 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3ECE1] border border-[#E5DAC8] text-[#8C461E] text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#D9531E]" />
                Signature Day Celebrations • College Farewell
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#1A1613] leading-[1.08]">
                Every face. <br />
                <span className="text-[#D9531E]">One unforgettable</span> <br />
                Signature Tee.
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-[#5A554E] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Turn your batch memories into a shirt to sign and keep forever. One main person centered with classmates all around — packaged with fabric signing markers.
              </p>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/create"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#1A1613] hover:bg-[#2C2723] text-white text-base font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Create your batch
                  <ArrowRight className="w-5 h-5 text-[#D9531E]" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-[#F5EFE6] border border-[#DED5C7] text-[#1A1613] text-base font-bold shadow-xs transition-all"
                >
                  See the designs
                </a>
              </div>

              {/* Trust checklist */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-[#665F55]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>No sign-up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Made in India</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Mockup Showcase (Matches Screenshot 1) */}
            <div className="lg:col-span-6 relative">
              <div className="relative bg-[#F4EFE6] rounded-3xl p-6 sm:p-10 border border-[#E8DFCFC] shadow-sm">
                
                {/* Floating Batch Progress Card (Top Right) */}
                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-md border border-stone-200/80 text-left">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    Batch progress
                  </span>
                  <div className="text-sm font-extrabold text-stone-900 mt-0.5">
                    42 / 48 joined
                  </div>
                  <div className="w-32 bg-stone-100 rounded-full h-2 mt-1.5 overflow-hidden">
                    <div className="bg-[#D9531E] h-2 rounded-full w-[88%] transition-all duration-500"></div>
                  </div>
                </div>

                {/* T-Shirt Mockup Component */}
                <div className="pt-10 pb-6 flex items-center justify-center">
                  <TshirtMockup
                    shape={selectedShape}
                    peopleCount={peopleCount}
                    jerseyName="NEHA"
                    rollNumber="21"
                    courseSection="MSCS"
                    graduatingYear="2027"
                    viewMode="both"
                  />
                </div>

                {/* Floating Friends Joined Pill (Bottom Left) */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-20 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-stone-200/80 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="w-7 h-7 rounded-full bg-amber-200 text-stone-800 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      PK
                    </span>
                    <span className="w-7 h-7 rounded-full bg-orange-200 text-stone-800 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      RS
                    </span>
                    <span className="w-7 h-7 rounded-full bg-red-200 text-stone-800 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      AV
                    </span>
                  </div>
                  <span className="text-xs font-bold text-stone-800">
                    6 friends joined today
                  </span>
                </div>
              </div>

              {/* Shape Switcher Bar right underneath the preview */}
              <div className="mt-4 flex items-center justify-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-stone-200 shadow-xs max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setSelectedShape('honeycomb')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedShape === 'honeycomb'
                      ? 'bg-[#1A1613] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  Honeycomb
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShape('square')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedShape === 'square'
                      ? 'bg-[#1A1613] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  Square
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShape('chain')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedShape === 'chain'
                      ? 'bg-[#1A1613] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Chain
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#EBE4D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider bg-orange-100/60 px-3 py-1 rounded-full border border-orange-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A1613] mt-3">
              No more messy Excel sheets or WhatsApp clutter.
            </h2>
            <p className="text-base sm:text-lg text-[#5A554E] mt-3">
              We engineered the entire workflow specifically for Indian college batches, departments, and school farewells.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFCFC] relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1613] text-white font-black text-lg flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-xl font-bold text-[#1A1613] mb-2">
                Create in 60 seconds
              </h3>
              <p className="text-sm text-[#5A554E] leading-relaxed">
                Enter your college name, branch, graduation year, and select your favorite front mosaic layout.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFCFC] relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#D9531E] text-white font-black text-lg flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-xl font-bold text-[#1A1613] mb-2">
                Share invite link
              </h3>
              <p className="text-sm text-[#5A554E] leading-relaxed">
                Drop your customized join link directly in your official or unofficial WhatsApp class group.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFCFC] relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1613] text-white font-black text-lg flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-xl font-bold text-[#1A1613] mb-2">
                Self-service upload
              </h3>
              <p className="text-sm text-[#5A554E] leading-relaxed">
                Classmates upload their photo, pick their size (S to 3XL), and enter their jersey name & roll number.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFCFC] relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-5">
                04
              </div>
              <h3 className="text-xl font-bold text-[#1A1613] mb-2">
                Print & doorstep delivery
              </h3>
              <p className="text-sm text-[#5A554E] leading-relaxed">
                Review your live front mosaic & back jersey proof. We print, pack with markers, and dispatch directly to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Packages Section (Matching Screenshot 3) */}
      <section id="pricing" className="py-20 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
              Clear All-in Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1613] mt-3">
              Pick your batch pack.
            </h2>
            <p className="text-base sm:text-lg text-[#5A554E] mt-2">
              All-in per-person price. No hidden setup charges, screen fees, or delivery surprises.
            </p>

            {/* People count slider */}
            <div className="mt-8 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-stone-700">Class Size:</span>
                <span className="text-lg font-extrabold text-[#D9531E] bg-orange-50 px-3 py-0.5 rounded-lg border border-orange-200">
                  {peopleCount} students
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value))}
                className="w-full accent-[#D9531E] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-semibold text-stone-400 mt-1">
                <span>10 students</span>
                <span>100</span>
                <span>200+ students</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Basic Pack */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                    BASIC
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-stone-900">₹130</span>
                  <span className="text-sm font-medium text-stone-500">/ person</span>
                </div>
                <p className="text-sm text-stone-600 mb-6">
                  Only T-shirt with fabric signing marker for Signature Day farewell memories.
                </p>
                <div className="space-y-3 border-t border-stone-100 pt-6 text-sm text-stone-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Bio-washed 220 GSM Cotton Tee</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Custom Front Photo Mosaic Grid</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Jersey Name & Roll No on Back</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Fabric Signing Marker</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100 mt-8">
                <div className="text-xs text-stone-500 mb-3 text-center">
                  Total for {peopleCount} students: <strong className="text-stone-900">₹{peopleCount * 130}</strong>
                </div>
                <Link
                  href="/create?pack=basic"
                  className="w-full inline-flex items-center justify-center py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm transition-colors"
                >
                  Choose Basic (₹130)
                </Link>
              </div>
            </div>

            {/* Salina / Keepsake Pack (Most Popular) */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 border-2 border-[#D9531E] shadow-xl relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D9531E] text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                MOST POPULAR
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#D9531E]">
                    SALINA
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-stone-900">₹150</span>
                  <span className="text-sm font-medium text-stone-500">/ person</span>
                </div>
                <p className="text-sm text-stone-600 mb-6">
                  T-shirt along with permanent marker and shades for your farewell celebration.
                </p>
                <div className="space-y-3 border-t border-stone-200/60 pt-6 text-sm text-stone-800">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#D9531E] stroke-[3]" />
                    <span><strong>All Basic Features Included</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#D9531E] stroke-[3]" />
                    <span>Bio-washed 220 GSM Cotton Tee</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#D9531E] stroke-[3]" />
                    <span>Permanent Fabric Signing Marker</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#D9531E] stroke-[3]" />
                    <span><strong>Shades (Farewell Signature Day Props)</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#D9531E] stroke-[3]" />
                    <span>Digital High-Res Print File</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-200/60 mt-8">
                <div className="text-xs text-stone-600 mb-3 text-center">
                  Total for {peopleCount} students: <strong className="text-stone-900">₹{peopleCount * 150}</strong>
                </div>
                <Link
                  href="/create?pack=salina"
                  className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl bg-[#D9531E] hover:bg-[#BF4314] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
                >
                  Choose Salina Pack (₹150)
                </Link>
              </div>
            </div>

            {/* Top Pack */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                    TOP / PREMIUM
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-stone-900">₹200</span>
                  <span className="text-sm font-medium text-stone-500">/ person</span>
                </div>
                <p className="text-sm text-stone-600 mb-6">
                  Complete farewell package: T-shirt, personalized photo frame, marker, and shades!
                </p>
                <div className="space-y-3 border-t border-stone-100 pt-6 text-sm text-stone-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Bio-washed 220 GSM Cotton Tee</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span><strong>Framed Batch Group Photo (A4)</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Fabric Signing Marker</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span><strong>Shades (Farewell Signature Day Props)</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Individual Name & Roll No Personalization</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>VIP Priority Dispatch</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100 mt-8">
                <div className="text-xs text-stone-500 mb-3 text-center">
                  Total for {peopleCount} students: <strong className="text-stone-900">₹{peopleCount * 200}</strong>
                </div>
                <Link
                  href="/create?pack=top"
                  className="w-full inline-flex items-center justify-center py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm transition-colors"
                >
                  Choose Top Pack (₹200)
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-[#EBE4D8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#D9531E] uppercase tracking-wider bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1613] mt-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[#E8DFCFC] rounded-2xl overflow-hidden bg-[#FAF7F2] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-base sm:text-lg text-stone-900 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-500 transition-transform duration-200 flex-shrink-0 ml-4 ${
                      openFaq === index ? 'rotate-180 text-[#D9531E]' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-sm sm:text-base text-stone-600 leading-relaxed border-t border-[#E8DFCFC]/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-[#1A1613] text-white text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to print your college memories?
          </h2>
          <p className="text-stone-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Create your batch link in under 1 minute. Free to start, no upfront commitment.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#D9531E] hover:bg-[#BF4314] text-white font-bold text-base shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Start your batch now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF7F2] border-t border-[#EBE4D8] py-12 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/jk-impress-logo.jpg"
              alt="JK IMPRESS"
              className="w-9 h-9 rounded-lg object-cover shadow-xs border border-amber-500/20"
            />
            <div className="text-left">
              <span className="font-extrabold text-sm text-stone-900 block leading-tight">
                JK IMPRESS
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#C49746] uppercase">
                MAKE YOUR MARK
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/create" className="hover:text-stone-900">Start Batch</Link>
            <Link href="/batches" className="hover:text-stone-900">My Batches</Link>
            <Link href="/#pricing" className="hover:text-stone-900">Pricing</Link>
            <Link href="/#faq" className="hover:text-stone-900">FAQ</Link>
          </div>
          <div>
            © {new Date().getFullYear()} JK IMPRESS. Proudly Made in India 🇮🇳
          </div>
        </div>
      </footer>
    </div>
  );
}
