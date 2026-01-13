import type { XSnapshot } from '@shared/types';

/**
 * X (Twitter) provider interface for fetching profile data.
 */
export interface XProvider {
  /**
   * Fetch a snapshot of a user's X profile.
   * @param username - The X username (without @)
   * @returns Profile snapshot including header image, bio, display name, avatar
   */
  fetchSnapshot(username: string): Promise<XSnapshot>;

  /**
   * Verify that a user has added a specific code to their bio.
   * Used for X account ownership verification.
   * @param username - The X username
   * @param code - The verification code to look for in the bio
   * @returns True if the code is found in the bio
   */
  verifyBioCode(username: string, code: string): Promise<boolean>;
}

export type XProviderType = 'mock' | 'rapidapi';
