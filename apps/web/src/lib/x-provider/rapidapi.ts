import type { XSnapshot } from '@shared/types';
import type { XProvider } from './interface';

/**
 * RapidAPI response structure from twitter241.p.rapidapi.com
 */
interface Twitter241Response {
  result?: {
    data?: {
      user?: {
        result?: {
          __typename: string;
          id: string;
          rest_id: string;
          avatar?: {
            image_url: string;
          };
          core?: {
            created_at: string;
            name: string;
            screen_name: string;
          };
          legacy?: {
            description: string;
            profile_banner_url?: string;
            profile_image_url_https?: string;
            name?: string;
            screen_name?: string;
            followers_count?: number;
            friends_count?: number;
          };
        };
      };
    };
  };
  // Error response structure
  error?: string;
  message?: string;
}

/**
 * RapidAPI X (Twitter) provider for production use.
 * Uses twitter241.p.rapidapi.com API to fetch real profile data.
 */
export class RapidAPIXProvider implements XProvider {
  private apiKey: string;
  private apiHost: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '';
    this.apiHost = process.env.RAPIDAPI_HOST || 'twitter241.p.rapidapi.com';

    if (!this.apiKey) {
      throw new Error('RAPIDAPI_KEY environment variable is required for RapidAPI provider');
    }
  }

  async fetchSnapshot(username: string): Promise<XSnapshot> {
    const normalizedUsername = username.replace('@', '').toLowerCase();

    try {
      const response = await fetch(
        `https://${this.apiHost}/user?username=${encodeURIComponent(normalizedUsername)}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.apiHost,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
      }

      const data: Twitter241Response = await response.json();

      // Check for API errors
      if (data.error || data.message) {
        throw new Error(data.error || data.message || 'Unknown API error');
      }

      // Extract user data from nested response structure
      const userResult = data.result?.data?.user?.result;
      if (!userResult) {
        throw new Error(`User @${normalizedUsername} not found`);
      }

      const legacy = userResult.legacy;
      const core = userResult.core;
      const avatar = userResult.avatar;

      // Map RapidAPI response to our XSnapshot format
      // Profile banner URL from legacy object
      // Avatar from avatar object (higher quality) or legacy
      return {
        headerImageUrl: legacy?.profile_banner_url || null,
        bioText: legacy?.description || '',
        displayName: core?.name || legacy?.name || normalizedUsername,
        avatarUrl: avatar?.image_url?.replace('_normal', '_400x400') || 
                   legacy?.profile_image_url_https?.replace('_normal', '_400x400') || 
                   null,
      };
    } catch (error) {
      console.error(`[RapidAPI] Error fetching snapshot for @${normalizedUsername}:`, error);
      throw error;
    }
  }

  async verifyBioCode(username: string, code: string): Promise<boolean> {
    try {
      const snapshot = await this.fetchSnapshot(username);
      return snapshot.bioText.includes(code);
    } catch (error) {
      console.error(`[RapidAPI] Error verifying bio code for @${username}:`, error);
      return false;
    }
  }

  /**
   * Get the Twitter user ID for a username.
   * Useful for linking accounts via OAuth.
   */
  async getUserId(username: string): Promise<string | null> {
    const normalizedUsername = username.replace('@', '').toLowerCase();

    try {
      const response = await fetch(
        `https://${this.apiHost}/user?username=${encodeURIComponent(normalizedUsername)}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.apiHost,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data: Twitter241Response = await response.json();
      return data.result?.data?.user?.result?.rest_id || null;
    } catch (error) {
      console.error(`[RapidAPI] Error getting user ID for @${normalizedUsername}:`, error);
      return null;
    }
  }
}
