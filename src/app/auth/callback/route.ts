import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // Check if profile setup is completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', sessionData.user.id)
        .single();

      // Determine redirect path based on profile completion
      const redirectPath = profile?.profile_completed === true ? next : '/auth/setup';

      const getRedirectUrl = (path: string) => {
        if (isLocalEnv) {
          return `${origin}${path}`;
        } else if (forwardedHost) {
          return `https://${forwardedHost}${path}`;
        } else {
          return `${origin}${path}`;
        }
      };

      return NextResponse.redirect(getRedirectUrl(redirectPath));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}
