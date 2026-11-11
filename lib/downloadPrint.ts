/**
 * Client-Side Print File Downloader for JK Empress T-Shirt Printing
 * Generates and downloads high-resolution 300 DPI PNGs, vector SVGs,
 * and complete multi-garment ZIP archives directly in the browser.
 */

import JSZip from 'jszip';

export function sanitizeFilename(name: string): string {
  return (name || 'file').replace(/[/\\?%*:|"<>]/g, '_').trim();
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
 * This is 100% synchronous in the user gesture and never gets blocked by pop-up blockers.
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

/**
 * Downloads a given SVG element as a high-resolution 300 DPI PNG.
 * If canvas conversion fails (e.g. cross-origin remote images),
 * it seamlessly and reliably falls back to downloading the vector SVG file
 * so the admin or user ALWAYS receives their print file!
 */
export function downloadSvgElementAsPng(
  svgElement: SVGSVGElement,
  rawFilename: string,
  targetWidth = 1800,
  targetHeight = 2200
) {
  const filename = sanitizeFilename(rawFilename);

  try {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
      source = source.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.includes('xmlns:xlink="http://www.w3.org/1999/xlink"')) {
      source = source.replace(/<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Use a Data URL rather than a Blob URL to avoid Chromium CORS restrictions on local blob images
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    const image = new Image();

    let hasHandled = false;

    // Safety timeout: if image.onload doesn't fire within 800ms, trigger direct SVG download
    const safetyTimer = setTimeout(() => {
      if (!hasHandled) {
        hasHandled = true;
        console.warn('Canvas render timed out, falling back to instant SVG download.');
        downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
      }
    }, 800);

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

          // Clean white garment background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Center artwork with margin
          const padX = targetWidth * 0.06;
          const padY = targetHeight * 0.06;
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

          // Header Watermark for production proof
          ctx.fillStyle = '#A89C8A';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('JK EMPRESS — SIGNATURE DAY PRODUCTION PROOF (300 DPI)', targetWidth / 2, 42);

          const pngUrl = canvas.toDataURL('image/png');
          triggerDownload(pngUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
        } else {
          downloadSvgElementAsSvg(svgElement, `${filename}.svg`);
        }
      } catch (canvasErr) {
        console.warn('Canvas export tainted or restricted, downloading vector SVG instead:', canvasErr);
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
 * Builds a vector SVG for the back of a T-Shirt with varsity details and college name.
 */
export function generateBackTshirtSvgString(params: {
  collegeName: string;
  jerseyName: string;
  rollNumber: string;
  courseSection: string;
  graduatingYear: string | number;
}): string {
  const college = (params.collegeName || 'JK EMPRESS').toUpperCase();
  const jersey = (params.jerseyName || 'MEMBER').toUpperCase();
  const roll = (params.rollNumber || '00').trim();
  const course = (params.courseSection || 'BATCH 2027').toUpperCase();
  const year = params.graduatingYear || 2027;

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
 * Downloads a complete ZIP package of all T-Shirts in a batch order.
 * Bundles Front Vector SVGs, Back Vector SVGs, and a detailed Production Specifications sheet.
 */
export async function downloadOrderBatchZip(order: any, tshirts: any[]): Promise<boolean> {
  try {
    const zip = new JSZip();
    const orderId = order.id || 'ORDER';
    const folder = zip.folder(`${orderId}_Print_Files`);

    // 1. Capture current Front SVG and Back SVG from the DOM if mounted
    const frontEl = (document.getElementById('order-detail-front-svg') ||
      document.getElementById('print-file-front-svg') ||
      document.querySelector('svg[id*="front-svg"]')) as SVGSVGElement | null;

    const backEl = (document.getElementById('order-detail-back-svg') ||
      document.getElementById('print-file-back-svg') ||
      document.querySelector('svg[id*="back-svg"]')) as SVGSVGElement | null;

    const serializer = new XMLSerializer();

    if (frontEl && folder) {
      folder.file(`00_Current_Inspector_Front.svg`, serializer.serializeToString(frontEl));
    }
    if (backEl && folder) {
      folder.file(`00_Current_Inspector_Back.svg`, serializer.serializeToString(backEl));
    }

    // 2. Generate personalized files for every T-shirt in the batch
    if (folder) {
      const garmentsFolder = folder.folder('individual_garments');

      tshirts.forEach((shirt, index) => {
        const safeName = sanitizeFilename(shirt.person_name || `Member_${index + 1}`);
        const safeJersey = sanitizeFilename(shirt.jersey_name || shirt.person_name || 'MEMBER');
        const num = shirt.tshirt_number || `${orderId}-${String(index + 1).padStart(3, '0')}`;

        // Generate Back SVG
        const backSvg = generateBackTshirtSvgString({
          collegeName: order.college_name || 'JK Empress',
          jerseyName: shirt.jersey_name || shirt.person_name || 'MEMBER',
          rollNumber: shirt.roll_number || String(index + 1),
          courseSection: order.department || order.batch || 'Batch 2027',
          graduatingYear: order.batch?.replace(/[^0-9]/g, '') || '2027',
        });

        garmentsFolder?.file(`${num}_${safeJersey}_Back.svg`, backSvg);
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
PRINT OPERATOR INSTRUCTIONS:
- Each T-Shirt Front features that individual member in the CENTER ("YOU")
  surrounded by all classmates in the ${order.collage_shape || 'honeycomb'} layout.
- Each T-Shirt Back features their personalized Jersey Name & Roll Number.
- Use 300 DPI or lossless vector SVG files provided in this archive.
========================================================================
`;

      folder.file(`README_PRODUCTION_MANIFEST.txt`, summaryText);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `${orderId}_Batch_Prints_${tshirts.length}_Tees.zip`);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 60000);
    return true;
  } catch (err: any) {
    console.error('Failed to create batch ZIP:', err);
    throw err;
  }
}
