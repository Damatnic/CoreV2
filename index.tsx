/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';

import { Sidebar } from './src/components/Sidebar';
import { ToastContainer } from './src/components/Toast';
import { Modal } from './src/components/Modal';
import { AuthProvider, useAuth, useLegalConsents } from './src/contexts/AuthContext';
import { AppButton } from './src/components/AppButton';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider, useNotification } from './src/contexts/NotificationContext';
import { FloatingCrisisButton } from './src/components/CrisisAlertBanner';
import { SafetyTipsModal } from './src/components/SafetyTipsModal';
import { WelcomeScreen } from './src/components/WelcomeScreen';
import { FloatingGoogleBadge } from './src/components/GoogleBadge';
import { AccessibilityButton } from './src/components/AccessibilityButton';
import { OfflineStatusIndicator } from './src/components/OfflineStatusIndicator';
import { FloatingButtonManager } from './src/components/FloatingButtonManager';

import { ActiveView, Dilemma, Helper, View } from './src/types';
import { useInterval } from './src/hooks/useInterval';
import { usePerformanceMonitor } from './src/hooks/usePerformanceMonitor';
import { useDilemmaStore } from './src/stores/dilemmaStore';
import { useChatStore } from './src/stores/chatStore';
import { useSessionStore } from './src/stores/sessionStore';
import { useAIChat } from './src/hooks/useAIChat';
import { ReportModalContent } from './src/components/ReportModal';
import { ApiClient } from './src/utils/ApiClient';
import { notificationService } from './src/services/notificationService';
import { authService } from './src/services/authService';
import { initMobileEnhancements } from './src/utils/mobileUtils';

import { coreWebVitalsService } from './src/services/coreWebVitalsService';
import { pushNotificationService } from './src/services/pushNotificationService';
import { pwaService } from './src/services/pwaService';
import { accessibilityService } from './src/services/accessibilityService';
import { screenReaderService } from './src/services/screenReaderService';
import ResourceHintsOptimizer from './src/components/ResourceHintsOptimizer';

// Import i18n configuration
import './src/i18n/index';

// Import enhanced AI crisis detection service for initialization

// Initialize services by importing them (they auto-initialize via constructors)
import './src/services/culturalCrisisDetectionService';
import './src/services/privacyPreservingAnalyticsService';
import { enhancedOfflineService } from './src/services/enhancedOfflineService';

// --- Lazy Load Views for Code Splitting & Mobile Performance ---
// Critical components loaded immediately
const FeedView = lazy(() => import('./src/views/FeedView'));
const CrisisResourcesView = lazy(() => import('./src/views/CrisisResourcesView'));
const LoginView = lazy(() => import('./src/views/LoginView'));

// Helper components with delay for mobile
const HelperDashboardView = lazy(() => import('./src/views/HelperDashboardView'));
const ChatView = lazy(() => import('./src/views/ChatView'));
const AIChatView = lazy(() => import('./src/views/AIChatView'));
const VideoChatView = lazy(() => import('./src/views/VideoChatView'));
const WellnessVideosView = lazy(() => import('./src/views/WellnessVideosView'));

// Settings and configuration components
const SettingsView = lazy(() => import('./src/views/SettingsView'));
const SafetyPlanView = lazy(() => import('./src/views/SafetyPlanView'));
const QuietSpaceView = lazy(() => import('./src/views/QuietSpaceView'));

// Secondary views
const ShareView = lazy(() => import('./src/views/ShareView'));
const CommunityGuidelinesView = lazy(() => import('./src/views/CommunityGuidelinesView'));
const LegalView = lazy(() => import('./src/views/LegalView'));

// Helper-specific components
const CreateHelperProfileView = lazy(() => import('./src/views/CreateHelperProfileView'));
const HelperProfileView = lazy(() => import('./src/views/HelperProfileView'));
const HelperCommunityView = lazy(() => import('./src/views/HelperCommunityView'));
const HelperTrainingView = lazy(() => import('./src/views/HelperTrainingView'));
const HelperApplicationView = lazy(() => import('./src/views/HelperApplicationView'));

// Admin and moderation (loaded only when needed)
const AdminDashboardView = lazy(() => import('./src/views/AdminDashboardView'));
const ModerationDashboardView = lazy(() => import('./src/views/ModerationDashboardView'));
const ModerationHistoryView = lazy(() => import('./src/views/ModerationHistoryView'));


// User activity and reflection views
const ReflectionsView = lazy(() => import('./src/views/ReflectionsView'));
const BlockedUsersView = lazy(() => import('./src/views/BlockedUsersView'));
const MyActivityView = lazy(() => import('./src/views/MyActivityView'));
const PublicHelperProfileView = lazy(() => import('./src/views/PublicHelperProfileView'));
const UploadVideoView = lazy(() => import('./src/views/UploadVideoView'));
const DonationView = lazy(() => import('./src/views/DonationView'));
const WellnessView = lazy(() => import('./src/views/WellnessView'));
const AssessmentsView = lazy(() => import('./src/views/AssessmentsView'));
const AssessmentHistoryView = lazy(() => import('./src/views/AssessmentHistoryView'));
const AssessmentDetailView = lazy(() => import('./src/views/AssessmentDetailView'));
const PeerSupportView = lazy(() => import('./src/views/PeerSupportView'));
const StarkeeperDashboardView = lazy(() => import('./src/views/StarkeeperDashboardView'));
const TetherView = lazy(() => import('./src/views/TetherView'));


const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationProvider>
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  </NotificationProvider>
);

const SplashScreen: React.FC = () => (
    <div className="splash-screen">
        <div className="splash-logo">Astral Core</div>
        <p className="view-subheader" style={{ marginTop: '1rem' }}>Loading your safe space...</p>
    </div>
);

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>({ view: 'feed' });
  const { requiredConsent, allConsentsGiven, acceptConsent, getConsentContent } = useLegalConsents();
  
  const { isAuthenticated, logout, user, isNewUser, helperProfile, reloadProfile, userToken, updateHelperProfile, isLoading } = useAuth();
  const {
    reportDilemma,
    isReportModalOpen,
    closeReportModal,
    postDilemma,
    getDilemmaById,
  } = useDilemmaStore();
  const { activeChat } = useChatStore();
  const { 
    videoChatDilemmaId, 
    isVideoConsentModalOpen, 
    acceptVideoConsent, 
    declineVideoConsent, 
    endVideoChat 
  } = useSessionStore();
  const { addToast, confirmationModal, hideConfirmationModal } = useNotification();
  const { session: aiChatSession, sendMessage: handleSendAIMessage, resetAIChat } = useAIChat();
  
  // Initialize performance monitoring
  usePerformanceMonitor();

  // Initialize accessibility services
  useEffect(() => {
    const initializeAccessibility = async () => {
      try {
        await accessibilityService.initialize();
        await screenReaderService.initialize();
        console.log('[Accessibility] Services initialized successfully');
      } catch (error) {
        console.error('[Accessibility] Failed to initialize services:', error);
      }
    };

    initializeAccessibility();
  }, []);

  // Initialize PWA services
  useEffect(() => {
    // Initialize push notifications for crisis alerts
    pushNotificationService.requestPermission().catch(error => {
      console.warn('[PWA] Failed to initialize push notifications:', error);
    });

    // Track PWA status changes
    const unsubscribe = pwaService.onStatusChange((status) => {
      console.log('[PWA] Status changed:', status);
      if (status.isOffline) {
        addToast('You are offline. Crisis resources remain available.', 'info');
      }
    });

    // Initialize enhanced AI crisis detection
    console.log('[Enhanced AI Crisis Detection] Initializing service...');
    // Service auto-initializes via constructor

    // Initialize cultural crisis detection service
    console.log('[Cultural Crisis Detection] Initializing cultural crisis detection...');
    // Service auto-initializes via constructor and sets up cultural patterns

    // Initialize privacy-preserving analytics
    console.log('[Privacy Analytics] Initializing privacy-preserving analytics...');
    // Service auto-initializes via constructor and sets up data retention policies

    // Initialize enhanced offline service for multilingual crisis resources
    console.log('[Enhanced Offline] Initializing enhanced offline capabilities...');
    enhancedOfflineService.initialize().then(() => {
      console.log('[Enhanced Offline] Service initialized successfully');
    }).catch(error => {
      console.warn('[Enhanced Offline] Failed to initialize:', error);
    });

    return unsubscribe;
  }, [addToast]);

  const [onlineHelperCount, setOnlineHelperCount] = useState(0);
  const [viewingHelperProfileId, setViewingHelperProfileId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if welcome has been completed before
    return localStorage.getItem('welcomeCompleted') !== 'true';
  });

  // Debug: Press Ctrl+Shift+W to reset welcome screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        localStorage.removeItem('welcomeCompleted');
        setShowWelcome(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Initialize mobile enhancements
  useEffect(() => {
    const cleanup = initMobileEnhancements();
    return cleanup;
  }, []);

  useEffect(() => {
    notificationService.setToastFunction(addToast);
  }, [addToast]);

  useEffect(() => {
    authService.setUpdater(updateHelperProfile);
  }, [updateHelperProfile]);

  useEffect(() => {
    if (isAuthenticated && activeView.view === 'login') {
        if (!isNewUser) {
            setActiveView({ view: 'dashboard' });
            addToast('Successfully logged in as a Helper.');
        } else {
             setActiveView({ view: 'create-profile' });
        }
    }
  }, [isAuthenticated, activeView, isNewUser, addToast]);

  useInterval(async () => {
    try {
        const count = await ApiClient.helpers.getOnlineHelperCount();
        setOnlineHelperCount(count);
    } catch (error: any) {
        // In development, provide a more specific message for API unavailability
        if (error.message?.includes('API endpoint not available in development') || 
            error.message?.includes('not valid JSON')) {
            console.warn("Online helper count unavailable in development mode - using demo count");
            // Set a demo count for development
            setOnlineHelperCount(42);
        } else {
            console.error("Failed to fetch online helper count:", error);
        }
    }
  }, 5000); 

  const handleLogout = async () => {
    await logout();
    setActiveView({ view: 'feed' });
    addToast('You have been logged out.');
  }
  
  const handleReportSubmit = (reason: string) => {
    reportDilemma(reason);
    closeReportModal();
    addToast('Thank you for your report. A helper will review it shortly.', 'info');
  };
  
  const handleViewHelperProfile = (helperId: string) => {
    setViewingHelperProfileId(helperId);
    setActiveView({ view: 'public-helper-profile' });
  };

  const handlePostSubmit = async (dilemmaData: Omit<Dilemma, 'id' | 'userToken' | 'supportCount' | 'isSupported' | 'isReported' | 'reportReason' | 'status' | 'assignedHelperId' | 'resolved_by_seeker' | 'requestedHelperId' | 'summary' | 'summaryLoading' | 'moderation' | 'aiMatchReason'>) => {
    if (!userToken) {
      addToast('Cannot post without a user token.', 'error');
      return;
    }
    try {
      await postDilemma(dilemmaData, userToken);
      addToast('Your post has been shared anonymously!', 'success');
      setActiveView({ view: 'feed' });
    } catch (error) {
      console.error(error);
      addToast('Failed to share your post.', 'error');
    }
  };

  const handleUpdateApplicationStatus = async (helperId: string, status: Helper['applicationStatus'], notes?: string) => {
    if (!helperProfile) {
        addToast('You must be logged in to perform this action.', 'error');
        return;
    }
    try {
        await ApiClient.admin.updateApplicationStatus(helperId, status, helperProfile, notes);
        addToast(`Helper application ${status}.`, 'success');
    } catch (error) {
        addToast('Failed to update application. Please try again.', 'error');
    }
  }
  
  const handleResetId = () => {
    localStorage.removeItem('userToken');
    window.location.reload();
    resetAIChat();
    addToast('Your anonymous ID has been reset.', 'info');
  };

  // Role-based access control function
  const checkViewAccess = (view: View): { allowed: boolean; redirectTo?: View; reason?: string } => {
    const userRole = helperProfile?.role || 'Starkeeper';
    
    // Define role-specific access rules
    const roleAccess = {
      'Starkeeper': {
        allowed: ['starkeeper-dashboard', 'share', 'feed', 'crisis', 'ai-chat', 'safety-plan', 'quiet-space', 'my-activity', 'wellness-tracking', 'wellness-videos', 'reflections', 'assessments', 'assessment-history', 'assessment-detail', 'tether', 'peer-support', 'donation', 'settings', 'guidelines', 'legal', 'moderation-history', 'blocked-users'],
        denied: ['constellation-guide-dashboard', 'helper-profile', 'helper-training', 'helper-community', 'helper-application', 'moderation-dashboard', 'admin-dashboard', 'workflow-demo', 'create-profile']
      },
      'Community': {
        allowed: ['constellation-guide-dashboard', 'helper-profile', 'helper-training', 'helper-community', 'helper-application', 'feed', 'crisis', 'settings', 'guidelines', 'legal', 'workflow-demo'],
        denied: ['starkeeper-dashboard', 'moderation-dashboard', 'admin-dashboard']
      },
      'Certified': {
        allowed: ['constellation-guide-dashboard', 'helper-profile', 'helper-training', 'helper-community', 'helper-application', 'feed', 'crisis', 'settings', 'guidelines', 'legal', 'workflow-demo'],
        denied: ['starkeeper-dashboard', 'moderation-dashboard', 'admin-dashboard']
      },
      'Moderator': {
        allowed: ['constellation-guide-dashboard', 'helper-profile', 'helper-training', 'helper-community', 'helper-application', 'moderation-dashboard', 'feed', 'crisis', 'settings', 'guidelines', 'legal', 'workflow-demo'],
        denied: ['starkeeper-dashboard', 'admin-dashboard']
      },
      'Admin': {
        allowed: ['constellation-guide-dashboard', 'helper-profile', 'helper-training', 'helper-community', 'helper-application', 'moderation-dashboard', 'admin-dashboard', 'feed', 'crisis', 'settings', 'guidelines', 'legal', 'workflow-demo'],
        denied: ['starkeeper-dashboard']
      }
    };

    const currentRoleAccess = roleAccess[userRole as keyof typeof roleAccess];
    if (!currentRoleAccess) {
      return { allowed: false, redirectTo: 'feed', reason: 'Invalid user role' };
    }

    if (currentRoleAccess.denied.includes(view)) {
      const defaultView = userRole === 'Starkeeper' ? 'starkeeper-dashboard' : 
                         userRole === 'Admin' ? 'admin-dashboard' : 'constellation-guide-dashboard';
      return { 
        allowed: false, 
        redirectTo: defaultView as View, 
        reason: `Access denied: This page is not available for ${userRole} users.` 
      };
    }

    if (!currentRoleAccess.allowed.includes(view)) {
      return { 
        allowed: false, 
        redirectTo: 'feed' as View, 
        reason: `Access denied: You do not have permission to view this page.` 
      };
    }

    return { allowed: true };
  };

  const renderContent = () => {
    // Enforce helper profile creation for new users
    if (isAuthenticated && isNewUser) {
      return <CreateHelperProfileView onProfileCreated={reloadProfile} setActiveView={(view: View) => setActiveView({ view })} />;
    }

    if (activeView.view === 'video-chat' && videoChatDilemmaId) {
      const dilemma = getDilemmaById(videoChatDilemmaId);
      if (dilemma) {
        return <VideoChatView dilemma={dilemma} onClose={endVideoChat} />;
      }
    }
    if (activeChat) {
        const dilemma = getDilemmaById(activeChat.dilemmaId);
        if (dilemma) {
            return <ChatView session={activeChat} dilemma={dilemma} onViewHelperProfile={handleViewHelperProfile}/>;
        }
    }
    
    let currentView = activeView.view;
    
    // Handle post-authentication routing based on user type
    if (isAuthenticated && activeView.view === 'feed') {
        if (user?.userType === 'admin') {
            currentView = 'admin-dashboard';
        } else if (user?.userType === 'helper') {
            currentView = 'dashboard'; // Helper dashboard for helper role
        } else {
            currentView = 'feed'; // Regular users get feed view
        }
    }
    
     if (viewingHelperProfileId) {
        currentView = 'public-helper-profile';
    }

    switch (currentView) {
      case 'share': return <ShareView onPostSubmit={handlePostSubmit} userToken={userToken} />;
      case 'feed': return <FeedView />;
      case 'crisis': return <CrisisResourcesView />;
      case 'login': return <LoginView setActiveView={setActiveView} />;
      case 'settings': return <SettingsView userToken={userToken} onResetId={handleResetId} setActiveView={(view) => setActiveView({ view })} />;
      case 'guidelines': return <CommunityGuidelinesView />;
      case 'legal': return <LegalView />;
      case 'dashboard': return <HelperDashboardView setActiveView={setActiveView} />;
      case 'starkeeper-dashboard': return <StarkeeperDashboardView />;
      case 'tether': return <TetherView userToken={userToken} setActiveView={(view) => setActiveView({ view })} />;
      case 'my-activity': return <MyActivityView setActiveView={setActiveView} onViewHelperProfile={handleViewHelperProfile} userToken={userToken} />;
      case 'safety-plan': return <SafetyPlanView userToken={userToken} />;
      case 'quiet-space': return <QuietSpaceView />;
      case 'wellness-tracking': return <WellnessView />;
      case 'assessments': return <AssessmentsView setActiveView={setActiveView} />;
      case 'assessment-history': return <AssessmentHistoryView setActiveView={setActiveView} />;
      case 'assessment-detail':
        if (activeView.params?.type) {
            return <AssessmentDetailView type={activeView.params.type} setActiveView={setActiveView} />;
        }
        setActiveView({ view: 'assessments' });
        return <AssessmentsView setActiveView={setActiveView} />;
      case 'ai-chat': return <AIChatView session={aiChatSession} onSendMessage={handleSendAIMessage} onClose={() => setActiveView({ view: 'feed' })} />;
      case 'create-profile': {
        const access = checkViewAccess('create-profile');
        if (access.allowed) {
          return <CreateHelperProfileView onProfileCreated={reloadProfile} setActiveView={(view) => setActiveView({ view })} />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'helper-profile': {
        const access = checkViewAccess('helper-profile');
        if (access.allowed) {
          return <HelperProfileView onProfileUpdated={reloadProfile} setActiveView={(view) => setActiveView({ view })} />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'helper-application': {
        const access = checkViewAccess('helper-application');
        if (access.allowed) {
          return <HelperApplicationView setActiveView={(view) => setActiveView({ view })} />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'helper-training': {
        const access = checkViewAccess('helper-training');
        if (access.allowed) {
          return <HelperTrainingView onTrainingComplete={reloadProfile} />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'helper-community': {
        const access = checkViewAccess('helper-community');
        if (access.allowed) {
          return <HelperCommunityView />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'reflections': return <ReflectionsView userToken={userToken} />;
      case 'moderation-history': return <ModerationHistoryView userId={user?.sub || userToken} />;
      case 'wellness-videos': return <WellnessVideosView setActiveView={(view: View) => setActiveView({ view })} />;
      case 'upload-video': return <UploadVideoView onUploadComplete={() => setActiveView({ view: 'wellness-videos' })} userToken={userToken} />;
      case 'moderation-dashboard': {
        const access = checkViewAccess('moderation-dashboard');
        if (access.allowed) {
          return <ModerationDashboardView />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'admin-dashboard': {
        const access = checkViewAccess('admin-dashboard');
        if (access.allowed) {
          return <AdminDashboardView onUpdateApplicationStatus={handleUpdateApplicationStatus} />;
        }
        addToast(access.reason || 'Access Denied', 'error');
        setActiveView({ view: access.redirectTo || 'feed' });
        return <FeedView />;
      }
      case 'blocked-users': return <BlockedUsersView userId={user?.sub || userToken} />;
      case 'public-helper-profile': return <PublicHelperProfileView helperId={viewingHelperProfileId!} onClose={() => { setViewingHelperProfileId(null); setActiveView({ view: 'feed' }); }} setActiveView={setActiveView} />;
      case 'donation': return <DonationView />;
      case 'peer-support': return <PeerSupportView userToken={userToken} />;
      default: return <FeedView />;
    }
  };
  
  console.log("AppContent: isLoading =", isLoading);
  
  if (isLoading) {
    console.log("AppContent: Showing splash screen");
    return <SplashScreen />;
  }
  
  console.log("AppContent: Loading complete, rendering main app");
  console.log("AppContent: requiredConsent =", requiredConsent);
  return (
    <>
        {/* Accessibility Skip Links */}
        <a href="#main-content" className="skip-link sr-only">Skip to main content</a>
        <a href="#crisis-resources" className="skip-link sr-only">Skip to crisis resources</a>
        <a href="#navigation" className="skip-link sr-only">Skip to navigation</a>
        
        <ResourceHintsOptimizer />
        <ToastContainer />
        <FloatingCrisisButton />
        <SafetyTipsModal />
        <FloatingGoogleBadge />
        <AccessibilityButton />
        <OfflineStatusIndicator />
        <FloatingButtonManager onShowAIChat={() => setActiveView({ view: 'ai-chat' })} />
        {showWelcome && (
          <WelcomeScreen 
            onComplete={() => {
              setShowWelcome(false);
              localStorage.setItem('welcomeCompleted', 'true');
            }}
          />
        )}
        
        {confirmationModal && (
          <Modal
            isOpen={true}
            onClose={confirmationModal.onCancel || hideConfirmationModal}
            title={confirmationModal.title}
          >
            <div>
                <p>{confirmationModal.message}</p>
                 <div className="modal-actions">
                    <AppButton onClick={confirmationModal.onCancel || hideConfirmationModal} variant="secondary">{confirmationModal.cancelText || 'Cancel'}</AppButton>
                    <AppButton onClick={confirmationModal.onConfirm} variant={confirmationModal.confirmVariant || 'primary'}>{confirmationModal.confirmText || 'Confirm'}</AppButton>
                </div>
            </div>
          </Modal>
        )}

        <Modal 
            isOpen={!!requiredConsent}
            title={getConsentContent(requiredConsent).title}
            isDismissible={false}
        >
            <div className="legal-agreement-content">
                <p>{getConsentContent(requiredConsent).text}</p>
                 <p>You can read the full document before accepting.</p>
                 <div className="modal-actions">
                    <AppButton onClick={() => setActiveView({ view: 'legal' })} variant="secondary">Read Full Document</AppButton>
                    <AppButton onClick={acceptConsent} variant="success">I Agree</AppButton>
                </div>
            </div>
        </Modal>

        <Modal 
            isOpen={isReportModalOpen} 
            onClose={closeReportModal}
            title="Report a Post"
        >
            <ReportModalContent 
                onClose={closeReportModal}
                onSubmit={handleReportSubmit}
            />
        </Modal>

        <Modal
            isOpen={isVideoConsentModalOpen}
            onClose={declineVideoConsent}
            title="Video Chat Permission"
        >
            <p>To start a video chat, this application needs access to your camera and microphone. Your video and audio will be shared directly with the other user.</p>
            <p>Do you consent to sharing your camera and microphone?</p>
            <div className="modal-actions">
                <AppButton onClick={declineVideoConsent} variant="secondary">Decline</AppButton>
                <AppButton onClick={() => { acceptVideoConsent(); setActiveView({ view: 'video-chat' }); }} variant="primary">Accept</AppButton>
            </div>
        </Modal>
        
        {!allConsentsGiven ? (
            <SplashScreen />
        ) : (
            <div className={`app-layout ${activeView.view === 'ai-chat' || activeView.view === 'video-chat' || activeChat || ['wellness-videos', 'upload-video'].includes(activeView.view) ? 'chat-active' : ''}`}>
                <Sidebar activeView={activeView} setActiveView={setActiveView} isAuthenticated={isAuthenticated} onLogout={handleLogout} onlineHelperCount={onlineHelperCount} userToken={userToken} helperProfile={helperProfile}/>
                
                <main className="main-content" id="main-content" role="main" aria-label="Main application content">
                    <div className="background-blobs">
                        <div className="blob blob1"></div>
                        <div className="blob blob2"></div>
                    </div>
                    <Suspense fallback={<div className="loading-spinner" style={{ margin: 'auto' }}></div>}>
                        <div className="view-content-wrapper" key={activeView.view}>
                            {renderContent()}
                        </div>
                    </Suspense>
                </main>
            </div>
        )}
    </>
  );
};

const App: React.FC = () => (
    <AppProviders>
      <AppContent />
    </AppProviders>
);


const container = document.getElementById('root');
if (container) {
  // Store root instance to avoid recreating during HMR
  if (!(window as any).__astralRoot) {
    (window as any).__astralRoot = createRoot(container);
  }
  (window as any).__astralRoot.render(<App />);
  
  // Hide loading screen once React app has mounted successfully
  setTimeout(() => {
    if ((window as any).hideLoadingScreen) {
      (window as any).hideLoadingScreen();
    } else {
      // Fallback: directly add the class to hide loading screen
      document.body.classList.add('app-loaded');
    }
  }, 100); // Small delay to ensure React has fully rendered
}

// Initialize Service Worker for offline functionality and PWA features
if ('serviceWorker' in navigator) {
  // Service worker is currently disabled for development - will be enabled in production
  console.log('[SW] Service worker support available but disabled for development');
  
  // Note: Enhanced service worker features are available but disabled
  // This prevents development interference while maintaining PWA capabilities
}

// Initialize API Client to check for Netlify Functions availability
ApiClient.initialize().then(() => {
    console.log('[ApiClient] Initialized');
}).catch(error => {
    console.warn('[ApiClient] Initialization warning:', error.message);
});

// Initialize Core Web Vitals monitoring for performance tracking
coreWebVitalsService.initialize();
console.log('[Performance] Core Web Vitals monitoring started');

// Initialize PWA services for enhanced app experience
console.log('[PWA] Initializing enhanced PWA features...');