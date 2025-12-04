import './Navbar.css';
import { Bell } from 'lucide-react'; 
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setUserEmail(null);
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-center">
          <Link to="/" className="navbar-btn">Home</Link>
          <Link to="/report-issue" className="navbar-btn">Report an Issue</Link>
          <Link to="/map" className="navbar-btn">Map</Link>
          <Link to="/complaint-status" className="navbar-btn">Complaint Status</Link>
          <Link to="/help" className="navbar-btn">Help</Link>
        </div>

        <div className="navbar-right">
          <Bell className="notification-icon" />
          {userEmail ? (
            <div className="user-circle" onClick={handleLogout} title="Logout">
              {userEmail[0].toUpperCase()}
            </div>
          ) : (
            <Link to="/login" className="nav-login-btn">Login / Signup</Link>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
