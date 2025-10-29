import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart3, Users, FileText, Map, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/SimpleAuthContext';
import './Navbar.css';

const GovNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if signOut fails
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/gov-dashboard" className="navbar-logo">
          CivicApp <span className="gov-badge">Staff</span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/gov-dashboard" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <BarChart3 size={18} />
            Dashboard
          </Link>
          <Link to="/reported-issues" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <FileText size={18} />
            Reported Issues
          </Link>
          <Link to="/staff-management" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <Users size={18} />
            Staff Management
          </Link>
          <Link to="/analytics" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <BarChart3 size={18} />
            Analytics
          </Link>
          <Link to="/map" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <Map size={18} />
            Map
          </Link>
          <Link to="/complaint-status" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            <FileText size={18} />
            Complaint Status
          </Link>
          
          {user ? (
            <div className="navbar-user">
              <span className="user-name">{user.name}</span>
              <button onClick={handleLogout} className="logout-btn" disabled={isLoggingOut}>
                <LogOut size={18} />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
          )}
        </div>

        <div className="navbar-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>
      </div>
    </nav>
  );
};

export default GovNavbar;
