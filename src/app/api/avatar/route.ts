import { NextRequest, NextResponse } from 'next/server';
import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';

const NOUN_PROJECT_API_KEY = process.env.NOUN_PROJECT_API_KEY;
const NOUN_PROJECT_API_SECRET = process.env.NOUN_PROJECT_API_SECRET;

// Male and female avatar search terms
const FEMALE_TERMS = ['woman avatar', 'female avatar', 'girl avatar'];
const MALE_TERMS = ['man avatar', 'male avatar', 'boy avatar'];

function createOAuthClient() {
  return new OAuth({
    consumer: {
      key: NOUN_PROJECT_API_KEY!,
      secret: NOUN_PROJECT_API_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string) {
      return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
    },
  });
}

async function searchIcons(query: string, limit: number = 10) {
  const oauth = createOAuthClient();
  const url = `https://api.thenounproject.com/v2/icon?query=${encodeURIComponent(query)}&limit=${limit}&thumbnail_size=200`;

  const requestData = {
    url,
    method: 'GET',
  };

  const headers = oauth.toHeader(oauth.authorize(requestData));

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Noun Project API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get('gender') || 'male';
  const seed = searchParams.get('seed') || '0';
  const format = searchParams.get('format') || 'redirect'; // 'redirect' or 'json'

  const getFallbackUrl = () => {
    const style = gender === 'female' ? 'lorelei' : 'micah';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  if (!NOUN_PROJECT_API_KEY || !NOUN_PROJECT_API_SECRET) {
    const url = getFallbackUrl();
    if (format === 'json') {
      return NextResponse.json({ url });
    }
    return NextResponse.redirect(url);
  }

  try {
    // Use seed to pick a consistent search term and icon
    const seedNum = parseInt(seed.replace(/\D/g, '').slice(0, 8) || '0', 10);
    const terms = gender === 'female' ? FEMALE_TERMS : MALE_TERMS;
    const termIndex = seedNum % terms.length;
    const searchTerm = terms[termIndex];

    const data = await searchIcons(searchTerm, 20);

    if (data.icons && data.icons.length > 0) {
      // Use seed to pick a consistent icon from results
      const iconIndex = seedNum % data.icons.length;
      const icon = data.icons[iconIndex];

      // Get the thumbnail URL
      const thumbnailUrl = icon.thumbnail_url || icon.preview_url;

      if (format === 'json') {
        return NextResponse.json({
          url: thumbnailUrl,
          attribution: icon.attribution,
          iconId: icon.id,
        });
      }
      return NextResponse.redirect(thumbnailUrl);
    }

    // Fallback if no icons found
    const url = getFallbackUrl();
    if (format === 'json') {
      return NextResponse.json({ url });
    }
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Noun Project API error:', error);
    const url = getFallbackUrl();
    if (format === 'json') {
      return NextResponse.json({ url });
    }
    return NextResponse.redirect(url);
  }
}
