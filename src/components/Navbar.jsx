import './Navbar.css';
import { Bell, User, LogOut, ChevronDown, Menu, X } from 'lucide-react'; 
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/SimpleAuthContext';

function Navbar() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    try {
      await signOut();
      setShowProfileDropdown(false);
      setShowMobileMenu(false);
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setShowProfileDropdown(false);
      setShowMobileMenu(false);
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowProfileDropdown(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="navbar">
        {/* Mobile Header */}
        <div className="navbar-header">
          <Link to="/" className="navbar-logo">CIVORA</Link>
          
          <div className="navbar-mobile-controls">
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
            
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center desktop-nav">
          <Link to="/" className="navbar-btn">Home</Link>
          <Link to="/report-issue" className="navbar-btn">Report an Issue</Link>
          <Link to="/map" className="navbar-btn">Map</Link>
          <Link to="/complaint-status" className="navbar-btn">Complaint Status</Link>
          <Link to="/help" className="navbar-btn">Help</Link>
        </div>

        {/* Desktop Right Section */}
        <div className="navbar-right desktop-nav">
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
    </>
  );
}

export default Navbar;
