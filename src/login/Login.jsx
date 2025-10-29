import Navbar from '../components/Navbar';
import './Login.css';
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simple check (replace later with backend auth)
    if (email && password) {
      localStorage.setItem("userEmail", email);
      navigate("/"); // Redirect to home page
    } else {
      alert("Please enter both email and password.");
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
            <form onSubmit={handleLogin}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="Enter your email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
              />

              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />

              <button type="submit" className="login-btn">Login</button>
            </form>

            <p className="signup-text">
              Don't have an account? <Link to="/signup">Register</Link>
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

export default Login;
