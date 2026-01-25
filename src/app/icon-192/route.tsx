import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181b',
          borderRadius: '38px',
          border: '8px solid transparent',
          backgroundImage: 'linear-gradient(#18181b, #18181b), linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #14b8a6 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* Lucide circle-check icon */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="url(#grad192)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="url(#grad192)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="grad192" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899"/>
              <stop offset="50%" stopColor="#a855f7"/>
              <stop offset="100%" stopColor="#14b8a6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
