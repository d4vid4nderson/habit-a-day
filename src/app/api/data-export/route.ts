import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [
      profileResult,
      goalsResult,
      bathroomResult,
      waterResult,
      foodResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_goals').select('*').eq('user_id', user.id),
      supabase.from('bathroom_entries').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
      supabase.from('water_entries').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
      supabase.from('food_entries').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
    ]);

    const profile = profileResult.data;
    const goals = goalsResult.data || [];
    const bathroomEntries = bathroomResult.data || [];
    const waterEntries = waterResult.data || [];
    const foodEntries = foodResult.data || [];

    // Generate CSV content
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = '';

    // Profile Section
    csvContent += '=== PROFILE INFORMATION ===\n';
    csvContent += 'Field,Value\n';
    if (profile) {
      csvContent += `Email,"${profile.email || ''}"\n`;
      csvContent += `First Name,"${profile.first_name || ''}"\n`;
      csvContent += `Last Name,"${profile.last_name || ''}"\n`;
      csvContent += `Age,"${profile.age || ''}"\n`;
      csvContent += `Gender,"${profile.gender || ''}"\n`;
      csvContent += `Height (ft),"${profile.height_feet || ''}"\n`;
      csvContent += `Height (in),"${profile.height_inches || ''}"\n`;
      csvContent += `Height (cm),"${profile.height_cm || ''}"\n`;
      csvContent += `Height Unit,"${profile.height_unit || ''}"\n`;
      csvContent += `Weight,"${profile.weight || ''}"\n`;
      csvContent += `Weight Unit,"${profile.weight_unit || ''}"\n`;
      csvContent += `Theme,"${profile.theme || ''}"\n`;
      csvContent += `Terms Accepted,"${profile.terms_accepted_at || 'Not accepted'}"\n`;
      csvContent += `Terms Version,"${profile.terms_version || ''}"\n`;
      csvContent += `Account Created,"${profile.created_at || ''}"\n`;
      csvContent += `Last Updated,"${profile.updated_at || ''}"\n`;
    }

    // Goals Section
    csvContent += '\n=== PERSONAL GOALS ===\n';
    csvContent += 'Order,Goal,Created At\n';
    goals.forEach((goal: { display_order: number; goal_text: string; created_at: string }) => {
      csvContent += `${goal.display_order},"${(goal.goal_text || '').replace(/"/g, '""')}","${goal.created_at}"\n`;
    });

    // Bathroom Entries Section
    csvContent += '\n=== BATHROOM ENTRIES ===\n';
    csvContent += 'Date,Time,Type,Urine Color,Notes\n';
    bathroomEntries.forEach((entry: { timestamp: number; type: string; urine_color?: number; notes?: string }) => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      csvContent += `"${dateStr}","${timeStr}","${entry.type}","${entry.urine_color || ''}","${(entry.notes || '').replace(/"/g, '""')}"\n`;
    });

    // Water Entries Section
    csvContent += '\n=== WATER INTAKE ENTRIES ===\n';
    csvContent += 'Date,Time,Amount,Unit,Notes\n';
    waterEntries.forEach((entry: { timestamp: number; amount: number; unit: string; notes?: string }) => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      csvContent += `"${dateStr}","${timeStr}","${entry.amount}","${entry.unit}","${(entry.notes || '').replace(/"/g, '""')}"\n`;
    });

    // Food Entries Section
    csvContent += '\n=== FOOD JOURNAL ENTRIES ===\n';
    csvContent += 'Date,Time,Meal Type,Calories,Notes\n';
    foodEntries.forEach((entry: { timestamp: number; meal_type: string; calories: number; notes?: string }) => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      csvContent += `"${dateStr}","${timeStr}","${entry.meal_type}","${entry.calories}","${(entry.notes || '').replace(/"/g, '""')}"\n`;
    });

    // Summary
    csvContent += '\n=== DATA EXPORT SUMMARY ===\n';
    csvContent += `Export Date,"${new Date().toISOString()}"\n`;
    csvContent += `Total Bathroom Entries,"${bathroomEntries.length}"\n`;
    csvContent += `Total Water Entries,"${waterEntries.length}"\n`;
    csvContent += `Total Food Entries,"${foodEntries.length}"\n`;
    csvContent += `Total Goals,"${goals.length}"\n`;

    // Return CSV as downloadable file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="habit-a-day-data-export-${timestamp}.csv"`);

    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
