import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'citizen' or 'government'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await setUserData(session.user);
      }
      setLoading(false);
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await setUserData(session.user);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserData = async (authUser) => {
    // Check if user is a citizen
    const { data: citizenData } = await supabase
      .from('citizens')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (citizenData) {
      setUser({ ...authUser, ...citizenData });
      setUserRole('citizen');
      return;
    }

    // Check if user is government staff
    const { data: staffData } = await supabase
      .from('government_staff')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (staffData) {
      setUser({ ...authUser, ...staffData });
      setUserRole('government');
      return;
    }

    // If no role found, default to citizen
    setUser(authUser);
    setUserRole('citizen');
  };

  // Citizen signup with OTP verification
  const signUpCitizen = async (email, password, name) => {
    try {
      // First create the citizen record
      const { data: citizenData, error: citizenError } = await supabase
        .from('citizens')
        .insert([{ 
          name, 
          email, 
          password, // In production, hash this password
          is_verified: false 
        }])
        .select()
        .single();

      if (citizenError) throw citizenError;

      // Then create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Citizen login
  const signInCitizen = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Check if citizen is verified
      const { data: citizenData } = await supabase
        .from('citizens')
        .select('is_verified')
        .eq('email', email)
        .single();

      if (citizenData && !citizenData.is_verified) {
        await supabase.auth.signOut();
        throw new Error('Please verify your email before logging in');
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Government staff login
  const signInGovernment = async (uniqueId, password) => {
    try {
      // Check government staff credentials
      const { data: staffData, error: staffError } = await supabase
        .from('government_staff')
        .select('*')
        .eq('unique_id', uniqueId)
        .eq('password', password)
        .single();

      if (staffError || !staffData) {
        throw new Error('Invalid credentials');
      }

      // Create a session for government staff using their email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: staffData.email,
        password: password
      });

      // If auth fails, create a custom session
      if (error) {
        setUser(staffData);
        setUserRole('government');
        localStorage.setItem('govStaffSession', JSON.stringify(staffData));
        return { data: { user: staffData }, error: null };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    localStorage.removeItem('govStaffSession');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserRole(null);
    }
    return { error };
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;

      // Update citizen verification status
      await supabase
        .from('citizens')
        .update({ is_verified: true })
        .eq('email', email);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signUpCitizen,
    signInCitizen,
    signInGovernment,
    signOut,
    verifyOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
