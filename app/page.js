'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/db';
import { fetchProfile } from '../lib/data';
import AuthPage from '../components/AuthPage';
import PendingApproval from '../components/PendingApproval';
import ObraApp from '../components/ObraApp';

export default function Home() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch (e) {
      console.error('Profile load error:', e);
      setProfile(null);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#1a365d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#718096', fontSize: 14 }}>Carregando...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <AuthPage />;
  }

  // Logged in but not approved
  if (profile && !profile.approved) {
    return <PendingApproval email={session.user.email} onSignOut={handleSignOut} />;
  }

  // Logged in and approved
  return <ObraApp session={session} profile={profile} onSignOut={handleSignOut} />;
}
