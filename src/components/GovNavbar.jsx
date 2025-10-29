import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart3, Users, FileText, Map, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/SimpleAuthContext';
import './GovNavbar.css';

const GovNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    
    try {
      // signOut is now instant, so this will complete quickly
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Always navigate regardless of signOut result
    navigate('/login');
    setIsLoggingOut(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="gov-navbar">
      <div className="gov-navbar-container">
        <Link to="/gov-dashboard" className="gov-navbar-logo">
          Government Portal
        </Link>

        {/* Desktop Navigation */}
        <div className="gov-navbar-center">
          <Link to="/gov-dashboard" className="gov-nav-link">
            <BarChart3 size={18} />
            Dashboard
          </Link>
          <Link to="/reported-issues" className="gov-nav-link">
            <FileText size={18} />
            Issues
          </Link>
          <Link to="/staff-management" className="gov-nav-link">
            <Users size={18} />
            Staff
          </Link>
          <Link to="/analytics" className="gov-nav-link">
            <BarChart3 size={18} />
            Analytics
          </Link>
          <Link to="/map" className="gov-nav-link">
            <Map size={18} />
            Map
          </Link>
        </div>

        {/* Desktop User Section */}
        <div className="gov-navbar-right">
          {user ? (
            <div className="gov-navbar-user">
              <span className="gov-user-name">{user.name}</span>
              <button onClick={handleLogout} className="gov-logout-btn" disabled={isLoggingOut}>
                <LogOut size={18} />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="gov-nav-login-btn">Login</Link>
          )}
          
          <button className="gov-mobile-menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`gov-mobile-menu ${isMenuOpen ? 'show' : ''}`}>
          <div className="gov-mobile-menu-content">
            <Link to="/gov-dashboard" className="gov-mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
              <BarChart3 size={18} />
              Dashboard
            </Link>
            <Link to="/reported-issues" className="gov-mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
              <FileText size={18} />
              Issues
            </Link>
            <Link to="/staff-management" className="gov-mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
              <Users size={18} />
              Staff
            </Link>
            <Link to="/analytics" className="gov-mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
              <BarChart3 size={18} />
              Analytics
            </Link>
            <Link to="/map" className="gov-mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
              <Map size={18} />
              Map
            </Link>
            
            {user && (
              <div className="gov-mobile-user-section">
                <div className="gov-mobile-user-info">
                  <span className="gov-mobile-user-name">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="gov-mobile-logout-btn" disabled={isLoggingOut}>
                  <LogOut size={18} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default GovNavbar;
