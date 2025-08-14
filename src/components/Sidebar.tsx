import React, { useState, useEffect } from 'react';
import { ActiveView, View } from '../types';
import { SeekerSidebar } from './SeekerSidebar';
import { HelperSidebar } from './HelperSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = React.memo(() => {
  const { isAuthenticated, login, logout, helperProfile, userToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState<ActiveView>({ view: 'wellness-tracking' as View });
  const onlineHelperCount = 12; // Mock value for now

  // Update active view based on current route
  useEffect(() => {
    const pathToView: Record<string, View> = {
      '/wellness': 'wellness-tracking',
      '/dashboard': 'dashboard',
      '/ai-chat': 'ai-chat',
      '/crisis': 'crisis',
      '/feed': 'feed',
      '/reflections': 'reflections',
      '/safety-plan': 'safety-plan',
      '/settings': 'settings',
      '/peer-support': 'peer-support',
      '/tether': 'tether',
      '/assessments': 'assessments',
      '/wellness-videos': 'wellness-videos',
    };
    
    const view = pathToView[location.pathname];
    if (view) {
      setActiveView({ view });
    }
  }, [location.pathname]);

  const handleSetActiveView = (view: ActiveView) => {
    if (view.view === 'login') {
      login();
      return;
    }
    
    setActiveView(view);
    
    // Navigate to the appropriate route
    const routeMap: Record<string, string> = {
      'wellness-tracking': '/wellness',
      'starkeeper-dashboard': '/dashboard',
      'dashboard': '/dashboard',
      'ai-chat': '/ai-chat',
      'crisis': '/crisis',
      'feed': '/feed',
      'reflections': '/reflections',
      'safety-plan': '/safety-plan',
      'settings': '/settings',
      'peer-support': '/peer-support',
      'tether': '/tether',
      'assessments': '/assessments',
      'wellness-videos': '/wellness-videos',
      'quiet-space': '/quiet-space',
      'share': '/feed',
      'my-activity': '/profile',
      'guidelines': '/help',
      'legal': '/legal',
      'donation': '/about',
    };
    
    if (routeMap[view.view]) {
      navigate(routeMap[view.view]);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Astral Core</span>
        {!isAuthenticated && (
          <button 
            className="signin-btn"
            onClick={login}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sign In
          </button>
        )}
        {isAuthenticated && (
          <button 
            className="signout-btn"
            onClick={logout}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Sign Out
          </button>
        )}
      </div>
      {isAuthenticated && helperProfile ? (
        <HelperSidebar
          activeView={activeView}
          setActiveView={handleSetActiveView}
          onLogout={logout}
          helperProfile={helperProfile}
          onlineHelperCount={onlineHelperCount}
        />
      ) : (
        <SeekerSidebar
          activeView={activeView}
          setActiveView={handleSetActiveView}
          userToken={userToken}
          onlineHelperCount={onlineHelperCount}
        />
      )}
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;