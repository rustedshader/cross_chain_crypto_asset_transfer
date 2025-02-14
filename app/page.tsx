'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import CrossChainBridge from '@/components/CrossChainBridge';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [session, setSession] = useState<any | undefined>(undefined);
  const supabase = createClientComponentClient();
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session && session.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getSession();
  }, [supabase]);

  // Show a loading state while we fetch the session
  if (session === undefined) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // If not authenticated, prompt the user to log in.
  if (!session) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Welcome to the Cross-Chain Bridge</h2>
        <p className="mb-4">You are not logged in. Please login to use the bridge.</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => router.push('/auth/login')}
        >
          Login
        </button>
      </div>
    );
  }

  // If authenticated, render the CrossChainBridge with userEmail.
  return <CrossChainBridge userEmail={userEmail} />;
}