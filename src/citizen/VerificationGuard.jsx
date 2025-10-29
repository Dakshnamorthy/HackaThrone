import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import { AlertTriangle, CheckCircle, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './VerificationGuard.css';

const VerificationGuard = ({ children }) => {
  const { user } = useAuth();
  
  // Temporary user for testing (same as Profile component)
  const testUser = !user ? {
    id: '2fbe79d8-a44c-45be-a921-7684f0405784',
    email: 'test@example.com',
    name: 'Test User'
  } : null;
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    isLoggedIn: false,
    profileCompleted: false,
    isVerified: false
  });

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    try {
      const currentUser = user || testUser;
      
      if (!currentUser) {
        setVerificationStatus({
          loading: false,
          isLoggedIn: false,
          profileCompleted: false,
          isVerified: false
        });
        return;
      }

      // Check citizen verification status (using actual database schema)
      const { data, error } = await supabase
        .from('citizens')
        .select('name, email, is_verified')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking verification status:', error);
        setVerificationStatus({
          loading: false,
          isLoggedIn: true,
          profileCompleted: false,
          isVerified: false
        });
        return;
      }

      // If user exists in database with name, consider profile completed
      const profileCompleted = !!(data?.name && data?.email);
      
      setVerificationStatus({
        loading: false,
        isLoggedIn: true,
        profileCompleted: profileCompleted,
        isVerified: data?.is_verified || false
      });
      
      console.log('Verification status check:', {
        userData: data,
        profileCompleted,
        isVerified: data?.is_verified || false
      });
    } catch (error) {
      console.error('Error in verification check:', error);
      setVerificationStatus({
        loading: false,
        isLoggedIn: !!(user || testUser),
        profileCompleted: false,
        isVerified: false
      });
    }
  };

  if (verificationStatus.loading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <p>Checking verification status...</p>
      </div>
    );
  }

  // User not logged in
  if (!verificationStatus.isLoggedIn) {
    return (
      <div className="verification-guard">
        <div className="verification-card">
          <div className="verification-icon error">
            <User size={48} />
          </div>
          <h2>Login Required</h2>
          <p>You need to be logged in to report civic issues.</p>
          <div className="verification-actions">
            <Link to="/citizen-login" className="action-button primary">
              Login to Continue
              <ArrowRight size={16} />
            </Link>
            <Link to="/signup" className="action-button secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User logged in but profile not completed
  if (!verificationStatus.profileCompleted) {
    return (
      <div className="verification-guard">
        <div className="verification-card">
          <div className="verification-icon warning">
            <AlertTriangle size={48} />
          </div>
          <h2>Profile Verification Required</h2>
          <p>Please complete your profile verification with Aadhaar details before reporting issues.</p>
          <div className="verification-steps">
            <div className="step completed">
              <CheckCircle size={20} />
              <span>Account Created</span>
            </div>
            <div className="step pending">
              <User size={20} />
              <span>Complete Profile</span>
            </div>
            <div className="step pending">
              <CheckCircle size={20} />
              <span>Verification</span>
            </div>
          </div>
          <div className="verification-actions">
            <div className="action-button primary" onClick={() => window.location.reload()}>
              Complete Profile via Navbar
              <ArrowRight size={16} />
            </div>
            <p className="verification-note">
              Click on your profile icon in the navbar above and select "Profile & Verification"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User logged in, profile completed but not verified
  if (!verificationStatus.isVerified) {
    return (
      <div className="verification-guard">
        <div className="verification-card">
          <div className="verification-icon warning">
            <AlertTriangle size={48} />
          </div>
          <h2>Verification Pending</h2>
          <p>Your profile is under verification. Please wait for admin approval or complete the verification process.</p>
          <div className="verification-steps">
            <div className="step completed">
              <CheckCircle size={20} />
              <span>Account Created</span>
            </div>
            <div className="step completed">
              <CheckCircle size={20} />
              <span>Profile Completed</span>
            </div>
            <div className="step pending">
              <AlertTriangle size={20} />
              <span>Verification Pending</span>
            </div>
          </div>
          <div className="verification-actions">
            <button 
              onClick={checkVerificationStatus}
              className="action-button primary"
            >
              Check Status
            </button>
            <p className="verification-note">
              Use the profile icon in the navbar to view your verification status
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is fully verified - render the protected content
  return (
    <div className="verified-content">
      {children}
    </div>
  );
};

export default VerificationGuard;
