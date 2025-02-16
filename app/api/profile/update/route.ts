// File: app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  const supabase = await createAdminClient();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const updatedUser = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { name },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
