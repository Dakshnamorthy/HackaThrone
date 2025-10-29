import Navbar from '../components/Navbar';
import './Home.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/SimpleAuthContext';

function Home() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  const isLoggedIn = user && userRole === 'citizen';
  
  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <h1>Empowering Citizens to Build a Better City</h1>
          <p>Report issues quickly and track their resolution in real-time.</p>
          <div className="hero-buttons">
            <button onClick={() => navigate("/report-issue")} className="report-btn">
              Report an Issue
            </button>
            {!isLoggedIn && (
              <button onClick={() => navigate("/login")} className="home-login-btn">
               Login
              </button>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-icon"></div>
              <h3>Report</h3>
              <p>Submit an issue with description and photos.</p>
            </div>
            <div className="step">
              <div className="step-icon"></div>
              <h3>AI Classification</h3>
              <p>Our AI categorizes the issue automatically.</p>
            </div>
            <div className="step">
              <div className="step-icon"></div>
              <h3>AR Location</h3>
              <p>Mark the location accurately on the map.</p>
            </div>
            <div className="step">
              <div className="step-icon"></div>
              <h3>Track Resolution</h3>
              <p>Follow the progress until the issue is resolved.</p>
            </div>
          </div>
        </section>


        {/* Statistics Section */}
        <section className="statistics-section">
          <h2>City Statistics</h2>
          <div className="stats-container">
            <div className="stat">
              <h3>1240</h3>
              <p>Total Issues</p>
            </div>
            <div className="stat">
              <h3>860</h3>
              <p>Resolved</p>
            </div>
            <div className="stat">
              <h3>3500</h3>
              <p>Active Users</p>
            </div>
            <div className="stat">
              <h3>12</h3>
              <p>Departments</p>
            </div>
          </div>
        </section>

        {/* Highlights / Benefits Section */}
        <section className="highlights-section">
          <h2>Why Choose Us?</h2>
          <div className="highlights-container">
            <div className="highlight">Simple</div>
            <div className="highlight">Transparent</div>
            <div className="highlight">AI-powered</div>
            <div className="highlight">AR-enabled</div>
            <div className="highlight">Real-time Notifications</div>
          </div>
        </section>

        {/* Optional Testimonials Section */}
        <section className="testimonials-section">
          <h2>What Citizens Say</h2>
          <div className="testimonials-container">
            <div className="testimonial">"This app makes reporting issues so easy!"</div>
            <div className="testimonial">"I can track progress in real-time, very transparent."</div>
            <div className="testimonial">"AI classification is super accurate and helpful."</div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="cta-section">
          <h2>Help transform your community — one report at a time.</h2>
          <button onClick={() => navigate("/report-issue")} className="cta-btn">
            Report an Issue
          </button>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 Civic App | <a href="#about">About</a> | <a href="#contact">Contact</a> | <a href="#privacy">Privacy Policy</a> | <a href="#terms">Terms</a></p>
        </footer>
      </div>
    </>
  );
}

export default Home;
