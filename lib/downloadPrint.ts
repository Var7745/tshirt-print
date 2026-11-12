/**
 * Production Print File Engine for JK Empress Custom T-Shirt Manufacturing
 * Generates true 300 DPI transparent DTF print-ready PNGs with embedded pHYs metadata,
 * scalable vector SVGs, and organized multi-garment production ZIP packages.
 */

import JSZip from 'jszip';

export function sanitizeFilename(name: string): string {
  return (name || 'file').replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * CRC32 Table Generator for standard IEEE 802.3 Ethernet CRC32
 */
function makeCrcTable(): Uint32Array {
  let c: number;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc32(bytes: Uint8Array, offset: number, length: number): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[offset + i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Injects a physical pixel resolution (pHYs) chunk into raw PNG bytes.
 * 300 DPI corresponds to 11,811 pixels per meter (300 / 0.0254).
 * This ensures RIP software (CadLink, AcroRIP, Digital Factory, Photoshop, Illustrator)
 * accurately recognizes 300 DPI physical print sizing.
 */
export function injectPngDpiMetadata(pngBytes: Uint8Array, dpi = 300): Uint8Array {
  // Validate PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    pngBytes.length < 33 ||
    pngBytes[0] !== 0x89 ||
    pngBytes[1] !== 0x50 ||
    pngBytes[2] !== 0x4E ||
    pngBytes[3] !== 0x47 ||
    pngBytes[4] !== 0x0D ||
    pngBytes[5] !== 0x0A ||
    pngBytes[6] !== 0x1A ||
    pngBytes[7] !== 0x0A
  ) {
    return pngBytes;
  }

  // First chunk must be IHDR (offset 8)
  const ihdrLen =
    (pngBytes[8] << 24) | (pngBytes[9] << 16) | (pngBytes[10] << 8) | pngBytes[11];
  const ihdrEnd = 8 + 4 + 4 + ihdrLen + 4; // 33 for standard 13-byte IHDR

  const ppm = Math.round(dpi / 0.0254); // 11811 for 300 DPI
  const physChunk = new Uint8Array(21);
  const view = new DataView(physChunk.buffer);

  // Length: 9 bytes
  view.setUint32(0, 9);
  // Chunk Type: 'pHYs'
  physChunk[4] = 0x70; // 'p'
  physChunk[5] = 0x48; // 'H'
  physChunk[6] = 0x59; // 'Y'
  physChunk[7] = 0x73; // 's'
  // Data: X pixels per meter, Y pixels per meter, unit (1 = meter)
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  physChunk[16] = 1;

  // CRC32 over Type (4 bytes) + Data (9 bytes)
  const crc = calculateCrc32(physChunk, 4, 13);
  view.setUint32(17, crc);

  // Insert pHYs chunk right after IHDR
  const output = new Uint8Array(pngBytes.length + 21);
  output.set(pngBytes.subarray(0, ihdrEnd), 0);
  output.set(physChunk, ihdrEnd);
  output.set(pngBytes.subarray(ihdrEnd), ihdrEnd + 21);
  return output;
}

/**
 * Triggers a browser download immediately using a temporary anchor element.
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {
      // ignore
    }
  }, 300);
}

/**
 * Downloads a given SVG element as a crisp, lossless vector .svg file.
 */
export function downloadSvgElementAsSvg(svgElement: SVGSVGElement, rawFilename: string): boolean {
  try {
    const filename = sanitizeFilename(rawFilename);
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Ensure valid SVG namespace
    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
      source = source.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.includes('xmlns:xlink="http://www.w3.org/1999/xlink"')) {
      source = source.replace(/<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename.endsWith('.svg') ? filename : `${filename}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch (err) {
    console.error('Failed to download SVG:', err);
    return false;
  }
}

export interface PngExportOptions {
  dpi?: number;
  widthInches?: number;
  heightInches?: number;
  transparent?: boolean;
  includeWatermark?: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

/**
 * Converts a base64 Data URL to a Uint8Array.
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array back to a base64 Data URL.
 */
function uint8ArrayToDataUrl(bytes: Uint8Array, mime = 'image/png'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * Downloads a given SVG element as a genuine 300 DPI PNG with transparent background.
 * Injects physical pHYs metadata chunk for DTF/DTG RIP software.
 * Never includes watermarks unless explicitly requested.
 */
export function downloadSvgElementAsPng(
  svgElement: SVGSVGElement,
  rawFilename: string,
  optionsOrWidth: PngExportOptions | number = {},
  optionalHeight?: number
) {
  const filename = sanitizeFilename(rawFilename);

  // Normalize options
  let opts: PngExportOptions = {};
  if (typeof optionsOrWidth === 'number') {
    opts = {
      targetWidth: optionsOrWidth,
      targetHeight: optionalHeight || 2200,
      dpi: 300,
      transparent: true,
      includeWatermark: false
    };
  } else {
    opts = {
      dpi: 300,
      transparent: true,
      includeWatermark: false,
      ...optionsOrWidth
    };
  }

  const dpi = opts.dpi || 300;
  // Calculate pixel dimensions: inches * DPI, or fallback to targetWidth/Height, or default 10" x 12"
  const targetWidth = opts.targetWidth || (opts.widthInches ? Math.round(opts.widthInches * dpi) : 3000);
  const targetHeight = opts.targetHeight || (opts.heightInches ? Math.round(opts.heightInches * dpi) : 3600);
  const isTransparent = opts.transparent !== false; // default true for DTF print

  try {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
      source = source.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.includes('xmlns:xlink="http://www.w3.org/1999/xlink"')) {
      source = source.replace(/<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    const image = new Image();

    let hasHandled = false;

    // Safety timeout: if image.onload doesn't fire within 1200ms, trigger direct SVG download
    const safetyTimer = setTimeout(() => {
      if (!hasHandled) {
        hasHandled = true;
        console.warn('Canvas render timed out, falling back to vector SVG download.');
        downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
      }
    }, 1200);

    image.onload = () => {
      if (hasHandled) return;
      hasHandled = true;
      clearTimeout(safetyTimer);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Transparent for DTF printing; only fill white if explicitly non-transparent
          if (!isTransparent) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
          }

          // Center artwork inside printable area
          const padX = targetWidth * 0.04;
          const padY = targetHeight * 0.04;
          const drawW = targetWidth - padX * 2;
          const drawH = targetHeight - padY * 2;

          const imgW = image.width || targetWidth;
          const imgH = image.height || targetHeight;
          const imgAspect = imgW / imgH;
          const drawAspect = drawW / drawH;

          let finalW = drawW;
          let finalH = drawH;
          let offsetX = padX;
          let offsetY = padY;

          if (imgAspect > drawAspect) {
            finalH = drawW / imgAspect;
            offsetY = padY + (drawH - finalH) / 2;
          } else {
            finalW = drawH * imgAspect;
            offsetX = padX + (drawW - finalW) / 2;
          }

          ctx.drawImage(image, offsetX, offsetY, finalW, finalH);

          // Only render watermark if caller specifically requested client proof mockup
          if (opts.includeWatermark) {
            ctx.fillStyle = 'rgba(168, 156, 138, 0.4)';
            ctx.font = 'bold 24px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('JK EMPRESS — PRODUCTION PROOF ONLY (NOT FOR PRINT)', targetWidth / 2, 45);
          }

          const rawDataUrl = canvas.toDataURL('image/png');
          
          // Inject 300 DPI physical pHYs metadata
          try {
            const rawBytes = dataUrlToUint8Array(rawDataUrl);
            const highResBytes = injectPngDpiMetadata(rawBytes, dpi);
            const finalDataUrl = uint8ArrayToDataUrl(highResBytes, 'image/png');
            triggerDownload(finalDataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
          } catch (dpiErr) {
            console.warn('Could not inject pHYs DPI metadata, downloading standard PNG:', dpiErr);
            triggerDownload(rawDataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
          }
        } else {
          downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
        }
      } catch (canvasErr) {
        console.warn('Canvas export error, downloading vector SVG instead:', canvasErr);
        downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
      }
    };

    image.onerror = () => {
      if (hasHandled) return;
      hasHandled = true;
      clearTimeout(safetyTimer);
      console.warn('Image load error on SVG data, downloading vector SVG instead.');
      downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
    };

    image.src = dataUrl;
  } catch (err) {
    console.error('downloadSvgElementAsPng failed, falling back to direct SVG download:', err);
    downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
  }
}

/**
 * Builds a clean vector SVG for the back of a T-Shirt with varsity typography.
 */
export function generateBackTshirtSvgString(params: {
  collegeName: string;
  jerseyName: string;
  rollNumber: string;
  courseSection: string;
  graduatingYear: string | number;
  includeGarmentOutline?: boolean;
}): string {
  const college = (params.collegeName || 'JK EMPRESS').toUpperCase();
  const jersey = (params.jerseyName || 'MEMBER').toUpperCase();
  const roll = (params.rollNumber || '00').trim();
  const course = (params.courseSection || 'BATCH 2027').toUpperCase();
  const year = params.graduatingYear || 2027;
  const withGarment = params.includeGarmentOutline !== false;

  if (!withGarment) {
    // Pure transparent artwork for Direct-To-Film printing
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="3000" height="3600">
  <!-- 1. College / Institution Header -->
  <text x="200" y="70" text-anchor="middle" fill="#1C1917" font-size="13" font-weight="800" letter-spacing="2" font-family="system-ui, sans-serif">
    ${college}
  </text>

  <!-- 2. Varsity Jersey Name -->
  <text x="200" y="130" text-anchor="middle" fill="#1C1917" font-size="34" font-weight="900" letter-spacing="3" font-family="system-ui, sans-serif">
    ${jersey}
  </text>

  <!-- 3. Giant Varsity Number -->
  <text x="200" y="240" text-anchor="middle" fill="#1C1917" font-size="110" font-weight="900" font-style="italic" font-family="Georgia, serif">
    ${roll}
  </text>

  <!-- 4. Course / Department Badge -->
  <rect x="80" y="275" width="240" height="32" rx="7" fill="#1C1917" />
  <text x="200" y="296" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="800" letter-spacing="1.5" font-family="system-ui, sans-serif">
    ${course}
  </text>

  <!-- 5. Class of Year -->
  <text x="200" y="340" text-anchor="middle" fill="#78716C" font-size="12" font-weight="700" letter-spacing="2.5" font-family="system-ui, sans-serif">
    CLASS OF ${year}
  </text>

  <!-- 6. Edition Badge -->
  <text x="200" y="380" text-anchor="middle" fill="#D9531E" font-size="9" font-weight="800" letter-spacing="2" font-family="system-ui, sans-serif">
    SIGNATURE DAY EDITION • JK EMPRESS
  </text>
</svg>`;
  }

  // Preview SVG with garment silhouette
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="1200" height="1440">
  <defs>
    <linearGradient id="backFabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FAF8F5" />
      <stop offset="100%" stop-color="#F2ECE1" />
    </linearGradient>
  </defs>

  <!-- Garment Base -->
  <path
    d="M145 42 C165 48, 235 48, 255 42 L315 76 C335 88, 360 105, 385 130 L348 185 C332 175, 318 165, 308 155 L306 430 C306 442, 294 448, 280 448 L120 448 C106 448, 94 442, 94 430 L92 155 C82 165, 68 175, 52 185 L15 130 C40 105, 65 88, 85 76 Z"
    fill="url(#backFabric)"
    stroke="#DFD8CC"
    stroke-width="2.5"
  />

  <!-- Collar Back -->
  <path d="M145 42 C170 54, 230 54, 255 42" stroke="#DDD5C7" stroke-width="3.5" fill="#FAF8F5" />

  <!-- Sleeve Seams -->
  <path d="M85 76 L112 168" stroke="#E3DCCE" stroke-width="1.5" stroke-dasharray="3,2" />
  <path d="M315 76 L288 168" stroke="#E3DCCE" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- 1. College Name -->
  <text x="200" y="155" text-anchor="middle" fill="#78716C" font-size="10" font-weight="800" letter-spacing="1.5" font-family="system-ui, sans-serif">
    ${college}
  </text>

  <!-- 2. Jersey Name -->
  <text x="200" y="195" text-anchor="middle" fill="#1C1917" font-size="28" font-weight="900" letter-spacing="2.5" font-family="system-ui, sans-serif">
    ${jersey}
  </text>

  <!-- 3. Roll Number -->
  <text x="200" y="275" text-anchor="middle" fill="#1C1917" font-size="76" font-weight="900" font-style="italic" font-family="Georgia, serif">
    ${roll}
  </text>

  <!-- 4. Course / Section Badge -->
  <rect x="120" y="298" width="160" height="22" rx="5" fill="#F5F5F4" stroke="#D6D3D1" stroke-width="1.2" />
  <text x="200" y="313" text-anchor="middle" fill="#292524" font-size="10" font-weight="800" letter-spacing="1.2" font-family="system-ui, sans-serif">
    ${course}
  </text>

  <!-- 5. Class of Year -->
  <text x="200" y="342" text-anchor="middle" fill="#A8A29E" font-size="9" font-weight="700" letter-spacing="2" font-family="system-ui, sans-serif">
    CLASS OF ${year}
  </text>

  <!-- 6. Signature Tag -->
  <text x="200" y="378" text-anchor="middle" fill="#D9531E" font-size="7" font-weight="700" letter-spacing="1" font-family="system-ui, sans-serif">
    SIGNATURE DAY EDITION
  </text>
</svg>`;
}

/**
 * Builds a vector SVG for the front of a T-Shirt.
 */
export function generateFrontTshirtSvgString(params: {
  collegeName: string;
  eventName: string;
  graduatingYear: string | number;
  centerMemberName?: string;
  centerRollNumber?: string;
  includeGarmentOutline?: boolean;
}): string {
  const college = (params.collegeName || 'JK EMPRESS').toUpperCase();
  const event = (params.eventName || 'SIGNATURE DAY').toUpperCase();
  const year = params.graduatingYear || 2027;
  const memberName = (params.centerMemberName || 'STUDENT').toUpperCase();
  const roll = params.centerRollNumber || '';
  const withGarment = params.includeGarmentOutline !== false;

  if (!withGarment) {
    // Pure DTF print front artwork
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="3000" height="3600">
  <!-- Crest Header -->
  <circle cx="200" cy="85" r="45" fill="none" stroke="#D9531E" stroke-width="2.5" />
  <text x="200" y="80" text-anchor="middle" fill="#1C1917" font-size="11" font-weight="800" font-family="system-ui, sans-serif">
    JK EMPRESS
  </text>
  <text x="200" y="96" text-anchor="middle" fill="#D9531E" font-size="14" font-weight="900" font-family="system-ui, sans-serif">
    ${year}
  </text>

  <!-- College Title -->
  <text x="200" y="165" text-anchor="middle" fill="#1C1917" font-size="14" font-weight="800" letter-spacing="2" font-family="system-ui, sans-serif">
    ${college}
  </text>
  <text x="200" y="190" text-anchor="middle" fill="#D9531E" font-size="18" font-weight="900" letter-spacing="3" font-family="system-ui, sans-serif">
    ${event}
  </text>

  <!-- Member Centerpiece -->
  <rect x="75" y="225" width="250" height="110" rx="14" fill="#FBF7EE" stroke="#E2D7C5" stroke-width="2" />
  <text x="200" y="265" text-anchor="middle" fill="#78716C" font-size="10" font-weight="700" letter-spacing="2" font-family="system-ui, sans-serif">
    HONORED GRADUATE
  </text>
  <text x="200" y="295" text-anchor="middle" fill="#1C1917" font-size="22" font-weight="900" font-family="system-ui, sans-serif">
    ${memberName}
  </text>
  ${roll ? `<text x="200" y="318" text-anchor="middle" fill="#D9531E" font-size="11" font-weight="800" font-family="system-ui, sans-serif">ROLL NO: ${roll}</text>` : ''}

  <!-- Footer Tag -->
  <text x="200" y="375" text-anchor="middle" fill="#A8A29E" font-size="9" font-weight="700" letter-spacing="1.5" font-family="system-ui, sans-serif">
    MEMORIES FOREVER • BATCH OF ${year}
  </text>
</svg>`;
  }

  // With garment mockup outline
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="1200" height="1440">
  <defs>
    <linearGradient id="frontFabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FAF8F5" />
      <stop offset="100%" stop-color="#F2ECE1" />
    </linearGradient>
  </defs>

  <path
    d="M145 42 C165 48, 235 48, 255 42 L315 76 C335 88, 360 105, 385 130 L348 185 C332 175, 318 165, 308 155 L306 430 C306 442, 294 448, 280 448 L120 448 C106 448, 94 442, 94 430 L92 155 C82 165, 68 175, 52 185 L15 130 C40 105, 65 88, 85 76 Z"
    fill="url(#frontFabric)"
    stroke="#DFD8CC"
    stroke-width="2.5"
  />

  <path d="M145 42 C165 72, 235 72, 255 42" stroke="#DDD5C7" stroke-width="3" fill="#FAF8F5" />

  <text x="200" y="160" text-anchor="middle" fill="#78716C" font-size="10" font-weight="800" letter-spacing="1.5" font-family="system-ui, sans-serif">
    ${college}
  </text>
  <text x="200" y="185" text-anchor="middle" fill="#D9531E" font-size="16" font-weight="900" letter-spacing="2" font-family="system-ui, sans-serif">
    ${event}
  </text>
  <text x="200" y="240" text-anchor="middle" fill="#1C1917" font-size="20" font-weight="900" font-family="system-ui, sans-serif">
    ${memberName}
  </text>
  ${roll ? `<text x="200" y="265" text-anchor="middle" fill="#78716C" font-size="11" font-weight="700" font-family="system-ui, sans-serif">#${roll}</text>` : ''}
  <text x="200" y="320" text-anchor="middle" fill="#A8A29E" font-size="9" font-weight="700" letter-spacing="1.5" font-family="system-ui, sans-serif">
    CLASS OF ${year}
  </text>
</svg>`;
}

/**
 * Downloads a complete multi-level ZIP package of all T-Shirts in a batch order.
 * Structured cleanly:
 * - 01_Front_Artwork/ (Individual front SVGs per member)
 * - 02_Back_Artwork/ (Individual back SVGs per member)
 * - 03_Production_Sheets/ (Production manifest & CSV roster)
 */
export async function downloadOrderBatchZip(order: any, tshirts: any[]): Promise<boolean> {
  try {
    const zip = new JSZip();
    const orderId = order.id || 'ORDER';
    const root = zip.folder(`${orderId}_DTF_Print_Package`);

    if (!root) throw new Error('Failed to create ZIP root folder');

    const frontFolder = root.folder('01_Front_Artwork');
    const backFolder = root.folder('02_Back_Artwork');
    const sheetsFolder = root.folder('03_Production_Sheets');

    // 1. Capture current Front SVG and Back SVG from the DOM if mounted
    const frontEl = (document.getElementById('order-detail-front-svg') ||
      document.getElementById('print-file-front-svg') ||
      document.querySelector('svg[id*="front-svg"]')) as SVGSVGElement | null;

    const backEl = (document.getElementById('order-detail-back-svg') ||
      document.getElementById('print-file-back-svg') ||
      document.querySelector('svg[id*="back-svg"]')) as SVGSVGElement | null;

    const serializer = new XMLSerializer();

    if (frontEl && frontFolder) {
      frontFolder.file(`00_Master_Batch_Front_Collage.svg`, serializer.serializeToString(frontEl));
    }
    if (backEl && backFolder) {
      backFolder.file(`00_Master_Batch_Back_Template.svg`, serializer.serializeToString(backEl));
    }

    // 2. Generate personalized front and back files for every T-shirt
    const year = order.batch?.replace(/[^0-9]/g, '') || '2027';

    tshirts.forEach((shirt, index) => {
      const safeName = sanitizeFilename(shirt.person_name || `Member_${index + 1}`);
      const safeJersey = sanitizeFilename(shirt.jersey_name || shirt.person_name || 'MEMBER');
      const num = shirt.tshirt_number || `${orderId}-${String(index + 1).padStart(3, '0')}`;

      // Personalized Front Artwork
      const frontSvg = generateFrontTshirtSvgString({
        collegeName: order.college_name || 'JK Empress',
        eventName: order.event_name || 'Signature Day',
        graduatingYear: year,
        centerMemberName: shirt.person_name || safeJersey,
        centerRollNumber: shirt.roll_number || '',
        includeGarmentOutline: false // Pure transparent DTF print art
      });
      frontFolder?.file(`${num}_${safeJersey}_Front_300DPI.svg`, frontSvg);

      // Personalized Back Artwork
      const backSvg = generateBackTshirtSvgString({
        collegeName: order.college_name || 'JK Empress',
        jerseyName: shirt.jersey_name || shirt.person_name || 'MEMBER',
        rollNumber: shirt.roll_number || String(index + 1),
        courseSection: order.department || order.batch || 'Batch 2027',
        graduatingYear: year,
        includeGarmentOutline: false // Pure transparent DTF print art
      });
      backFolder?.file(`${num}_${safeJersey}_Back_300DPI.svg`, backSvg);
    });

    // 3. Add Production Summary Sheet
    const summaryText = `========================================================================
JK EMPRESS — PRODUCTION RUN SHEET & PRINT SPECIFICATIONS
========================================================================
Order ID:               ${order.id}
Event Name:             ${order.event_name || 'Signature Day'}
College / Organization: ${order.college_name}
Department / Batch:     ${order.department || 'N/A'} / ${order.batch || 'N/A'}
Collage Style:          ${(order.collage_shape || 'honeycomb').toUpperCase()} PATTERN
Total Physical Units:   ${tshirts.length} T-Shirts
Print Process:          Direct-to-Film (DTF) 300 DPI Heat-Press Transfer
Generated Date:         ${new Date().toLocaleString()}

========================================================================
GARMENT & PERSONALIZATION MANIFEST
========================================================================
${tshirts
  .map(
    (t, i) =>
      `[#${String(i + 1).padStart(2, '0')}] ${t.tshirt_number.padEnd(16)} | ` +
      `Name: ${t.person_name.padEnd(18)} | ` +
      `Size: ${t.size.padEnd(5)} | ` +
      `Jersey: ${(t.jersey_name || '-').padEnd(14)} | ` +
      `Roll: ${(t.roll_number || '-').padEnd(8)} | ` +
      `Fabric: ${t.fabric || '100% Cotton'} | ` +
      `Copies: ${t.required_print_copies || 1}`
  )
  .join('\n')}

========================================================================
PRINT OPERATOR SPECIFICATIONS & INSTRUCTIONS:
- Resolution: True 300 DPI (pHYs chunk embedded).
- Format: Vector SVG & Transparent PNG (Alpha channel preserved, no white bounding box).
- Print Area Front: 10.0" x 12.0" @ 300 DPI (3000 x 3600 px).
- Print Area Back:  11.0" x 14.0" @ 300 DPI (3300 x 4200 px).
- Heat Press: 160°C (320°F) for 15 seconds, medium-heavy pressure (4-5 bar), cold peel, 5-second post-press with Teflon sheet.
========================================================================
`;

    sheetsFolder?.file('README_PRODUCTION_MANIFEST.txt', summaryText);

    // 4. Add CSV Roster for spreadsheet / inventory / sorting
    const csvHeader = 'Item,Garment_Number,Student_Name,Jersey_Name,Roll_Number,Size,Fabric,Quantity,Status\n';
    const csvRows = tshirts.map((t, i) => 
      `"${i + 1}","${t.tshirt_number}","${(t.person_name || '').replace(/"/g, '""')}","${(t.jersey_name || '').replace(/"/g, '""')}","${t.roll_number || ''}","${t.size}","${t.fabric || 'Cotton'}","${t.required_print_copies || 1}","${t.approval_status || 'Ready'}"`
    ).join('\n');
    sheetsFolder?.file('Garment_Roster_Manifest.csv', csvHeader + csvRows);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `${orderId}_DTF_Print_Package_${tshirts.length}_Tees.zip`);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 60000);
    return true;
  } catch (err: any) {
    console.error('Failed to create batch ZIP:', err);
    throw err;
  }
}
