import Navbar from '../components/Navbar';
import './Login.css';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from '../context/SimpleAuthContext';

function Login() {
  const [loginType, setLoginType] = useState("citizen"); // "citizen" or "government"
  const [email, setEmail] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { signInCitizen, signInGovernment } = useAuth();

  useEffect(() => {
    // Check for success message from OTP verification
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      
      if (loginType === "citizen") {
        if (!email || !password) {
          setError("Please enter both email and password.");
          setLoading(false);
          return;
        }
        result = await signInCitizen(email, password);
      } else {
        if (!uniqueId || !password) {
          setError("Please enter both ID and password.");
          setLoading(false);
          return;
        }
        result = await signInGovernment(uniqueId, password);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Redirect based on user type
      if (loginType === "citizen") {
        navigate("/");
      } else {
        navigate("/gov-dashboard");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-page-container">
        {/* Left / Hero Section */}
        <div className="login-hero">
          <h1>Welcome Back</h1>
          <p>Log in to report issues and track your complaints.</p>
        </div>

        {/* Login Form Section */}
        <div className="login-form-section">
          <div className="login-form-container">
            <h2>Login</h2>
            
            {/* Login Type Toggle */}
            <div className="login-type-toggle">
              <button 
                type="button"
                className={`toggle-btn ${loginType === "citizen" ? "active" : ""}`}
                onClick={() => setLoginType("citizen")}
              >
                Citizen
              </button>
              <button 
                type="button"
                className={`toggle-btn ${loginType === "government" ? "active" : ""}`}
                onClick={() => setLoginType("government")}
              >
                Government Staff
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleLogin}>
              {loginType === "citizen" ? (
                <>
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="Enter your email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </>
              ) : (
                <>
                  <label htmlFor="uniqueId">Staff ID</label>
                  <input 
                    type="text" 
                    id="uniqueId" 
                    placeholder="Enter your staff ID (e.g., ELEC001)" 
                    required 
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)} 
                  />
                </>
              )}

              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {loginType === "citizen" && (
              <p className="signup-text">
                Don't have an account? <Link to="/signup">Register</Link>
              </p>
            )}
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

export default Login;
