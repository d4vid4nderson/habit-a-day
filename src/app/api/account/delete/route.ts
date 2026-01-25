import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    // Get the current user from the session
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Create admin client to delete user from auth.users
    // This requires SUPABASE_SERVICE_ROLE_KEY environment variable
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get counts of user data before deletion for confirmation
    const [
      { count: profileCount },
      { count: bathroomCount },
      { count: waterCount },
      { count: foodCount },
      { count: ptCount },
      { count: goalsCount },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('id', userId),
      supabaseAdmin.from('bathroom_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('water_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('food_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('pt_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('user_goals').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    // Delete user avatar from storage if exists
    const { data: avatarFiles } = await supabaseAdmin.storage
      .from('avatars')
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const filesToDelete = avatarFiles.map(file => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from('avatars').remove(filesToDelete);
    }

    // Delete the user from auth.users (this cascades to all other tables)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 }
      );
    }

    // Return confirmation of deleted data
    return NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
      deletedData: {
        email: userEmail,
        profile: profileCount || 0,
        bathroomEntries: bathroomCount || 0,
        waterEntries: waterCount || 0,
        foodEntries: foodCount || 0,
        ptEntries: ptCount || 0,
        goals: goalsCount || 0,
        avatarFiles: avatarFiles?.length || 0,
      },
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
