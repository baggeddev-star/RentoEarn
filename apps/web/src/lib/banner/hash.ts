import sharp from 'sharp';

/**
 * dHash (Difference Hash) implementation for perceptual image hashing.
 * 
 * Algorithm:
 * 1. Convert to grayscale
 * 2. Resize to 9x8 (72 pixels) - we need 9 wide to get 8 differences
 * 3. Compare each pixel to its right neighbor
 * 4. If left pixel > right pixel, set bit to 1, else 0
 * 5. This produces a 64-bit hash (8 rows × 8 comparisons)
 * 
 * The hash is returned as a 16-character hex string (64 bits).
 */
export async function computeDHash(imageBuffer: Buffer): Promise<string> {
  // Resize to 9x8 grayscale
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Compute difference hash
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

  // Convert to 16-character hex string
  return hash.toString(16).padStart(16, '0');
}

/**
 * Computes the Hamming distance between two hex hash strings.
 * This counts the number of differing bits.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  const h1 = BigInt('0x' + hash1);
  const h2 = BigInt('0x' + hash2);
  
  // XOR to find differing bits
  let xor = h1 ^ h2;
  let distance = 0;
  
  // Count set bits (Brian Kernighan's algorithm)
  while (xor > 0) {
    distance++;
    xor &= xor - BigInt(1);
  }
  
  return distance;
}

/**
 * Compares two images using perceptual hashing.
 * Returns the hash distance and whether they match within tolerance.
 */
export async function compareImages(
  image1Buffer: Buffer,
  image2Buffer: Buffer,
  maxDistance: number = 10
): Promise<{ match: boolean; distance: number; hash1: string; hash2: string }> {
  const hash1 = await computeDHash(image1Buffer);
  const hash2 = await computeDHash(image2Buffer);
  const distance = hammingDistance(hash1, hash2);
  
  return {
    match: distance <= maxDistance,
    distance,
    hash1,
    hash2,
  };
}

/**
 * Compares a hash string against an image buffer.
 */
export async function compareHashToImage(
  expectedHash: string,
  imageBuffer: Buffer,
  maxDistance: number = 10
): Promise<{ match: boolean; distance: number; actualHash: string }> {
  const actualHash = await computeDHash(imageBuffer);
  const distance = hammingDistance(expectedHash, actualHash);
  
  return {
    match: distance <= maxDistance,
    distance,
    actualHash,
  };
}
