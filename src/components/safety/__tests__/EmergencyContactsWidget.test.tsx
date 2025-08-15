/**
 * Test Suite for EmergencyContactsWidget Component
 * Tests emergency contact display and quick access functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import '@testing-library/jest-dom';
import { EmergencyContactsWidget, EmergencyContactWidget } from '../EmergencyContactsWidget';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock auth context
const mockAuthContext = {
  isAuthenticated: true,
  user: { sub: 'user123' },
  helperProfile: null,
  isNewUser: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  reloadProfile: jest.fn(),
  updateHelperProfile: jest.fn(),
  userToken: 'token123'
};

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    {children}
  </AuthContext.Provider>
);

// Mock contacts data
const mockContacts: EmergencyContactWidget[] = [
  {
    id: '1',
    name: 'Crisis Hotline',
    phone: '988',
    type: 'hotline' as const,
    available: '24/7',
    priority: 1
  },
  {
    id: '2',
    name: 'Therapist - Dr. Smith',
    phone: '555-0100',
    type: 'professional' as const,
    available: 'Mon-Fri 9-5',
    priority: 2
  },
  {
    id: '3',
    name: 'Best Friend - Sarah',
    phone: '555-0200',
    type: 'personal' as const,
    available: 'Anytime',
    priority: 3
  }
];

describe('EmergencyContactsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the widget with title', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      expect(screen.getByText(/Emergency Contacts/i)).toBeInTheDocument();
      expect(screen.getByTestId('emergency-contacts-widget')).toBeInTheDocument();
    });

    it('should display all provided contacts', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      expect(screen.getByText('Crisis Hotline')).toBeInTheDocument();
      expect(screen.getByText('Therapist - Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Best Friend - Sarah')).toBeInTheDocument();
    });

    it('should show availability for each contact', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      expect(screen.getByText('24/7')).toBeInTheDocument();
      expect(screen.getByText('Mon-Fri 9-5')).toBeInTheDocument();
      expect(screen.getByText('Anytime')).toBeInTheDocument();
    });

    it('should display appropriate icons for contact types', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      expect(screen.getByTestId('icon-hotline')).toBeInTheDocument();
      expect(screen.getByTestId('icon-professional')).toBeInTheDocument();
      expect(screen.getByTestId('icon-personal')).toBeInTheDocument();
    });
  });

  describe('Contact Actions', () => {
    it('should have clickable phone numbers', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const hotlineLink = screen.getByRole('link', { name: /988/i });
      expect(hotlineLink).toHaveAttribute('href', 'tel:988');

      const therapistLink = screen.getByRole('link', { name: /555-0100/i });
      expect(therapistLink).toHaveAttribute('href', 'tel:555-0100');
    });

    it('should show call button for each contact', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const callButtons = screen.getAllByRole('button', { name: /call/i });
      expect(callButtons).toHaveLength(3);
    });

    it('should initiate call on button click', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const firstCallButton = screen.getAllByRole('button', { name: /call/i })[0];
      fireEvent.click(firstCallButton);

      expect(mockLocation.href).toBe('tel:988');
    });

    it('should show text option for crisis hotline', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const textButton = screen.getByRole('button', { name: /text/i });
      expect(textButton).toBeInTheDocument();
    });
  });

  describe('Priority Ordering', () => {
    it('should display contacts in priority order', () => {
      const unorderedContacts = [
        { ...mockContacts[2], priority: 1 },
        { ...mockContacts[0], priority: 3 },
        { ...mockContacts[1], priority: 2 }
      ];

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={unorderedContacts} />
        </AuthWrapper>
      );

      const contactNames = screen.getAllByTestId('contact-name');
      expect(contactNames[0]).toHaveTextContent('Best Friend - Sarah');
      expect(contactNames[1]).toHaveTextContent('Therapist - Dr. Smith');
      expect(contactNames[2]).toHaveTextContent('Crisis Hotline');
    });

    it('should highlight high-priority contacts', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const firstContact = screen.getByTestId('contact-0');
      expect(firstContact).toHaveClass('high-priority');
    });
  });

  describe('Expanded/Collapsed View', () => {
    it('should start in collapsed view by default', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} collapsible={true} />
        </AuthWrapper>
      );

      expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    });

    it('should expand to show all contacts', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts} 
            collapsible={true}
            initialDisplay={1}
          />
        </AuthWrapper>
      );

      // Should only show one contact initially
      expect(screen.getAllByTestId(/contact-/)).toHaveLength(1);

      const expandButton = screen.getByRole('button', { name: /show all/i });
      fireEvent.click(expandButton);

      // Should show all contacts
      expect(screen.getAllByTestId(/contact-/)).toHaveLength(3);
    });

    it('should collapse back to limited view', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts} 
            collapsible={true}
            initialDisplay={1}
          />
        </AuthWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /show all/i });
      fireEvent.click(expandButton);

      const collapseButton = screen.getByRole('button', { name: /show less/i });
      fireEvent.click(collapseButton);

      expect(screen.getAllByTestId(/contact-/)).toHaveLength(1);
    });
  });

  describe('Edit Mode', () => {
    it('should allow entering edit mode', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} editable={true} />
        </AuthWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      expect(screen.getByText(/Edit Contacts/i)).toBeInTheDocument();
    });

    it('should allow adding new contact', () => {
      const onAddContact = jest.fn();
      
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts} 
            editable={true}
            onAddContact={onAddContact}
          />
        </AuthWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const addButton = screen.getByRole('button', { name: /add contact/i });
      fireEvent.click(addButton);

      expect(onAddContact).toHaveBeenCalled();
    });

    it('should allow removing contact', () => {
      const onRemoveContact = jest.fn();
      
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts} 
            editable={true}
            onRemoveContact={onRemoveContact}
          />
        </AuthWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      expect(onRemoveContact).toHaveBeenCalledWith('1');
    });

    it('should allow reordering contacts', async () => {
      const onReorder = jest.fn();
      
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts} 
            editable={true}
            onReorder={onReorder}
          />
        </AuthWrapper>
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
      fireEvent.click(moveUpButtons[1]); // Move second contact up

      expect(onReorder).toHaveBeenCalledWith(['2', '1', '3']);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no contacts', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={[]} />
        </AuthWrapper>
      );

      expect(screen.getByText(/No emergency contacts added/i)).toBeInTheDocument();
    });

    it('should show add button in empty state', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={[]} editable={true} />
        </AuthWrapper>
      );

      expect(screen.getByRole('button', { name: /add your first contact/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget loading={true} />
        </AuthWrapper>
      );

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const widget = screen.getByTestId('emergency-contacts-widget');
      expect(widget).toHaveAttribute('role', 'region');
      expect(widget).toHaveAttribute('aria-label', 'Emergency contacts');
    });

    it('should be keyboard navigable', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const firstCallButton = screen.getAllByRole('button', { name: /call/i })[0];
      const secondCallButton = screen.getAllByRole('button', { name: /call/i })[1];

      fireEvent.focus(firstCallButton);
      expect(firstCallButton).toHaveFocus();

      fireEvent.keyDown(firstCallButton, { key: 'Tab' });
      expect(secondCallButton).toHaveFocus();
    });

    it('should announce availability status', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const availableNow = screen.getByText('24/7');
      expect(availableNow).toHaveAttribute('aria-label', 'Available 24/7');
    });
  });

  describe('Quick Actions', () => {
    it('should show quick copy button for phone numbers', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('should copy phone number to clipboard', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const copyButton = screen.getAllByRole('button', { name: /copy/i })[0];
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('988');
      });
    });

    it('should show success feedback after copying', async () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const copyButton = screen.getAllByRole('button', { name: /copy/i })[0];
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} compact={true} />
        </AuthWrapper>
      );

      const widget = screen.getByTestId('emergency-contacts-widget');
      expect(widget).toHaveClass('compact');
    });

    it('should show only essential info in compact mode', () => {
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} compact={true} />
        </AuthWrapper>
      );

      // Should show names and phones but not availability
      expect(screen.getByText('Crisis Hotline')).toBeInTheDocument();
      expect(screen.getByText('988')).toBeInTheDocument();
      expect(screen.queryByText('24/7')).not.toBeInTheDocument();
    });
  });

  describe('Integration Features', () => {
    it('should track contact usage', () => {
      const onContactUsed = jest.fn();
      
      render(
        <AuthWrapper>
          <EmergencyContactsWidget 
            contacts={mockContacts}
            onContactUsed={onContactUsed}
          />
        </AuthWrapper>
      );

      const callButton = screen.getAllByRole('button', { name: /call/i })[0];
      fireEvent.click(callButton);

      expect(onContactUsed).toHaveBeenCalledWith({
        contactId: '1',
        action: 'call',
        timestamp: expect.any(Number)
      });
    });

    it('should show last contacted time when available', () => {
      const contactsWithHistory = [
        {
          ...mockContacts[0],
          lastContacted: Date.now() - 3600000 // 1 hour ago
        }
      ];

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={contactsWithHistory} />
        </AuthWrapper>
      );

      expect(screen.getByText(/Last contacted: 1 hour ago/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle call failures gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={[{ ...mockContacts[0], phone: 'invalid' }]} />
        </AuthWrapper>
      );

      const callButton = screen.getByRole('button', { name: /call/i });
      fireEvent.click(callButton);

      // Should show error message
      expect(screen.getByText(/Unable to initiate call/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle missing contact data', () => {
      const incompleteContact = [{
        id: '1',
        name: 'Test Contact'
        // Missing phone
      }];

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={incompleteContact as unknown} />
        </AuthWrapper>
      );

      expect(screen.getByText('Test Contact')).toBeInTheDocument();
      expect(screen.getByText(/No phone number/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const widget = screen.getByTestId('emergency-contacts-widget');
      expect(widget).toHaveClass('mobile-layout');
    });

    it('should use larger touch targets on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <AuthWrapper>
          <EmergencyContactsWidget contacts={mockContacts} />
        </AuthWrapper>
      );

      const callButtons = screen.getAllByRole('button', { name: /call/i });
      callButtons.forEach((button: HTMLElement) => {
        expect(button).toHaveClass('touch-target');
      });
    });
  });
});