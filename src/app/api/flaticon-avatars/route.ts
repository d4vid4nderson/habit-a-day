import { NextRequest, NextResponse } from 'next/server';

const FLATICON_API_KEY = process.env.FLATICON_API_KEY;

// Cache token and avatars to avoid repeated API calls
let cachedToken: { token: string; expires: number } | null = null;
let cachedAvatars: { urls: string[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expires * 1000 - 60000) {
    return cachedToken.token;
  }

  const response = await fetch('https://api.flaticon.com/v3/app/authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `apikey=${FLATICON_API_KEY}`,
  });

  if (!response.ok) {
    throw new Error(`Flaticon auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.data.token,
    expires: data.data.expires,
  };

  return cachedToken.token;
}

async function searchPackIcons(token: string, packId: string): Promise<string[]> {
  // Search for icons with the pack filter
  const response = await fetch(
    `https://api.flaticon.com/v3/search/icons/priority?q=avatar&packId=${packId}&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Flaticon search failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract PNG URLs from results
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((icon: any) =>
      icon.images?.png?.['256'] ||
      icon.images?.png?.['128'] ||
      icon.images?.png?.['512'] ||
      icon.images?.svg
    ).filter(Boolean);
  }

  return [];
}

async function getPackDetails(token: string, packId: string): Promise<string[]> {
  // Try to get pack details directly
  const response = await fetch(
    `https://api.flaticon.com/v3/item/pack/${packId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    // Pack endpoint failed, try search instead
    return searchPackIcons(token, packId);
  }

  const data = await response.json();

  // Get icon URLs from pack data
  if (data.data?.icons && Array.isArray(data.data.icons)) {
    return data.data.icons.map((icon: any) =>
      icon.images?.png?.['256'] ||
      icon.images?.png?.['128'] ||
      icon.images?.svg
    ).filter(Boolean);
  }

  // Fallback to search
  return searchPackIcons(token, packId);
}

export async function GET(request: NextRequest) {
  if (!FLATICON_API_KEY) {
    return NextResponse.json(
      { error: 'Flaticon API key not configured' },
      { status: 500 }
    );
  }

  // Return cached avatars if fresh
  if (cachedAvatars && Date.now() - cachedAvatars.timestamp < CACHE_DURATION) {
    return NextResponse.json({ avatars: cachedAvatars.urls });
  }

  try {
    const token = await getAuthToken();

    // Spring Avatars pack - try different ID formats
    // The URL is /packs/spring-avatars-12 so the ID might be numeric
    const packIds = ['spring-avatars-12', '6846766', '6846765'];

    let avatarUrls: string[] = [];

    for (const packId of packIds) {
      try {
        avatarUrls = await getPackDetails(token, packId);
        if (avatarUrls.length > 0) break;
      } catch (e) {
        continue;
      }
    }

    // If pack fetch failed, search for spring avatars
    if (avatarUrls.length === 0) {
      const searchResponse = await fetch(
        `https://api.flaticon.com/v3/search/icons/priority?q=spring+avatar+person&limit=30`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && Array.isArray(searchData.data)) {
          avatarUrls = searchData.data.map((icon: any) =>
            icon.images?.png?.['256'] ||
            icon.images?.png?.['128'] ||
            icon.images?.svg
          ).filter(Boolean);
        }
      }
    }

    // Cache the results
    cachedAvatars = {
      urls: avatarUrls,
      timestamp: Date.now(),
    };

    return NextResponse.json({ avatars: avatarUrls });
  } catch (error) {
    console.error('Flaticon API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
