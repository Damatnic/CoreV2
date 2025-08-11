import React from 'react';
import { Helper, ActiveView } from '../types';
import { SeekerSidebar } from './SeekerSidebar';
import { HelperSidebar } from './HelperSidebar';

export const Sidebar: React.FC<{
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onlineHelperCount: number;
  userToken: string | null;
  helperProfile: Helper | null;
}> = React.memo(
  ({
    activeView,
    setActiveView,
    isAuthenticated,
    onLogout,
    onlineHelperCount,
    userToken,
    helperProfile,
  }) => {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">Peer Support</div>
        {isAuthenticated && helperProfile ? (
          <HelperSidebar
            activeView={activeView}
            setActiveView={setActiveView}
            onLogout={onLogout}
            helperProfile={helperProfile}
            onlineHelperCount={onlineHelperCount}
          />
        ) : (
          <SeekerSidebar
            activeView={activeView}
            setActiveView={setActiveView}
            userToken={userToken}
            onlineHelperCount={onlineHelperCount}
          />
        )}
      </aside>
    );
  }
);
