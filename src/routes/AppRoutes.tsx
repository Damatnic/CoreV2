/**
 * Centralized Route Configuration for CoreV2
 * All application routes with lazy loading
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AuthGuard } from '../components/auth/AuthGuard';
import { UserRole } from '../services/auth0Service';

// Lazy load all views for better performance
const DashboardView = lazy(() => import('../views/DashboardView'));
const WellnessDashboard = lazy(() => import('../views/WellnessView'));
const ProfileView = lazy(() => import('../views/ProfileView'));
const SettingsView = lazy(() => import('../views/SettingsView'));
const FeedView = lazy(() => import('../views/FeedView'));
const CommunityView = lazy(() => import('../views/CommunityView'));
const ChatRoute = lazy(() => import('./ChatRoute'));
const AIChatView = lazy(() => import('../views/AIChatView'));
const AssessmentsView = lazy(() => import('../views/AssessmentsView'));
const WellnessView = lazy(() => import('../views/WellnessView'));
const ReflectionsView = lazy(() => import('../views/ReflectionsView'));
const SafetyPlanView = lazy(() => import('../views/SafetyPlanView'));
const QuietSpaceView = lazy(() => import('../views/QuietSpaceView'));
const CrisisView = lazy(() => import('../views/CrisisView'));
const CrisisResourcesView = lazy(() => import('../views/CrisisResourcesView'));
const AboutView = lazy(() => import('../views/AboutView'));
const HelpView = lazy(() => import('../views/HelpView'));
const LegalView = lazy(() => import('../views/LegalView'));
const PeerSupportView = lazy(() => import('../views/PeerSupportView'));
const TetherView = lazy(() => import('../views/TetherView'));
const WellnessVideosView = lazy(() => import('../views/WellnessVideosView'));

// Helper-specific views
const HelperDashboardRoute = lazy(() => import('./HelperDashboardRoute'));
const HelperProfileRoute = lazy(() => import('./HelperProfileRoute'));
const HelperTrainingRoute = lazy(() => import('./HelperTrainingRoute'));
const HelperApplicationRoute = lazy(() => import('./HelperApplicationRoute'));
const HelperCommunityView = lazy(() => import('../views/HelperCommunityView'));

// Admin views
const AdminDashboardRoute = lazy(() => import('./AdminDashboardRoute'));
const ModerationView = lazy(() => import('../views/ModerationView'));
const AnalyticsView = lazy(() => import('../views/AnalyticsView'));

// Loading fallback component
const RouteLoading: React.FC = () => (
  <div className="route-loading">
    <LoadingSpinner />
    <p>Loading page...</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Default Route - Wellness Dashboard */}
        <Route path="/" element={<WellnessDashboard />} />
        
        {/* Public Routes */}
        <Route path="/about" element={<AboutView />} />
        <Route path="/legal" element={<LegalView />} />
        <Route path="/help" element={<HelpView />} />
        
        {/* Crisis Routes - Always Accessible */}
        <Route path="/crisis" element={<CrisisView />} />
        <Route path="/crisis-resources" element={<CrisisResourcesView />} />
        
        <Route path="/dashboard" element={<DashboardView />} />
        
        <Route path="/profile" element={
          <AuthGuard requireAuth={true}>
            <ProfileView />
          </AuthGuard>
        } />
        
        <Route path="/settings" element={
          <AuthGuard requireAuth={true}>
            <SettingsView />
          </AuthGuard>
        } />
        
        <Route path="/feed" element={
          <AuthGuard requireAuth={true}>
            <FeedView />
          </AuthGuard>
        } />
        
        <Route path="/community" element={
          <AuthGuard requireAuth={true}>
            <CommunityView />
          </AuthGuard>
        } />
        
        <Route path="/chat" element={
          <AuthGuard requireAuth={true}>
            <ChatRoute />
          </AuthGuard>
        } />
        
        <Route path="/ai-chat" element={
          <AuthGuard requireAuth={true}>
            <AIChatView />
          </AuthGuard>
        } />
        
        <Route path="/assessments" element={
          <AuthGuard requireAuth={true}>
            <AssessmentsView />
          </AuthGuard>
        } />
        
        <Route path="/wellness" element={<WellnessView />} />
        
        <Route path="/wellness-videos" element={
          <AuthGuard requireAuth={true}>
            <WellnessVideosView />
          </AuthGuard>
        } />
        
        <Route path="/reflections" element={
          <AuthGuard requireAuth={true}>
            <ReflectionsView />
          </AuthGuard>
        } />
        
        <Route path="/safety-plan" element={
          <AuthGuard requireAuth={true}>
            <SafetyPlanView />
          </AuthGuard>
        } />
        
        <Route path="/quiet-space" element={
          <AuthGuard requireAuth={true}>
            <QuietSpaceView />
          </AuthGuard>
        } />
        
        <Route path="/peer-support" element={
          <AuthGuard requireAuth={true}>
            <PeerSupportView />
          </AuthGuard>
        } />
        
        <Route path="/tether" element={
          <AuthGuard requireAuth={true}>
            <TetherView />
          </AuthGuard>
        } />
        
        {/* Helper Routes */}
        <Route path="/helper/dashboard" element={
          <AuthGuard requireAuth={true} requireRoles={['helper', 'admin'] as UserRole[]}>
            <HelperDashboardRoute />
          </AuthGuard>
        } />
        
        <Route path="/helper/profile" element={
          <AuthGuard requireAuth={true} requireRoles={['helper', 'admin'] as UserRole[]}>
            <HelperProfileRoute />
          </AuthGuard>
        } />
        
        <Route path="/helper/training" element={
          <AuthGuard requireAuth={true}>
            <HelperTrainingRoute />
          </AuthGuard>
        } />
        
        <Route path="/helper/application" element={
          <AuthGuard requireAuth={true}>
            <HelperApplicationRoute />
          </AuthGuard>
        } />
        
        <Route path="/helper/community" element={
          <AuthGuard requireAuth={true} requireRoles={['helper', 'admin'] as UserRole[]}>
            <HelperCommunityView />
          </AuthGuard>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AuthGuard requireAuth={true} requireRoles={['admin'] as UserRole[]}>
            <AdminDashboardRoute />
          </AuthGuard>
        } />
        
        <Route path="/admin/moderation" element={
          <AuthGuard requireAuth={true} requireRoles={['admin', 'moderator'] as UserRole[]}>
            <ModerationView />
          </AuthGuard>
        } />
        
        <Route path="/admin/analytics" element={
          <AuthGuard requireAuth={true} requireRoles={['admin'] as UserRole[]}>
            <AnalyticsView />
          </AuthGuard>
        } />
        
        {/* 404 Fallback - Redirect to wellness dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;