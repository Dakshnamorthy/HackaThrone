import Navbar from '../components/Navbar';
import './SignUp.css';
import { Link } from "react-router-dom";

function SignUp() {
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
            <form>
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" placeholder="Enter your full name" required />

              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Enter your email" required />

              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Enter your password" required />

              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" placeholder="Enter your phone number" />

              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                placeholder="Enter your city or use geolocation"
              />
              <button
                type="button"
                className="geo-btn"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        document.getElementById("location").value =
                          `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
                      },
                      (err) => alert("Geolocation error: " + err.message)
                    );
                  } else {
                    alert("Geolocation not supported by your browser");
                  }
                }}
              >
                Use My Current Location
              </button>

              <button type="submit" className="signup-btn">Sign Up</button>
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
