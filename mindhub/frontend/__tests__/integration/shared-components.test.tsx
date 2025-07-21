import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  Button, 
  Input, 
  Modal, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Loading,
  Alert
} from '@/components/shared';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

describe('Shared Components Integration', () => {
  beforeEach(() => {
    // Reset to desktop by default
    mockDesktopDevice();
  });

  describe('Button Component', () => {
    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-100');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });

    it('should adapt to tablet sizes when touchOptimized is true', () => {
      mockTabletDevice();
      
      render(<Button touchOptimized>Touch Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
    });

    it('should show loading state', () => {
      render(<Button loading>Loading Button</Button>);
      
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render with icons', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      
      render(
        <Button icon={<TestIcon />} iconPosition="left">
          With Icon
        </Button>
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('should render with label and helper text', () => {
      render(
        <Input 
          label="Email Address"
          helper="Enter your email address"
          placeholder="email@example.com"
        />
      );
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(
        <Input 
          label="Email"
          error="Invalid email address"
          value="invalid-email"
          readOnly
        />
      );
      
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
      expect(screen.getByDisplayValue('invalid-email')).toHaveClass('border-red-300');
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} placeholder="Type here" />);
      
      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'Hello world');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should render with icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">L</span>;
      const RightIcon = () => <span data-testid="right-icon">R</span>;
      
      render(
        <Input 
          leftIcon={<LeftIcon />}
          rightIcon={<RightIcon />}
          placeholder="With icons"
        />
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should be touch-optimized on tablets', () => {
      mockTabletDevice();
      
      render(<Input touchOptimized placeholder="Touch input" />);
      
      const input = screen.getByPlaceholderText('Touch input');
      expect(input).toHaveClass('min-h-[44px]', 'text-base');
    });
  });

  describe('Modal Component', () => {
    it('should not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal content</div>
        </Modal>
      );
      
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should call onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={true}>
          <div>Modal content</div>
        </Modal>
      );
      
      // Click the backdrop (not the modal content)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).toHaveBeenCalled();
      }
    });

    it('should call onClose when pressing Escape', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();
      
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={true}>
          <div>Modal content</div>
        </Modal>
      );
      
      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should render with footer', () => {
      const footer = (
        <div>
          <Button>Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      );
      
      render(
        <Modal isOpen={true} onClose={() => {}} footer={footer}>
          <div>Modal content</div>
        </Modal>
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('should render with different variants', () => {
      const { rerender } = render(
        <Card variant="default" data-testid="card">
          <div>Content</div>
        </Card>
      );
      
      expect(screen.getByTestId('card')).toHaveClass('border', 'shadow-sm');
      
      rerender(
        <Card variant="elevated" data-testid="card">
          <div>Content</div>
        </Card>
      );
      
      expect(screen.getByTestId('card')).toHaveClass('shadow-md');
    });

    it('should be interactive when specified', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <Card interactive onClick={handleClick}>
          <div>Clickable card</div>
        </Card>
      );
      
      await user.click(screen.getByText('Clickable card'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('should render with sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Card content</div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });

  describe('Loading Component', () => {
    it('should render different variants', () => {
      const { rerender } = render(<Loading variant="spinner" data-testid="loading" />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      rerender(<Loading variant="dots" data-testid="loading" />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      rerender(<Loading variant="skeleton" data-testid="loading" />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should render with text', () => {
      render(<Loading text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render fullscreen', () => {
      render(<Loading fullScreen text="Loading..." />);
      const container = screen.getByText('Loading...').closest('div');
      expect(container).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Alert Component', () => {
    it('should render different variants', () => {
      const { rerender } = render(
        <Alert variant="success">Success message</Alert>
      );
      expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
      
      rerender(<Alert variant="error">Error message</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
      
      rerender(<Alert variant="warning">Warning message</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
      
      rerender(<Alert variant="info">Info message</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
    });

    it('should be dismissible', async () => {
      const user = userEvent.setup();
      const handleDismiss = jest.fn();
      
      render(
        <Alert dismissible onDismiss={handleDismiss}>
          Dismissible alert
        </Alert>
      );
      
      const dismissButton = screen.getByRole('button');
      await user.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalled();
    });

    it('should render with title', () => {
      render(
        <Alert title="Alert Title" variant="info">
          Alert message
        </Alert>
      );
      
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work together in a complex form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      
      const TestForm = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState('');
        const [email, setEmail] = React.useState('');
        
        const handleFormSubmit = async () => {
          setLoading(true);
          setError('');
          
          if (!email.includes('@')) {
            setError('Invalid email address');
            setLoading(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          setLoading(false);
          handleSubmit(email);
          setIsOpen(false);
        };
        
        return (
          <>
            <Button onClick={() => setIsOpen(true)}>
              Open Form
            </Button>
            
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="User Form">
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  placeholder="Enter your email"
                />
                
                {error && (
                  <Alert variant="error">
                    {error}
                  </Alert>
                )}
                
                {loading && <Loading text="Submitting..." />}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleFormSubmit}
                    loading={loading}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </Modal>
          </>
        );
      };
      
      render(<TestForm />);
      
      // Open modal
      await user.click(screen.getByText('Open Form'));
      expect(screen.getByText('User Form')).toBeInTheDocument();
      
      // Try invalid email
      await user.type(screen.getByPlaceholderText('Enter your email'), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
      
      // Clear and enter valid email
      await user.clear(screen.getByPlaceholderText('Enter your email'));
      await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith('test@example.com');
      }, { timeout: 1000 });
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('User Form')).not.toBeInTheDocument();
      });
    });

    it('should handle responsive behavior', () => {
      mockTabletDevice();
      
      const TestResponsive = () => (
        <Card interactive touchOptimized>
          <CardContent>
            <Input 
              touchOptimized
              placeholder="Touch-optimized input"
            />
            <Button 
              touchOptimized
              variant="primary"
              fullWidth
            >
              Touch-optimized button
            </Button>
          </CardContent>
        </Card>
      );
      
      render(<TestResponsive />);
      
      const input = screen.getByPlaceholderText('Touch-optimized input');
      const button = screen.getByRole('button');
      
      expect(input).toHaveClass('min-h-[44px]');
      expect(button).toHaveStyle({ minHeight: '44px' });
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(
        <div>
          <Button aria-label="Close dialog">×</Button>
          <Input label="Email" required />
          <Alert variant="error">Error message</Alert>
        </div>
      );
      
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button>First Button</Button>
          <Input placeholder="Input field" />
          <Button>Second Button</Button>
        </div>
      );
      
      // Tab through elements
      await user.tab();
      expect(screen.getByText('First Button')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByPlaceholderText('Input field')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Second Button')).toHaveFocus();
    });

    it('should handle focus management in modals', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <Input placeholder="First input" />
          <Input placeholder="Second input" />
          <Button>Modal button</Button>
        </Modal>
      );
      
      // Focus should be trapped within modal
      await user.tab();
      expect(screen.getByPlaceholderText('First input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByPlaceholderText('Second input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Modal button')).toHaveFocus();
    });
  });
});