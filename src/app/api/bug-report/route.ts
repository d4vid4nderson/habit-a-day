import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get form data (for file uploads)
    const formData = await request.formData();

    const category = formData.get('category') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const consoleLogs = formData.get('consoleLogs') as string;
    const userAgent = formData.get('userAgent') as string;
    const screenSize = formData.get('screenSize') as string;
    const currentUrl = formData.get('currentUrl') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    if (screenshot && screenshot.size > 0) {
      const fileExt = screenshot.name.split('.').pop() || 'png';
      const fileName = `bug-reports/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('bug-reports')
        .upload(fileName, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('bug-reports')
          .getPublicUrl(fileName);
        screenshotUrl = urlData.publicUrl;
      }
    }

    // Store bug report in database
    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        category,
        title,
        description,
        console_logs: consoleLogs,
        user_agent: userAgent,
        screen_size: screenSize,
        current_url: currentUrl,
        ip_address: ipAddress,
        screenshot_url: screenshotUrl,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bug report:', error);
      // If table doesn't exist, fall back to email
      if (error.code === '42P01') {
        // Table doesn't exist - just return success and let the email flow handle it
        return NextResponse.json({
          success: true,
          message: 'Bug report received',
          fallbackToEmail: true
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      reportId: data.id,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Bug report submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    );
  }
}
