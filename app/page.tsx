"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NFTGallery from "@/components/NFTGallery";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [session, setSession] = useState<any | undefined>(undefined);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, [supabase]);

  if (session === undefined) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Welcome to the NFT Gallery</h2>
        <p className="mb-4">You are not logged in. Please login to continue.</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => router.push("/auth/login")}
        >
          Login
        </button>
      </div>
    );
  }

  return <NFTGallery />;
}
