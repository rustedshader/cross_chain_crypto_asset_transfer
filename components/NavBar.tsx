'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push('/auth/login');
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div>
        {session && (
          <>
            <Link href="/" className="mr-4 font-bold">
              Home
            </Link>
            <Link href="/profile" className="mr-4">
              Profile
            </Link>
            <Link href="/transactions" className="mr-4">
              Transactions
            </Link>
          </>
        )}
      </div>
      <div>
        {session ? (
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <>
            <Link href="/auth/login" className="mr-4">
              Login
            </Link>
            <Link href="/auth/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}