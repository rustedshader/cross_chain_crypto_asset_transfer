// File: app/api/avatar/update/route.ts
import { createUserClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { avatarBlob } = await request.json();
    const supabase = await createUserClient();

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update user metadata with avatar blob
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatarBlob: avatarBlob }
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}