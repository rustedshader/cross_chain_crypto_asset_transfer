// File: app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/utils/supabase/client';

import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  email: string;
  name: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Fetch the current session and profile details
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const user = session.user;
      setProfile({ id: user.id, email: user.email ?? '', name: user.user_metadata.name || null });
      setName(user.user_metadata.name || '');
    };
    fetchProfile();
  }, [router, supabase]);

  const handleUpdate = async () => {
    setError('');
    setMessage('');
    // Update via a custom API endpoint
    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Profile updated successfully!');
    } else {
      setError(data.error || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {profile && (
        <>
          <p className="mb-2"><strong>Email:</strong> {profile.email}</p>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button onClick={handleUpdate}>Update Profile</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </div>
        </>
      )}
    </div>
  );
}
