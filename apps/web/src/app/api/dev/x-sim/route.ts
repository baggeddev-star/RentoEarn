import { NextRequest, NextResponse } from 'next/server';
import { updateMockState, getMockState, setHeaderMatch } from '@/lib/x-provider';

/**
 * GET /api/dev/x-sim
 * Get mock X profile data for testing
 * 
 * Query params:
 * - username: X username to fetch
 * - headerMatch: 'true' or 'false' to control header matching behavior
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.X_PROVIDER !== 'mock') {
    return NextResponse.json(
      { success: false, error: 'Dev endpoint not available in production' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username') || 'testcreator';
  const headerMatch = searchParams.get('headerMatch');

  // Update header match state if provided
  if (headerMatch !== null) {
    setHeaderMatch(username, headerMatch === 'true');
  }

  const state = getMockState(username);

  return NextResponse.json({
    success: true,
    data: {
      username,
      state: state || {
        headerImageUrl: `http://localhost:3000/uploads/mock/${username}-header.jpg`,
        bioText: `Bio for @${username}`,
        displayName: username,
        avatarUrl: 'https://pbs.twimg.com/profile_images/default_avatar.png',
        headerMatch: true,
      },
    },
  });
}

/**
 * POST /api/dev/x-sim
 * Update mock X profile state for testing
 * 
 * Body:
 * - username: X username to update
 * - headerImageUrl: New header URL
 * - bioText: New bio text
 * - displayName: New display name
 * - avatarUrl: New avatar URL
 * - headerMatch: Whether header should match expected
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.X_PROVIDER !== 'mock') {
    return NextResponse.json(
      { success: false, error: 'Dev endpoint not available in production' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { username, ...updates } = body;

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'Username required' },
      { status: 400 }
    );
  }

  updateMockState(username, updates);

  const state = getMockState(username);

  return NextResponse.json({
    success: true,
    data: {
      username,
      state,
    },
  });
}
