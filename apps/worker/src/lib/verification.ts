import sharp from 'sharp';

/**
 * Compute dHash (difference hash) for an image buffer.
 * Returns a 16-character hex string (64-bit hash).
 */
export async function computeDHash(imageBuffer: Buffer): Promise<string> {
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = BigInt(0);
  let bitPosition = 0;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const leftPixel = data[y * 9 + x];
      const rightPixel = data[y * 9 + x + 1];

      if (leftPixel > rightPixel) {
        hash |= BigInt(1) << BigInt(bitPosition);
      }
      bitPosition++;
    }
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * Compute Hamming distance between two hex hash strings.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  const h1 = BigInt('0x' + hash1);
  const h2 = BigInt('0x' + hash2);

  let xor = h1 ^ h2;
  let distance = 0;

  while (xor > 0) {
    distance++;
    xor &= xor - BigInt(1);
  }

  return distance;
}

/**
 * Download an image from URL and return as buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Normalize an image for comparison (resize to 1500x500, remove alpha).
 */
export async function normalizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1500, 500, { fit: 'cover', position: 'center' })
    .removeAlpha()
    .jpeg({ quality: 90 })
    .toBuffer();
}

export interface VerificationResult {
  match: boolean;
  hashDistance: number;
  expectedHash: string;
  actualHash: string;
  headerUrl: string | null;
  notes: string;
}

/**
 * Verify a header image against expected hash.
 */
export async function verifyHeader(
  headerUrl: string | null,
  expectedHash: string,
  maxDistance: number
): Promise<VerificationResult> {
  if (!headerUrl) {
    return {
      match: false,
      hashDistance: -1,
      expectedHash,
      actualHash: '',
      headerUrl: null,
      notes: 'No header image URL provided',
    };
  }

  try {
    // Download and normalize the live header
    const liveBuffer = await downloadImage(headerUrl);
    const normalizedBuffer = await normalizeImage(liveBuffer);
    const actualHash = await computeDHash(normalizedBuffer);
    const distance = hammingDistance(expectedHash, actualHash);

    return {
      match: distance <= maxDistance,
      hashDistance: distance,
      expectedHash,
      actualHash,
      headerUrl,
      notes: distance <= maxDistance
        ? `Match: distance ${distance} <= ${maxDistance}`
        : `MISMATCH: distance ${distance} > ${maxDistance}`,
    };
  } catch (error) {
    return {
      match: false,
      hashDistance: -1,
      expectedHash,
      actualHash: '',
      headerUrl,
      notes: `Error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
