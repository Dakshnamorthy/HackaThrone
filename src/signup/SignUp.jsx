import Navbar from '../components/Navbar';
import './SignUp.css';
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useAuth } from '../context/SimpleAuthContext';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signUpCitizen } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await signUpCitizen(formData.email, formData.password, formData.name);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Redirect to OTP verification page
      navigate('/verify-otp', { 
        state: { email: formData.email } 
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Navbar />
      <div className="signup-page-container">
        {/* Hero Section */}
        <div className="signup-hero">
          <div className="hero-content">
            <h1>Join CivicApp</h1>
            <p>Empower your community by reporting civic issues and tracking their progress in real-time.</p>

            <ul className="hero-features">
              <li>📸 Upload photos of issues quickly</li>
              <li>🗺️ Automatic location detection or manual entry</li>
              <li>✅ Track status of your complaints</li>
              <li>🔔 Receive notifications for updates</li>
            </ul>

            <p className="hero-cta">Be a part of building a cleaner, safer, and better city.</p>
          </div>
        </div>

        {/* Sign-Up Form Section */}
        <div className="signup-form-section">
          <div className="signup-form-container">
            <h2>Create Your Account</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSignUp}>
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                placeholder="Enter your full name" 
                required 
                value={formData.name}
                onChange={handleInputChange}
              />

              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                placeholder="Enter your email" 
                required 
                value={formData.email}
                onChange={handleInputChange}
              />

              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                placeholder="Enter your password (min 6 characters)" 
                required 
                value={formData.password}
                onChange={handleInputChange}
              />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                placeholder="Confirm your password" 
                required 
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />

              <button type="submit" className="signup-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="login-text">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2025 CivicApp. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">About</a> | <a href="#">Contact</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms</a>
        </div>
      </footer>
    </>
  );
}

export default SignUp;
