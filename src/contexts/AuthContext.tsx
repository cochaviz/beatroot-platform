import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'student' | 'instructor';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithDiscord: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileFetchMaxAttempts = 5;
  const profileFetchDelayMs = 400;

  const fetchProfile = useCallback(async (userId: string, attempt = 0): Promise<void> => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    if (profileData) {
      setProfile(profileData);
      return;
    }

    if (attempt < profileFetchMaxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, profileFetchDelayMs * (attempt + 1)));
      return fetchProfile(userId, attempt + 1);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error retrieving user for profile creation:', userError);
      setProfile(null);
      return;
    }

    const supabaseUser = userData.user;

    if (!supabaseUser) {
      setProfile(null);
      return;
    }

    const fallbackName =
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      supabaseUser.user_metadata?.user_name ??
      supabaseUser.email ??
      '';

    const fallbackAvatar =
      supabaseUser.user_metadata?.avatar_url ??
      supabaseUser.user_metadata?.picture ??
      supabaseUser.user_metadata?.avatar ??
      null;

    const { data: createdProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email: supabaseUser.email,
        full_name: fallbackName,
        avatar_url: fallbackAvatar,
        role: 'student' as UserRole,
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error creating profile for user:', upsertError);
      setProfile(null);
      return;
    }

    setProfile(createdProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [fetchProfile, user]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Error getting session:', error);
        // Clear state if session is invalid
        setSession(null);
        setUser(null);
        setProfile(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  const signInWithDiscord = async () => {
    const { data: existingSession } = await supabase.auth.getSession();

    if (existingSession.session?.user) {
      setSession(existingSession.session);
      setUser(existingSession.session.user);
      await fetchProfile(existingSession.session.user.id);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'identify email guilds',
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // If session doesn't exist, we can still clear local state
      console.warn('Sign out error (session may already be invalid):', error);

      // Clear local state regardless of server response
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-recovery`,
    });

    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signInWithDiscord,
      signOut,
      refreshProfile,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};