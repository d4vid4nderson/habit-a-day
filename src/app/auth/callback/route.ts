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
      const user = sessionData.user;

      // Extract OAuth provider avatar URL from user metadata
      const userMetadata = user.user_metadata || {};
      const oauthAvatarUrl = userMetadata.avatar_url || userMetadata.picture || null;
      const oauthFullName = userMetadata.full_name || userMetadata.name || null;

      // Check if profile exists and get current state
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed, avatar_url, oauth_avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();

      // Always update the OAuth avatar URL so we have a fallback
      // Also sync to avatar_url if user hasn't set a custom one
      if (profile) {
        let updates: Record<string, string | null> = {};

        // Always keep oauth_avatar_url in sync with the provider's current photo
        if (oauthAvatarUrl && oauthAvatarUrl !== profile.oauth_avatar_url) {
          updates.oauth_avatar_url = oauthAvatarUrl;
        }

        // Set avatar_url to OAuth avatar if:
        // - No avatar is set, OR
        // - Current avatar is an OAuth URL (user is using provider photo, so keep it updated)
        const isOAuthAvatar = profile.avatar_url && (
          profile.avatar_url.includes('googleusercontent.com') ||
          profile.avatar_url.includes('fbcdn.net') ||
          profile.avatar_url.includes('graph.facebook.com') ||
          profile.avatar_url.includes('appleid.apple.com')
        );

        if (oauthAvatarUrl && (!profile.avatar_url || isOAuthAvatar)) {
          updates.avatar_url = oauthAvatarUrl;
        }

        // Parse first and last name from OAuth if not already set
        if (!profile.first_name && !profile.last_name && oauthFullName) {
          const nameParts = oauthFullName.trim().split(' ');
          if (nameParts.length >= 2) {
            updates.first_name = nameParts[0];
            updates.last_name = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1) {
            updates.first_name = nameParts[0];
          }
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile with OAuth data:', updateError);
          }
        }
      }

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
