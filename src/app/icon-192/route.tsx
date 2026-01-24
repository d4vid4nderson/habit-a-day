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
          background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #3b82f6 100%)',
          borderRadius: '38px',
          padding: '10px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#18181b',
            borderRadius: '30px',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="26"
              stroke="url(#iconGrad192)"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M24 40 L34 50 L56 26"
              stroke="url(#iconGrad192)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <defs>
              <linearGradient id="iconGrad192" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6"/>
                <stop offset="50%" stopColor="#06b6d4"/>
                <stop offset="100%" stopColor="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
