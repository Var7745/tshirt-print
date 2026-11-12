'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Shirt, 
  Upload, 
  Check, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  ChevronRight,
  User,
  Hash,
  CheckCircle2,
  Share2,
  Crop
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getBatchById, addMemberToBatch, BatchData, Member, SAMPLE_AVATARS } from '@/lib/store';
import TshirtMockup from '@/components/TshirtMockup';
import PhotoFrameAdjuster from '@/components/PhotoFrameAdjuster';

export default function StudentJoinPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string;

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [fullName, setFullName] = useState('');
  const [jerseyName, setJerseyName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [size, setSize] = useState<Member['size']>('M');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SAMPLE_AVATARS[0]);
  const [customPhotoUpload, setCustomPhotoUpload] = useState<string | null>(null);
  const [rawSelectedImage, setRawSelectedImage] = useState<string | null>(null);
  const [showAdjusterModal, setShowAdjusterModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      // 1. Fetch live batch from API with public view (redacting other students' private photos)
      fetch(`/api/batches/${batchId}?view=public&_t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.batch) {
            setBatch(data.batch);
          } else {
            // Fallback to local store
            const b = getBatchById(batchId);
            if (b) setBatch(b);
          }
        })
        .catch(() => {
          const b = getBatchById(batchId);
          if (b) setBatch(b);
        });
    }
  }, [batchId]);

  // Sync jersey name with full name first word if empty
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!jerseyName || jerseyName === fullName.split(' ')[0]?.toUpperCase()) {
      setJerseyName(val.trim().split(' ')[0]?.toUpperCase() || '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File size restriction (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert('Photo file size exceeds the 5MB limit. Please select a smaller photo.');
      e.target.value = '';
      return;
    }

    // 2. File extension restriction
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => lowerName.endsWith(ext));
    if (!hasValidExtension) {
      alert('Invalid file extension. Only JPG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    // 3. MIME type check
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      alert('Invalid image MIME type. Please upload a genuine JPG, PNG, or WebP photo.');
      e.target.value = '';
      return;
    }

    // 4. File Header / Magic Number Verification
    const slice = file.slice(0, 4);
    const headerReader = new FileReader();
    headerReader.onloadend = () => {
      const arr = new Uint8Array(headerReader.result as ArrayBuffer);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, '0');
      }
      header = header.toLowerCase();

      // JPEG: ffd8ff, PNG: 89504e47, WEBP: 52494646 (RIFF)
      const isJpeg = header.startsWith('ffd8ff');
      const isPng = header.startsWith('89504e47');
      const isWebp = header.startsWith('52494646');

      if (!isJpeg && !isPng && !isWebp) {
        alert('File content signature verification failed. The file is not a valid image.');
        e.target.value = '';
        return;
      }

      // Safe image verified: Read as Data URL & open interactive frame adjuster
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setRawSelectedImage(result);
        setShowAdjusterModal(true);
      };
      reader.readAsDataURL(file);
    };
    headerReader.readAsArrayBuffer(slice);
  };

  const handleSaveAdjustedPhoto = (adjustedDataUrl: string, blob: Blob) => {
    setSelectedPhoto(adjustedDataUrl);
    setCustomPhotoUpload(adjustedDataUrl);
    setShowAdjusterModal(false);

    // Upload adjusted cropped photo to cloud storage in background
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', blob, 'portrait.jpg');
    formData.append('bucket', 'student-photos');

    fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then((r) => r.json())
      .then((uploadData) => {
        setUploadingPhoto(false);
        if (uploadData.success && uploadData.url) {
          setCustomPhotoUpload(uploadData.url);
          setSelectedPhoto(uploadData.url);
        }
      })
      .catch((err) => {
        console.error('Photo upload error:', err);
        setUploadingPhoto(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!rollNumber.trim()) {
      setErrorMessage('Please enter your roll number or student ID');
      return;
    }

    setSubmitting(true);

    const photoToUse = customPhotoUpload || selectedPhoto || SAMPLE_AVATARS[0];
    const jName = (jerseyName || fullName.split(' ')[0] || 'CLASSMATE').toUpperCase();

    try {
      // 1. Submit to Live Backend API
      const res = await fetch(`/api/batches/${batchId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          jerseyName: jName,
          rollNumber,
          size,
          photoUrl: photoToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitting(false);
        setErrorMessage(data.error || 'Failed to submit registration. Please try again.');
        return;
      }

      // Also sync to client store
      addMemberToBatch(batchId, {
        fullName,
        jerseyName: jName,
        rollNumber: rollNumber || '00',
        size,
        photoUrl: photoToUse,
        status: 'confirmed',
      });

      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmitting(false);
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Connection error. Please try again.');
    }
  };

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#D9531E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-600 text-sm font-semibold">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 py-12">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 sm:p-10 text-center space-y-6 border border-stone-200/80 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D9531E] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              You&apos;re On The Shirt!
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Awesome, {fullName}!
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Your photo, size <strong>({size})</strong>, and jersey name <strong>({jerseyName})</strong> have been added to the {batch.courseSection} batch collage.
            </p>
          </div>

          {/* Render personal mockup */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200">
            <TshirtMockup
              shape={batch.collageShape}
              jerseyName={jerseyName}
              rollNumber={rollNumber || '00'}
              collegeName={batch.collegeName}
              courseSection={batch.courseSection}
              graduatingYear={batch.graduatingYear}
              userPhoto={selectedPhoto}
              viewMode="back"
            />
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/dashboard/${batch.id}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1A1613] hover:bg-stone-800 text-white font-bold text-sm transition-all"
            >
              View Batch Progress & Roster
              <ArrowRight className="w-4 h-4 text-[#D9531E]" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const text = encodeURIComponent(
                  `I just joined our ${batch.courseSection} batch t-shirt list! Add your photo here: ${window.location.href}`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20BD5A] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Remind other friends on WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Top Banner */}
      <header className="border-b border-[#EBE4D8] bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/jk-impress-logo.jpg"
              alt="JK IMPRESS"
              className="w-8 h-8 rounded-lg object-cover border border-amber-500/20"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-stone-900 leading-none">
                JK IMPRESS
              </span>
              <span className="text-[7px] font-bold tracking-[0.2em] text-[#C49746] uppercase">
                MAKE YOUR MARK
              </span>
            </div>
          </Link>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            Batch Invite
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* Batch Info Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs mb-8">
          <div className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#8C461E] bg-[#F3ECE1] px-3 py-1 rounded-full border border-[#E5DAC8] mb-2">
            {batch.courseSection} • CLASS OF {batch.graduatingYear}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {batch.collegeName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Upload your picture and pick your size to be included in the batch memorial shirt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {errorMessage}
            </div>
          )}

          {uploadingPhoto && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              Uploading photo to secure cloud storage...
            </div>
          )}
          
          {/* Section 1: Choose Your Photo */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900">
                  1. Your Photo for the Front Mosaic
                </h2>
                <p className="text-xs text-stone-500">
                  Pick a clear selfie or upload your portrait.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#D9531E] border border-orange-200 text-xs font-bold hover:bg-orange-100 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800">
              <span className="font-bold">🔒 Private & Secure:</span>
              <span>Your photo is submitted directly to the batch organizer and print shop. Other students cannot browse or access your uploaded photo.</span>
            </div>

            {/* Custom upload preview if any */}
            {customPhotoUpload && (
              <div className="flex items-center justify-between p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <img
                    src={customPhotoUpload}
                    alt="Custom upload"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-400 shadow-xs"
                  />
                  <div className="text-xs">
                    <span className="font-extrabold text-stone-900 block flex items-center gap-1.5">
                      Custom Photo Ready ✓
                    </span>
                    <span className="text-stone-500">Framed & centered for mosaic print</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (rawSelectedImage) {
                      setShowAdjusterModal(true);
                    } else {
                      setRawSelectedImage(customPhotoUpload);
                      setShowAdjusterModal(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-[#D9531E] border border-orange-300 font-bold text-xs shadow-2xs transition-all"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Adjust Frame
                </button>
              </div>
            )}

            {/* Quick avatar selector */}
            <div>
              <span className="text-[11px] font-bold text-stone-500 block mb-2">
                Or select from sample avatar portraits:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {SAMPLE_AVATARS.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(src);
                      setCustomPhotoUpload(null);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      selectedPhoto === src && !customPhotoUpload
                        ? 'border-[#D9531E] ring-2 ring-[#D9531E]/30 scale-105'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {selectedPhoto === src && !customPhotoUpload && (
                      <div className="absolute inset-0 bg-[#D9531E]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              2. Your Name & Jersey Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="e.g. Neha Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jersey Name (Printed on Back)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={jerseyName}
                  onChange={(e) => setJerseyName(e.target.value.toUpperCase())}
                  placeholder="e.g. NEHA"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Max 12 capital letters</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Roll Number / Jersey Number
              </label>
              <div className="relative max-w-xs">
                <Hash className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={4}
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 021"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-stone-200 text-stone-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D9531E]/40"
                />
              </div>
            </div>
          </div>

          {/* Section 3: T-Shirt Size */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900">
                  3. Select Your Size
                </h2>
                <p className="text-xs text-stone-500">
                  True-to-fit unisex standard sizing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="text-xs font-bold text-[#D9531E] hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Size Chart
              </button>
            </div>

            {/* Size Chart Popup / Accordion */}
            {showSizeGuide && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2">
                <div className="font-bold text-stone-900">T-Shirt Size Guide (Inches)</div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
                  <div className="font-bold bg-white p-1 rounded border">Size</div>
                  <div className="font-bold bg-white p-1 rounded border">S</div>
                  <div className="font-bold bg-white p-1 rounded border">M</div>
                  <div className="font-bold bg-white p-1 rounded border">L</div>
                  <div className="font-bold bg-white p-1 rounded border">XL</div>
                  <div className="font-bold bg-white p-1 rounded border">XXL</div>
                  <div className="font-bold bg-white p-1 rounded border">XXXL</div>
                  <div className="font-semibold text-stone-500 py-1">Chest</div>
                  <div className="py-1">38&quot;</div>
                  <div className="py-1">40&quot;</div>
                  <div className="py-1">42&quot;</div>
                  <div className="py-1">44&quot;</div>
                  <div className="py-1">46&quot;</div>
                  <div className="py-1">48&quot;</div>
                  <div className="font-semibold text-stone-500 py-1">Length</div>
                  <div className="py-1">27&quot;</div>
                  <div className="py-1">28&quot;</div>
                  <div className="py-1">29&quot;</div>
                  <div className="py-1">30&quot;</div>
                  <div className="py-1">31&quot;</div>
                  <div className="py-1">32&quot;</div>
                </div>
              </div>
            )}

            {/* Size Selector Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as Member['size'][]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`py-3.5 rounded-2xl text-sm font-black border transition-all ${
                    size === s
                      ? 'bg-[#1A1613] text-white border-[#1A1613] shadow-xs'
                      : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Live Personal Preview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block mb-2">
              LIVE PREVIEW OF YOUR SHIRT
            </span>
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-stone-200">
              <TshirtMockup
                shape={batch.collageShape}
                jerseyName={jerseyName || 'YOUR NAME'}
                rollNumber={rollNumber || '00'}
                collegeName={batch.collegeName}
                courseSection={batch.courseSection}
                graduatingYear={batch.graduatingYear}
                userPhoto={selectedPhoto}
                viewMode="both"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#D9531E] hover:bg-[#BF4314] text-white font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {submitting ? (
              'Submitting your entry...'
            ) : (
              <>
                Confirm & Add Me To The Batch
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Interactive Photo Frame Adjuster Modal */}
        {showAdjusterModal && rawSelectedImage && (
          <PhotoFrameAdjuster
            imageSrc={rawSelectedImage}
            initialShape={
              batch?.collageShape === 'honeycomb'
                ? 'honeycomb'
                : batch?.collageShape === 'chain'
                ? 'circle'
                : 'square'
            }
            onSave={handleSaveAdjustedPhoto}
            onCancel={() => setShowAdjusterModal(false)}
          />
        )}

      </div>
    </div>
  );
}
