import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '36px',
          border: '6px solid transparent',
          backgroundImage: 'linear-gradient(#18181b, #18181b), linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #14b8a6 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* Lucide circle-check icon */}
        <svg
          width="90"
          height="90"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="url(#grad)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="url(#grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899"/>
              <stop offset="50%" stopColor="#a855f7"/>
              <stop offset="100%" stopColor="#14b8a6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
