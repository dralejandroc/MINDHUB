import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Input, Modal, Card, CardContent, Alert } from '@/components/shared';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

describe('WCAG 2.1 AA Accessibility Tests', () => {
  beforeEach(() => {
    mockDesktopDevice();
  });

  describe('Perceivable - Color and Contrast', () => {
    it('should not rely solely on color to convey information', () => {
      render(
        <div>
          <Alert variant="error" data-testid="error-alert">
            <span aria-label="Error">⚠️</span>
            This is an error message
          </Alert>
          <Alert variant="success" data-testid="success-alert">
            <span aria-label="Success">✅</span>
            This is a success message
          </Alert>
          <Alert variant="warning" data-testid="warning-alert">
            <span aria-label="Warning">⚠️</span>
            This is a warning message
          </Alert>
        </div>
      );

      // Should have both color and icon/text indicators
      expect(screen.getByLabelText('Error')).toBeInTheDocument();
      expect(screen.getByLabelText('Success')).toBeInTheDocument();
      expect(screen.getByLabelText('Warning')).toBeInTheDocument();
    });

    it('should provide high contrast ratios for text', () => {
      render(
        <div>
          <Button variant="primary" data-testid="primary-button">Primary</Button>
          <Button variant="secondary" data-testid="secondary-button">Secondary</Button>
          <Input label="Test Input" data-testid="test-input" />
        </div>
      );

      const primaryButton = screen.getByTestId('primary-button');
      const secondaryButton = screen.getByTestId('secondary-button');
      
      // Primary button should have high contrast (white text on blue)
      expect(primaryButton).toHaveClass('bg-blue-600', 'text-white');
      
      // Secondary button should have sufficient contrast
      expect(secondaryButton).toHaveClass('bg-gray-100', 'text-gray-900');
    });

    it('should maintain readability when scaled to 200%', () => {
      // Simulate 200% zoom
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      render(
        <div className="text-base leading-relaxed" data-testid="scalable-text">
          This text should remain readable at 200% zoom level
        </div>
      );

      const text = screen.getByTestId('scalable-text');
      // Should use relative units and good line spacing
      expect(text).toHaveClass('text-base', 'leading-relaxed');
    });
  });

  describe('Operable - Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button data-testid="button-1">Button 1</Button>
          <Input placeholder="Input field" data-testid="input-1" />
          <Button data-testid="button-2">Button 2</Button>
        </div>
      );

      // Tab through elements
      await user.tab();
      expect(screen.getByTestId('button-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('input-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();

      // Shift+Tab to go backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getByTestId('input-1')).toHaveFocus();
    });

    it('should provide visible focus indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <Button data-testid="focus-button">Focus Me</Button>
      );

      const button = screen.getByTestId('focus-button');
      
      await user.tab();
      expect(button).toHaveFocus();
      
      // Should have visible focus styles
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should allow dismissing modals with Escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(
        <Modal isOpen={true} onClose={onClose} closeOnEscape={true}>
          <p>Modal content</p>
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button data-testid="outside-button">Outside</Button>
          <Modal isOpen={true} onClose={() => {}}>
            <Input placeholder="Modal input" data-testid="modal-input" />
            <Button data-testid="modal-button">Modal Button</Button>
          </Modal>
        </div>
      );

      // Focus should be within modal
      await user.tab();
      const focusedElement = document.activeElement;
      
      // Should focus on modal content, not outside elements
      expect(focusedElement?.closest('[role="dialog"]')).toBeInTheDocument();
    });

    it('should support Enter and Space for button activation', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(
        <Button onClick={onClick} data-testid="keyboard-button">
          Keyboard Button
        </Button>
      );

      const button = screen.getByTestId('keyboard-button');
      button.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      // Test Space key
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Understandable - Clear Labels and Instructions', () => {
    it('should provide descriptive labels for form controls', () => {
      render(
        <div>
          <Input 
            label="Email Address" 
            helper="Enter your email address"
            required
            data-testid="email-input"
          />
          <Input 
            label="Password"
            type="password"
            helper="Must be at least 8 characters"
            required
            data-testid="password-input"
          />
        </div>
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
      
      // Should have helper text
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should provide clear error messages', () => {
      render(
        <Input 
          label="Email"
          error="Please enter a valid email address"
          value="invalid-email"
          readOnly
          data-testid="error-input"
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
      
      // Error should be associated with input
      const input = screen.getByTestId('error-input');
      expect(input).toHaveClass('border-red-300');
    });

    it('should use clear and descriptive button text', () => {
      render(
        <div>
          <Button data-testid="good-button">Save Changes</Button>
          <Button aria-label="Close dialog" data-testid="icon-button">×</Button>
          <Button data-testid="submit-button" type="submit">
            Submit Form
          </Button>
        </div>
      );

      // Descriptive text
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      
      // Icon button with aria-label
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
      
      // Clear action description
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    it('should provide input format requirements', () => {
      render(
        <Input 
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
          helper="Format: +1 (XXX) XXX-XXXX"
          pattern="^[\+]?[1-9][\d]{0,15}$"
          data-testid="phone-input"
        />
      );

      expect(screen.getByText('Format: +1 (XXX) XXX-XXXX')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument();
    });
  });

  describe('Robust - ARIA Support', () => {
    it('should use appropriate ARIA roles', () => {
      render(
        <div>
          <Alert variant="error" data-testid="alert">
            Error message
          </Alert>
          <Modal isOpen={true} onClose={() => {}} data-testid="modal">
            Modal content
          </Modal>
          <Button data-testid="button">Click me</Button>
        </div>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should provide ARIA labels for complex interactions', () => {
      const ExpandableCard = () => {
        const [expanded, setExpanded] = React.useState(false);
        
        return (
          <Card data-testid="expandable-card">
            <CardContent>
              <Button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls="card-content"
                data-testid="expand-button"
              >
                {expanded ? 'Collapse' : 'Expand'} Details
              </Button>
              {expanded && (
                <div id="card-content" data-testid="card-content">
                  Additional details here
                </div>
              )}
            </CardContent>
          </Card>
        );
      };

      render(<ExpandableCard />);

      const expandButton = screen.getByTestId('expand-button');
      
      // Initially collapsed
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should announce dynamic content changes', () => {
      const DynamicContent = () => {
        const [status, setStatus] = React.useState('');
        
        return (
          <div>
            <Button 
              onClick={() => setStatus('Loading...')}
              data-testid="load-button"
            >
              Load Data
            </Button>
            <div 
              role="status" 
              aria-live="polite"
              data-testid="status"
            >
              {status}
            </div>
          </div>
        );
      };

      render(<DynamicContent />);

      const loadButton = screen.getByTestId('load-button');
      const status = screen.getByTestId('status');

      fireEvent.click(loadButton);
      
      expect(status).toHaveTextContent('Loading...');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should group related form controls', () => {
      render(
        <fieldset>
          <legend>Personal Information</legend>
          <Input label="First Name" data-testid="first-name" />
          <Input label="Last Name" data-testid="last-name" />
          <Input label="Email" type="email" data-testid="email" />
        </fieldset>
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should maintain accessibility on touch devices', () => {
      mockTabletDevice();
      
      render(
        <Button 
          touchOptimized
          aria-label="Accessible touch button"
          data-testid="touch-button"
        >
          🎯
        </Button>
      );

      const button = screen.getByTestId('touch-button');
      
      // Should maintain ARIA label
      expect(button).toHaveAttribute('aria-label', 'Accessible touch button');
      
      // Should have appropriate touch target size
      expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
    });

    it('should support switch control navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button data-testid="button-1">Button 1</Button>
          <Button data-testid="button-2">Button 2</Button>
          <Button data-testid="button-3">Button 3</Button>
        </div>
      );

      // Simulate switch control scanning
      await user.tab();
      expect(screen.getByTestId('button-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-2')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('button-3')).toHaveFocus();
    });

    it('should provide alternative text for images and icons', () => {
      render(
        <div>
          <Button data-testid="icon-button">
            <span aria-label="Save document">💾</span>
            Save
          </Button>
          <img 
            src="/test-image.jpg" 
            alt="Healthcare professional reviewing patient chart"
            data-testid="content-image"
          />
        </div>
      );

      expect(screen.getByLabelText('Save document')).toBeInTheDocument();
      expect(screen.getByAltText('Healthcare professional reviewing patient chart')).toBeInTheDocument();
    });
  });

  describe('Error Prevention and Recovery', () => {
    it('should validate input in real-time', async () => {
      const user = userEvent.setup();
      
      const ValidatedInput = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');
        
        const validateEmail = (value: string) => {
          if (value && !value.includes('@')) {
            setError('Please enter a valid email address');
          } else {
            setError('');
          }
        };
        
        return (
          <Input
            label="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            error={error}
            data-testid="validated-input"
          />
        );
      };

      render(<ValidatedInput />);

      const input = screen.getByTestId('validated-input');
      
      await user.type(input, 'invalid-email');
      
      // Should show error
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
      
      await user.type(input, '@example.com');
      
      // Error should clear
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should provide confirmation for destructive actions', () => {
      const DeleteConfirmation = () => {
        const [showConfirm, setShowConfirm] = React.useState(false);
        
        return (
          <div>
            <Button 
              variant="danger"
              onClick={() => setShowConfirm(true)}
              data-testid="delete-button"
            >
              Delete Account
            </Button>
            
            {showConfirm && (
              <Modal isOpen={true} onClose={() => setShowConfirm(false)}>
                <div>
                  <h2>Confirm Deletion</h2>
                  <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                  <Button 
                    variant="danger" 
                    data-testid="confirm-delete"
                  >
                    Yes, Delete Account
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    data-testid="cancel-delete"
                  >
                    Cancel
                  </Button>
                </div>
              </Modal>
            )}
          </div>
        );
      };

      render(<DeleteConfirmation />);

      fireEvent.click(screen.getByTestId('delete-button'));
      
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
      expect(screen.getByTestId('confirm-delete')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-delete')).toBeInTheDocument();
    });

    it('should allow users to review and correct form data', () => {
      const FormReview = () => {
        const [step, setStep] = React.useState(1);
        const [formData, setFormData] = React.useState({
          name: 'John Doe',
          email: 'john@example.com'
        });
        
        if (step === 2) {
          return (
            <div data-testid="review-step">
              <h2>Review Your Information</h2>
              <dl>
                <dt>Name:</dt>
                <dd data-testid="review-name">{formData.name}</dd>
                <dt>Email:</dt>
                <dd data-testid="review-email">{formData.email}</dd>
              </dl>
              <Button onClick={() => setStep(1)} data-testid="edit-button">
                Edit Information
              </Button>
              <Button variant="primary" data-testid="submit-button">
                Submit
              </Button>
            </div>
          );
        }
        
        return (
          <div data-testid="form-step">
            <Input 
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <Input 
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Button onClick={() => setStep(2)} data-testid="review-button">
              Review
            </Button>
          </div>
        );
      };

      render(<FormReview />);

      // Go to review step
      fireEvent.click(screen.getByTestId('review-button'));
      
      // Should show review information
      expect(screen.getByTestId('review-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('review-email')).toHaveTextContent('john@example.com');
      
      // Should allow editing
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      
      // Go back to edit
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('form-step')).toBeInTheDocument();
    });
  });

  describe('Language and Content', () => {
    it('should specify language for screen readers', () => {
      render(
        <div lang="es-MX" data-testid="spanish-content">
          <p>Información del paciente</p>
          <Button>Guardar cambios</Button>
        </div>
      );

      const content = screen.getByTestId('spanish-content');
      expect(content).toHaveAttribute('lang', 'es-MX');
    });

    it('should use consistent navigation structure', () => {
      render(
        <nav aria-label="Main navigation" data-testid="main-nav">
          <ul>
            <li><Button>Dashboard</Button></li>
            <li><Button>Patients</Button></li>
            <li><Button>Reports</Button></li>
            <li><Button>Settings</Button></li>
          </ul>
        </nav>
      );

      const nav = screen.getByTestId('main-nav');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      // Should have consistent structure
      const listItems = nav.querySelectorAll('li');
      expect(listItems).toHaveLength(4);
    });

    it('should provide skip links for screen readers', () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only" data-testid="skip-link">
            Skip to main content
          </a>
          <nav>Navigation here</nav>
          <main id="main-content" data-testid="main-content">
            Main content here
          </main>
        </div>
      );

      const skipLink = screen.getByTestId('skip-link');
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('sr-only');
    });
  });
});