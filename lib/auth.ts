// File: lib/auth.ts
import { createUserClient } from "@/utils/supabase/server";

export async function getUserFromRequest(request: Request) {
  // const cookieStore = await cookies();

  // Create a Supabase client on the server side using the request cookies.
  const supabase = await createUserClient();

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
