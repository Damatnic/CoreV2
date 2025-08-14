import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { CrisisAlert } from '../CrisisAlert';
import { CrisisSupportWidget } from '../CrisisSupportWidget';
import { CrisisDetectionDashboard } from '../CrisisDetectionDashboard';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useCrisisDetection } from '../../hooks/useCrisisDetection';

// Mock the crisis detection hook
jest.mock('../../hooks/useCrisisDetection');
const mockUseCrisisDetection = useCrisisDetection as jest.MockedFunction<typeof useCrisisDetection>;

describe('Crisis Detection Components', () => {
  const mockAuthContext: AuthContextType = {
    isAuthenticated: true,
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    helperProfile: null,
    isNewUser: false,
    isLoading: false,
    login: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    register: jest.fn(() => Promise.resolve()),
    reloadProfile: jest.fn(() => Promise.resolve()),
    updateHelperProfile: jest.fn(),
    userToken: 'test-token',
  };

  const mockNotificationContext = {
    toasts: [],
    addToast: jest.fn(),
    removeToast: jest.fn(),
    confirmationModal: null,
    showConfirmationModal: jest.fn(),
    hideConfirmationModal: jest.fn(),
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <NotificationContext.Provider value={mockNotificationContext}>
          {component}
        </NotificationContext.Provider>
      </AuthContext.Provider>
    );
  };

  // Default mock return value for useCrisisDetection
  const defaultMockReturn = {
    isAnalyzing: false,
    lastAnalysis: null,
    escalationActions: [],
    analysisHistory: [],
    crisisAlert: {
      show: false,
      severity: 'none' as const,
      message: '',
      actions: [],
      resources: [],
      emergencyMode: false
    },
    analyzeText: jest.fn(() => Promise.resolve({
      hasCrisisIndicators: false,
      severityLevel: 'none' as const,
      detectedCategories: [],
      confidence: 0,
      recommendedActions: [],
      escalationRequired: false,
      emergencyServices: false,
      riskFactors: [],
      protectiveFactors: [],
      analysisDetails: {
        triggeredKeywords: [],
        sentimentScore: 0,
        contextualFactors: [],
        urgencyLevel: 0
      }
    })),
    analyzeTextDebounced: jest.fn(),
    monitorTextInput: jest.fn(),
    dismissAlert: jest.fn(),
    clearHistory: jest.fn(),
    getCrisisStatus: jest.fn(() => ({
      hasCrisisIndicators: false,
      maxSeverity: 'none' as const,
      analysisCount: 0,
      recentAnalyses: 0,
      escalationRequired: false
    })),
    getCrisisResources: jest.fn(() => ({
      hotlines: [
        { name: '988 Suicide & Crisis Lifeline', contact: '988', available: '24/7' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' }
      ],
      resources: [],
      emergencyServices: false
    })),
    hasCrisisIndicators: false,
    requiresEscalation: false,
    isEmergency: false,
    currentSeverity: 'none' as const,
    analysisCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCrisisDetection.mockReturnValue(defaultMockReturn);
  });

  describe('CrisisAlert Component', () => {
    test('renders correctly when risk level is high', () => {
      const highRiskMock = {
        ...defaultMockReturn,
        lastAnalysis: {
          hasCrisisIndicators: true,
          severityLevel: 'high' as const,
          detectedCategories: ['suicidal'],
          confidence: 0.9,
          recommendedActions: ['Contact crisis hotline'],
          escalationRequired: true,
          emergencyServices: false,
          riskFactors: ['help', 'suicide'],
          protectiveFactors: [],
          analysisDetails: {
            triggeredKeywords: [],
            sentimentScore: -0.8,
            contextualFactors: [],
            urgencyLevel: 3
          }
        },
        crisisAlert: {
          show: true,
          severity: 'high' as const,
          message: 'Immediate support needed',
          actions: ['Contact crisis hotline'],
          resources: ['988 Suicide & Crisis Lifeline'],
          emergencyMode: false
        },
        hasCrisisIndicators: true,
        requiresEscalation: true,
        isEmergency: false,
        currentSeverity: 'high' as const,
        analysisCount: 1
      };
      
      mockUseCrisisDetection.mockReturnValue(highRiskMock);

      renderWithProviders(<CrisisAlert 
        show={true}
        severity="high"
        message="Immediate support needed"
        actions={['Contact crisis hotline']}
        resources={['988 Suicide & Crisis Lifeline']}
        emergencyMode={false}
        onDismiss={jest.fn()}
      />);
      
      expect(screen.getByText(/Crisis Support Needed/i)).toBeInTheDocument();
    });

    test('does not render when risk level is low', () => {
      renderWithProviders(<CrisisAlert 
        show={false}
        severity="low"
        message=""
        actions={[]}
        resources={[]}
        emergencyMode={false}
        onDismiss={jest.fn()}
      />);
      
      expect(screen.queryByText(/immediate support/i)).not.toBeInTheDocument();
    });

    test('handles dismiss action correctly', async () => {
      const mockDismiss = jest.fn();
      const highRiskMock = {
        ...defaultMockReturn,
        dismissAlert: mockDismiss,
        crisisAlert: {
          show: true,
          severity: 'high' as const,
          message: 'Support needed',
          actions: [],
          resources: [],
          emergencyMode: false
        },
        currentSeverity: 'high' as const,
        requiresEscalation: false,
        isEmergency: false
      };
      
      mockUseCrisisDetection.mockReturnValue(highRiskMock);

      renderWithProviders(<CrisisAlert 
        show={true}
        severity="high"
        message="Support needed"
        actions={[]}
        resources={[]}
        emergencyMode={false}
        onDismiss={mockDismiss}
      />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(mockDismiss).toHaveBeenCalled();
      });
    });

    test('displays multiple emergency contacts', () => {
      const criticalMock = {
        ...defaultMockReturn,
        lastAnalysis: {
          hasCrisisIndicators: true,
          severityLevel: 'critical' as const,
          detectedCategories: ['suicidal', 'emergency'],
          confidence: 0.95,
          recommendedActions: ['Call 988 immediately'],
          escalationRequired: true,
          emergencyServices: true,
          riskFactors: [],
          protectiveFactors: [],
          analysisDetails: {
            triggeredKeywords: [],
            sentimentScore: -0.9,
            contextualFactors: [],
            urgencyLevel: 5
          }
        },
        getCrisisResources: jest.fn(() => ({
          hotlines: [
            { name: 'Crisis Hotline', contact: '988', available: '24/7' },
            { name: 'Local Support', contact: '555-0123', available: 'Business hours' },
            { name: 'Text Support', contact: 'TEXT to 741741', available: '24/7' }
          ],
          resources: [],
          emergencyServices: true
        })),
        crisisAlert: {
          show: true,
          severity: 'critical' as const,
          message: 'Immediate help needed',
          actions: ['Call 988'],
          resources: ['988 Suicide & Crisis Lifeline'],
          emergencyMode: true
        },
        currentSeverity: 'critical' as const,
        requiresEscalation: true,
        isEmergency: true
      };
      
      mockUseCrisisDetection.mockReturnValue(criticalMock);

      renderWithProviders(<CrisisAlert 
        show={true}
        severity="critical"
        message="Immediate help needed"
        actions={['Call 988']}
        resources={['988 Suicide & Crisis Lifeline', 'Crisis Text Line', 'Local Support']}
        emergencyMode={true}
        onDismiss={jest.fn()}
      />);
      
      expect(screen.getByText('988 Suicide & Crisis Lifeline')).toBeInTheDocument();
    });
  });

  describe('CrisisSupportWidget Component', () => {
    test('renders breathing exercise when expanded', () => {
      renderWithProviders(<CrisisSupportWidget />);
      
      const expandButton = screen.getByRole('button', { name: /support/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/breathing exercise/i)).toBeInTheDocument();
    });

    test('shows grounding technique option', () => {
      renderWithProviders(<CrisisSupportWidget />);
      
      const expandButton = screen.getByRole('button', { name: /support/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/grounding technique/i)).toBeInTheDocument();
    });

    test('displays safety plan link when user is authenticated', () => {
      renderWithProviders(<CrisisSupportWidget />);
      
      const expandButton = screen.getByRole('button', { name: /support/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/safety plan/i)).toBeInTheDocument();
    });

    test('initiates emergency call when emergency button is clicked', () => {
      // Mock window.location.href
      delete (window as unknown).location;
      window.location = { href: '' } as unknown;
      
      renderWithProviders(<CrisisSupportWidget />);
      
      const expandButton = screen.getByRole('button', { name: /support/i });
      fireEvent.click(expandButton);
      
      const emergencyButton = screen.getByRole('button', { name: /emergency/i });
      fireEvent.click(emergencyButton);
      
      expect(window.location.href).toContain('tel:');
    });
  });

  describe('CrisisDetectionDashboard Component', () => {
    test('renders dashboard with current risk level', () => {
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Crisis Detection Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Severity: none/i)).toBeInTheDocument();
    });

    test('shows analysis in progress indicator', () => {
      const analyzingMock = {
        ...defaultMockReturn,
        isAnalyzing: true
      };
      
      mockUseCrisisDetection.mockReturnValue(analyzingMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    });

    test('displays recent analysis results', () => {
      const withHistoryMock = {
        ...defaultMockReturn,
        analysisHistory: [
          {
            hasCrisisIndicators: true,
            severityLevel: 'medium' as const,
            detectedCategories: ['anxiety'],
            confidence: 0.7,
            recommendedActions: ['Talk to someone'],
            escalationRequired: false,
            emergencyServices: false,
            riskFactors: [],
            protectiveFactors: [],
            analysisDetails: {
              triggeredKeywords: [],
              sentimentScore: -0.5,
              contextualFactors: [],
              urgencyLevel: 2
            }
          }
        ],
        analysisCount: 1,
        requiresEscalation: false,
        isEmergency: false
      };
      
      mockUseCrisisDetection.mockReturnValue(withHistoryMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Analysis Count: 1/i)).toBeInTheDocument();
    });

    test('clear history button works', async () => {
      const mockClearHistory = jest.fn();
      const withHistoryMock = {
        ...defaultMockReturn,
        clearHistory: mockClearHistory,
        analysisHistory: [
          {
            hasCrisisIndicators: false,
            severityLevel: 'low' as const,
            detectedCategories: [],
            confidence: 0.3,
            recommendedActions: [],
            escalationRequired: false,
            emergencyServices: false,
            riskFactors: [],
            protectiveFactors: [],
            analysisDetails: {
              triggeredKeywords: [],
              sentimentScore: -0.2,
              contextualFactors: [],
              urgencyLevel: 1
            }
          }
        ]
      };
      
      mockUseCrisisDetection.mockReturnValue(withHistoryMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(mockClearHistory).toHaveBeenCalled();
      });
    });

    test('displays escalation actions when present', () => {
      const withEscalationMock = {
        ...defaultMockReturn,
        escalationActions: [
          {
            type: 'immediate' as const,
            description: 'Contact crisis counselor',
            contacts: ['988'],
            resources: ['Crisis chat'],
            timeline: 'Within 1 hour'
          }
        ]
      };
      
      mockUseCrisisDetection.mockReturnValue(withEscalationMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Contact crisis counselor/i)).toBeInTheDocument();
    });

    test('shows emergency mode indicator when active', () => {
      const emergencyMock = {
        ...defaultMockReturn,
        crisisAlert: {
          show: true,
          severity: 'critical' as const,
          message: 'Emergency',
          actions: [],
          resources: [],
          emergencyMode: true
        },
        currentSeverity: 'critical' as const,
        requiresEscalation: true,
        isEmergency: true
      };
      
      mockUseCrisisDetection.mockReturnValue(emergencyMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Severity: critical/i)).toBeInTheDocument();
    });

    test('displays protective factors when identified', () => {
      const withProtectiveMock = {
        ...defaultMockReturn,
        lastAnalysis: {
          hasCrisisIndicators: false,
          severityLevel: 'low' as const,
          detectedCategories: [],
          confidence: 0.2,
          recommendedActions: [],
          escalationRequired: false,
          emergencyServices: false,
          riskFactors: [],
          protectiveFactors: ['Support system', 'Coping skills'],
          analysisDetails: {
            triggeredKeywords: [],
            sentimentScore: 0.3,
            contextualFactors: [],
            urgencyLevel: 0
          }
        }
      };
      
      mockUseCrisisDetection.mockReturnValue(withProtectiveMock);
      
      renderWithProviders(<CrisisDetectionDashboard />);
      
      expect(screen.getByText(/Support system/i)).toBeInTheDocument();
      expect(screen.getByText(/Coping skills/i)).toBeInTheDocument();
    });
  });
});