/**
 * JK EMPRESS — Cloud Storage & Image Validation Engine
 * Supports Supabase Storage with local file storage fallback.
 * Validates actual magic bytes (signatures), restricts file size, and generates signed URLs.
 */

import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { getSupabase } from './db';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export type StorageBucket = 
  | 'student-photos'
  | 'college-logos'
  | 'tshirt-artwork'
  | 'design-previews'
  | 'invoice-files'
  | 'production-files';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates binary magic bytes to guarantee file is a legitimate image.
 * Prevents disguised executable / script uploads.
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; ext?: string; mime?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, ext: 'png', mime: 'image/png' };
  }

  // 3. WebP: RIFF....WEBP
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isRiff && isWebp) {
    return { valid: true, ext: 'webp', mime: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Uploads an image buffer to Supabase Storage or local public storage.
 */
export async function uploadImage(
  buffer: Buffer,
  bucket: StorageBucket = 'student-photos',
  originalFilename = 'photo.jpg'
): Promise<UploadResult> {
  // 1. File size check
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File exceeds maximum allowed size of 5 MB (received ${Math.round(buffer.length / 1024)} KB)`,
    };
  }

  // 2. Magic bytes validation
  const validation = validateImageMagicBytes(buffer);
  if (!validation.valid || !validation.ext) {
    return {
      success: false,
      error: 'Invalid file format. Only legitimate JPEG, PNG, or WebP image files are accepted.',
    };
  }

  // 3. Generate unguessable unique filename
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const filename = `${uniqueId}.${validation.ext}`;

  // 4. Try Supabase Storage first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType: validation.mime,
          upsert: false,
        });

      if (error) {
        console.error(`Supabase storage upload failed for bucket [${bucket}]:`, error.message);
      } else {
        // Generate public or signed URL
        const isPrivate = ['student-photos', 'invoice-files', 'production-files'].includes(bucket);
        if (isPrivate) {
          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7-day signed URL
          if (signedData?.signedUrl) {
            return { success: true, url: signedData.signedUrl, filename };
          }
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filename);
        return { success: true, url: publicData.publicUrl, filename };
      }
    } catch (err: any) {
      console.warn('Supabase upload exception, falling back to local storage:', err.message);
    }
  }

  // 5. Local storage fallback (for development or standalone deployments)
  try {
    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads', bucket);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${bucket}/${filename}`;
    return { success: true, url: publicUrl, filename };
  } catch (err: any) {
    return { success: false, error: `Failed to save file: ${err.message}` };
  }
}
