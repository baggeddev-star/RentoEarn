import sharp from 'sharp';
import crypto from 'crypto';
import { BANNER_WIDTH, BANNER_HEIGHT } from '@shared/types';
import type { BannerRenderResult } from '@shared/types';
import { computeDHash } from './hash';
import { getStorage } from '../storage';

export interface RenderBannerOptions {
  campaignId: string;
  inputBuffer: Buffer;
}

/**
 * Renders a canonical banner image from sponsor's uploaded creative.
 * - Resizes/crops to exactly 1500x500
 * - Converts to JPEG for consistency
 * - Computes SHA-256 and perceptual hash
 * - Stores the canonical output
 */
export async function renderBanner(options: RenderBannerOptions): Promise<BannerRenderResult> {
  const { campaignId, inputBuffer } = options;

  // Process image: resize/crop to exact dimensions, convert to JPEG
  const processedBuffer = await sharp(inputBuffer)
    .resize(BANNER_WIDTH, BANNER_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({
      quality: 90,
      mozjpeg: true,
    })
    .toBuffer();

  // Compute SHA-256 hash
  const sha256 = crypto.createHash('sha256').update(processedBuffer).digest('hex');

  // Compute perceptual hash (dHash)
  const perceptualHash = await computeDHash(processedBuffer);

  // Store the canonical banner
  const storage = getStorage();
  const key = `banners/${campaignId}/canonical.jpg`;
  const url = await storage.upload(key, processedBuffer, 'image/jpeg');

  return {
    url,
    sha256,
    perceptualHash,
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
  };
}

/**
 * Normalizes an image for hash comparison.
 * Downloads from URL, resizes to standard dimensions, converts to RGB.
 */
export async function normalizeImageForComparison(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(BANNER_WIDTH, BANNER_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .removeAlpha()
    .jpeg({
      quality: 90,
    })
    .toBuffer();
}

/**
 * Downloads an image from a URL and returns the buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
