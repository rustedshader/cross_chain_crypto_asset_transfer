// File: lib/auth.ts
import { cookies } from "next/headers";
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from "@supabase/ssr";

export async function getUserFromRequest(request: Request) {
  const cookieStore = await cookies();

  // Create a Supabase client on the server side using the request cookies.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
