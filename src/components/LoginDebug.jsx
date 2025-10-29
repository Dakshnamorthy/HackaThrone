import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SimpleAuthContext';

const LoginDebug = () => {
  const [debugInfo, setDebugInfo] = useState([]);
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    const addDebugInfo = (message) => {
      const timestamp = new Date().toLocaleTimeString();
      setDebugInfo(prev => [...prev, `${timestamp}: ${message}`]);
    };

    addDebugInfo('LoginDebug component mounted');
    
    if (user) {
      addDebugInfo(`User loaded: ${user.name || user.email || 'Unknown'}`);
    }
    
    if (userRole) {
      addDebugInfo(`User role: ${userRole}`);
    }
    
    if (loading) {
      addDebugInfo('Auth is loading...');
    } else {
      addDebugInfo('Auth loading complete');
    }
  }, [user, userRole, loading]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div><strong>Auth Debug:</strong></div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
      <div>Role: {userRole || 'None'}</div>
      <hr style={{ margin: '5px 0' }} />
      {debugInfo.slice(-5).map((info, index) => (
        <div key={index} style={{ fontSize: '10px' }}>{info}</div>
      ))}
    </div>
  );
};

export default LoginDebug;
