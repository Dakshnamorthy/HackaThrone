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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check active Supabase Auth session
    const getSession = async () => {
      setLoading(true);
      
      try {
        // First check localStorage for faster initial load
        const savedUser = localStorage.getItem('civicapp_user');
        const savedRole = localStorage.getItem('civicapp_role');
        
        if (savedUser && savedRole) {
          setUser(JSON.parse(savedUser));
          setUserRole(savedRole);
          setLoading(false); // Set loading false immediately for cached data
        }

        // Then verify with Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Only fetch user data if we don't have cached data or if user ID changed
          if (!savedUser || JSON.parse(savedUser).id !== session.user.id) {
            await setUserData(session.user);
          }
        } else if (savedRole !== 'government') {
          // Clear cache if no session and not government user
          localStorage.removeItem('civicapp_user');
          localStorage.removeItem('civicapp_role');
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await setUserData(session.user);
      } else {
        // Only clear if it's not a government user
        const savedRole = localStorage.getItem('civicapp_role');
        if (savedRole !== 'government') {
          setUser(null);
          setUserRole(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserData = async (authUser) => {
    // Set user data immediately with auth info for faster UI response
    const immediateUserData = {
      ...authUser,
      name: authUser.user_metadata?.name || 'User'
    };
    
    setUser(immediateUserData);
    setUserRole('citizen');
    localStorage.setItem('civicapp_user', JSON.stringify(immediateUserData));
    localStorage.setItem('civicapp_role', 'citizen');

    // Fetch additional citizen data in background (non-blocking)
    try {
      const { data: citizenData } = await supabase
        .from('citizens')
        .select('name')
        .eq('id', authUser.id)
        .single();

      if (citizenData?.name && citizenData.name !== immediateUserData.name) {
        // Update with database name if different
        const updatedUserData = {
          ...authUser,
          name: citizenData.name
        };
        
        setUser(updatedUserData);
        localStorage.setItem('civicapp_user', JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error('Error fetching citizen data (non-blocking):', error);
      // Continue with immediate data - don't block the login
    }
  };

  // Citizen signup with Supabase Auth OTP
  const signUpCitizen = async (email, password, name) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth signup with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name // Store name in user metadata
          }
        }
      });

      if (authError) throw authError;

      // Create citizen record in our database
      if (authData.user) {
        const { error: citizenError } = await supabase
          .from('citizens')
          .insert([{ 
            id: authData.user.id, // Use Supabase Auth user ID
            name, 
            email, 
            password, // Store for our custom government login compatibility
            is_verified: false // Will be updated when email is confirmed
          }]);

        if (citizenError) {
          console.warn('Could not create citizen record:', citizenError);
          // Don't fail the signup if citizen record creation fails
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Citizen login with Supabase Auth
  const signInCitizen = async (email, password) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (authData.user && !authData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please verify your email before logging in. Check your email for the confirmation link.');
      }

      // Don't fetch citizen data here - let the auth state listener handle it
      // This reduces login time significantly
      
      return { data: authData, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Government staff login - optimized for speed
  const signInGovernment = async (uniqueId, password) => {
    try {
      setLoading(true);
      
      // Select only essential fields for faster query
      const { data: staffData, error } = await supabase
        .from('government_staff')
        .select('id, unique_id, name, department, role')
        .eq('unique_id', uniqueId)
        .eq('password', password)
        .single();

      if (error || !staffData) {
        throw new Error('Invalid staff ID or password');
      }

      // Set user session immediately
      setUser(staffData);
      setUserRole('government');
      
      // Save to localStorage for faster future loads
      localStorage.setItem('civicapp_user', JSON.stringify(staffData));
      localStorage.setItem('civicapp_role', 'government');

      return { data: staffData, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Sign out from Supabase Auth (for citizens)
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signOut error:', error);
      // Continue with local cleanup even if Supabase signOut fails
    }
    
    // Always clear local state regardless of Supabase signOut result
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('civicapp_user');
    localStorage.removeItem('civicapp_role');
    
    return { error: null };
  };

  // Verify OTP using Supabase Auth
  const verifyOTP = async (email, otp) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;

      // Update citizen record as verified
      if (data.user) {
        await supabase
          .from('citizens')
          .update({ is_verified: true })
          .eq('id', data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP using Supabase Auth
  const resendOTP = async (email) => {
    try {
      setLoading(true);
      
      // Use Supabase Auth to resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      return { data: { message: 'Verification email sent successfully' }, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
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
    verifyOTP,
    resendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
