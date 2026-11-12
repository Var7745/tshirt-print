import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, StorageBucket } from '@/lib/storage';
import { checkRateLimit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (15 uploads per 5 minutes)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateKey = `upload_${ip}`;
    const rateCheck = checkRateLimit(rateKey, 15, 300);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload rate limit exceeded. Please wait ${Math.ceil(rateCheck.resetInSeconds)} seconds before uploading again.`,
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as StorageBucket) || 'student-photos';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, bucket, file.name);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
