import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import Navbar from '../components/Navbar';
import './OTPVerification.css';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email'); // 'email' or 'token'
  
  const navigate = useNavigate();
  const location = useLocation();
  const { resendOTP } = useAuth();
  
  // Get email from navigation state
  const email = location.state?.email;

  useEffect(() => {
    // Redirect if no email provided
    if (!email) {
      navigate('/signup');
      return;
    }

    // Listen for auth state changes (email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account verified successfully! Please log in.' 
            }
          });
        }, 2000);
      }
    });

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      subscription.unsubscribe();
    };
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use Supabase Auth OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) throw error;

      setSuccess('Email verified successfully!');
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account verified successfully! Please log in.' 
          }
        });
      }, 2000);
    } catch (error) {
      setError(error.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const result = await resendOTP(email);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      // Restart countdown
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="otp-page-container">
        <div className="otp-card">
          <div className="otp-header">
            <h1>Verify Your Email</h1>
            <p>We've sent a verification email to</p>
            <strong>{email}</strong>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="verification-methods">
            <div className="method-toggle">
              <button 
                type="button"
                className={`method-btn ${verificationMethod === 'email' ? 'active' : ''}`}
                onClick={() => setVerificationMethod('email')}
              >
                Email Link
              </button>
              <button 
                type="button"
                className={`method-btn ${verificationMethod === 'token' ? 'active' : ''}`}
                onClick={() => setVerificationMethod('token')}
              >
                Enter Code
              </button>
            </div>

            {verificationMethod === 'email' ? (
              <div className="email-verification">
                <div className="email-instructions">
                  <h3>Check Your Email</h3>
                  <p>Click the verification link in your email to confirm your account.</p>
                  <p>The page will automatically update when verified.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="otp-form">
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="otp-input"
                      disabled={loading}
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="verify-btn" 
                  disabled={loading || otp.join('').length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
            )}
          </div>

          <div className="otp-footer">
            <p>Didn't receive the email?</p>
            {canResend ? (
              <button 
                type="button" 
                className="resend-btn"
                onClick={handleResend}
                disabled={loading}
              >
                Resend Email
              </button>
            ) : (
              <span className="resend-timer">
                Resend in {resendTimer}s
              </span>
            )}
          </div>

          <div className="back-to-signup">
            <button 
              type="button"
              className="back-btn"
              onClick={() => navigate('/signup')}
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OTPVerification;
