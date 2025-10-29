import './Navbar.css';
import { Bell, User, LogOut, ChevronDown, Menu, X, Settings } from 'lucide-react'; 
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/SimpleAuthContext';
import Profile from '../citizen/Profile';

function Navbar() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const isLoggedIn = user && userRole === 'citizen';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    setShowProfileDropdown(false);
    setShowMobileMenu(false);
    
    try {
      // Call signOut function
      const result = await signOut();
      
      // Force clear any remaining state
      localStorage.removeItem('civicapp_user');
      localStorage.removeItem('civicapp_role');
      
    } catch (error) {
      // Force clear state even if signOut fails
      localStorage.removeItem('civicapp_user');
      localStorage.removeItem('civicapp_role');
    }
    
    // Navigate to login and reset loading state
    navigate("/login", { replace: true });
    setIsLoggingOut(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowProfileDropdown(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setShowProfileDropdown(false);
    setShowMobileMenu(false);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Left - Logo */}
          <Link to="/" className="navbar-logo">CIVORA</Link>
          
          {/* Center - Navigation Links (Desktop) */}
          <div className="navbar-center desktop-nav">
            <Link to="/" className="navbar-btn">Home</Link>
            <Link to="/report-issue" className="navbar-btn">Report Issue</Link>
            <Link to="/map" className="navbar-btn">Map</Link>
            <Link to="/complaint-status" className="navbar-btn">Status</Link>
            <Link to="/help" className="navbar-btn">Help</Link>
          </div>

          {/* Right - User Controls */}
          <div className="navbar-right">
            <Bell className="notification-icon" />
            {isLoggedIn ? (
              <div className="profile-container" ref={dropdownRef}>
                <div 
                  className="profile-trigger" 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <span className="user-name">{user.name || 'User'}</span>
                  <ChevronDown size={16} className={`dropdown-arrow ${showProfileDropdown ? 'rotated' : ''}`} />
                </div>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-info">
                      <div className="profile-avatar">
                        <User size={24} />
                      </div>
                      <div className="profile-details">
                        <h4>{user.name || 'User'}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="profile-divider"></div>
                    <button className="profile-menu-item" onClick={handleProfileClick}>
                      <Settings size={16} />
                      Profile & Verification
                    </button>
                    <button className="profile-menu-item" onClick={handleLogout} disabled={isLoggingOut}>
                      <LogOut size={16} />
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-login-btn">Login / Signup</Link>
            )}
            
            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${showMobileMenu ? 'active' : ''}`}>
          <Link to="/" className="mobile-menu-item" onClick={closeMobileMenu}>Home</Link>
          <Link to="/report-issue" className="mobile-menu-item" onClick={closeMobileMenu}>Report an Issue</Link>
          <Link to="/map" className="mobile-menu-item" onClick={closeMobileMenu}>Map</Link>
          <Link to="/complaint-status" className="mobile-menu-item" onClick={closeMobileMenu}>Complaint Status</Link>
          <Link to="/help" className="mobile-menu-item" onClick={closeMobileMenu}>Help</Link>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={closeProfileModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Profile & Verification</h2>
              <button className="profile-modal-close" onClick={closeProfileModal}>
                <X size={24} />
              </button>
            </div>
            <div className="profile-modal-body">
              <Profile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
