import type { XSnapshot } from '@shared/types';
import type { XProvider } from './interface';

/**
 * Mock state that can be controlled for testing.
 * In dev mode, this can be modified via the /api/dev/x-sim endpoint.
 */
interface MockState {
  [username: string]: {
    headerImageUrl: string | null;
    bioText: string;
    displayName: string;
    avatarUrl: string | null;
    headerMatch: boolean; // If false, returns a different header URL to simulate mismatch
  };
}

// Global mock state - can be modified via dev API
const mockState: MockState = {
  testcreator: {
    headerImageUrl: 'http://localhost:3000/uploads/mock/testcreator-header.jpg',
    bioText: 'Crypto enthusiast | Web3 builder | DeFi degen',
    displayName: 'Test Creator',
    avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
    headerMatch: true,
  },
  creator2: {
    headerImageUrl: 'http://localhost:3000/uploads/mock/creator2-header.jpg',
    bioText: 'NFT collector | Building in public',
    displayName: 'Creator Two',
    avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
    headerMatch: true,
  },
};

/**
 * Mock X provider for local development and testing.
 * Returns deterministic data that can be controlled for testing scenarios.
 */
export class MockXProvider implements XProvider {
  async fetchSnapshot(username: string): Promise<XSnapshot> {
    const normalizedUsername = username.toLowerCase().replace('@', '');
    const state = mockState[normalizedUsername];

    if (!state) {
      // Return default mock data for unknown users
      return {
        headerImageUrl: `http://localhost:3000/uploads/mock/${normalizedUsername}-header.jpg`,
        bioText: `Bio for @${normalizedUsername}`,
        displayName: normalizedUsername,
        avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
      };
    }

    // If headerMatch is false, return a different URL to simulate mismatch
    const headerUrl = state.headerMatch
      ? state.headerImageUrl
      : `http://localhost:3000/uploads/mock/${normalizedUsername}-header-DIFFERENT.jpg`;

    return {
      headerImageUrl: headerUrl,
      bioText: state.bioText,
      displayName: state.displayName,
      avatarUrl: state.avatarUrl,
    };
  }

  async verifyBioCode(username: string, code: string): Promise<boolean> {
    const normalizedUsername = username.toLowerCase().replace('@', '');
    const state = mockState[normalizedUsername];

    if (!state) {
      return false;
    }

    return state.bioText.includes(code);
  }
}

/**
 * Update mock state for a user. Used by dev API.
 */
export function updateMockState(
  username: string,
  updates: Partial<MockState[string]>
): void {
  const normalizedUsername = username.toLowerCase().replace('@', '');
  
  if (!mockState[normalizedUsername]) {
    mockState[normalizedUsername] = {
      headerImageUrl: null,
      bioText: '',
      displayName: normalizedUsername,
      avatarUrl: null,
      headerMatch: true,
    };
  }

  Object.assign(mockState[normalizedUsername], updates);
}

/**
 * Get current mock state for a user.
 */
export function getMockState(username: string): MockState[string] | undefined {
  const normalizedUsername = username.toLowerCase().replace('@', '');
  return mockState[normalizedUsername];
}

/**
 * Set header match state for testing hard cancel scenarios.
 */
export function setHeaderMatch(username: string, match: boolean): void {
  updateMockState(username, { headerMatch: match });
}
