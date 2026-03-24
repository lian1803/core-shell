// lib/storage/saveImage.ts
// 이미지 저장 및 썸네일 생성 (Supabase Storage + Sharp)

import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'contents';
const THUMBNAIL_SIZE = 512;

export interface SaveImageResult {
  originalUrl: string;
  thumbnailUrl: string;
}

export interface SaveImageOptions {
  userId: string;
  contentId: string;
  sourceUrl: string; // DALL-E에서 받은 임시 URL
}

/**
 * DALL-E 이미지를 다운로드하여 Supabase Storage에 저장
 * - 원본 PNG 저장
 * - WebP 썸네일 생성 (512x512)
 */
export async function saveImageToStorage(
  options: SaveImageOptions
): Promise<SaveImageResult> {
  const { userId, contentId, sourceUrl } = options;

  try {
    // 1. DALL-E 이미지 다운로드
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // 2. Sharp로 이미지 처리
    const originalBuffer = await sharp(imageBuffer)
      .png({ quality: 90 })
      .toBuffer();

    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 3. Supabase Storage에 업로드
    const supabase = createAdminClient();

    const originalPath = `${userId}/${contentId}/original.png`;
    const thumbnailPath = `${userId}/${contentId}/thumbnail.webp`;

    // 원본 이미지 업로드
    const { error: originalError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(originalPath, originalBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (originalError) {
      throw new Error(`Original upload failed: ${originalError.message}`);
    }

    // 썸네일 업로드
    const { error: thumbnailError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (thumbnailError) {
      throw new Error(`Thumbnail upload failed: ${thumbnailError.message}`);
    }

    // 4. Public URL 생성
    const { data: originalUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(originalPath);

    const { data: thumbnailUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbnailPath);

    return {
      originalUrl: originalUrlData.publicUrl,
      thumbnailUrl: thumbnailUrlData.publicUrl,
    };
  } catch (error) {
    console.error('Image save error:', error);
    throw error;
  }
}

/**
 * 기존 이미지 삭제 (재생성 시 사용)
 */
export async function deleteImageFromStorage(
  userId: string,
  contentId: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const filesToDelete = [
      `${userId}/${contentId}/original.png`,
      `${userId}/${contentId}/thumbnail.webp`,
    ];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);

    if (error) {
      console.error('Image delete error:', error);
      // 삭제 실패는 무시 (파일이 없을 수도 있음)
    }
  } catch (error) {
    console.error('Image delete error:', error);
    // 삭제 실패는 무시
  }
}

/**
 * 이미지 교체 (재생성 시 사용)
 */
export async function replaceImage(
  options: SaveImageOptions
): Promise<SaveImageResult> {
  const { userId, contentId } = options;

  // 기존 이미지 삭제
  await deleteImageFromStorage(userId, contentId);

  // 새 이미지 저장
  return saveImageToStorage(options);
}

/**
 * 이미지 다운로드용 URL 생성 (서명된 URL, 1시간 유효)
 */
export async function getSignedDownloadUrl(
  userId: string,
  contentId: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = `${userId}/${contentId}/original.png`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1시간

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}
