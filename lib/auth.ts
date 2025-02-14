// File: lib/auth.ts
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getUserFromRequest(request: Request) {
  // Create a Supabase client on the server side using the request cookies.
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    return null;
  }
  // Return an object containing user details (you can extend this as needed)
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata.name || null,
  };
}
