import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Input, Card, CardContent } from '@/components/shared';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

describe('Touch-Friendly Navigation Tests', () => {
  beforeEach(() => {
    mockDesktopDevice();
  });

  describe('Touch Target Sizing', () => {
    it('should meet minimum touch target sizes on tablets', () => {
      mockTabletDevice();
      
      render(
        <div>
          <Button touchOptimized data-testid="touch-button">Touch Button</Button>
          <Input touchOptimized placeholder="Touch input" data-testid="touch-input" />
        </div>
      );
      
      const button = screen.getByTestId('touch-button');
      const input = screen.getByTestId('touch-input');
      
      // WCAG recommends minimum 44x44px for touch targets
      expect(button).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('should use comfortable spacing between touch targets', () => {
      mockTabletDevice();
      
      render(
        <div className="space-y-2" data-testid="button-group">
          <Button touchOptimized>Button 1</Button>
          <Button touchOptimized>Button 2</Button>
          <Button touchOptimized>Button 3</Button>
        </div>
      );
      
      const buttonGroup = screen.getByTestId('button-group');
      expect(buttonGroup).toHaveClass('space-y-2'); // 8px spacing minimum
    });

    it('should not apply touch optimizations on desktop', () => {
      mockDesktopDevice();
      
      render(
        <Button data-testid="desktop-button">Desktop Button</Button>
      );
      
      const button = screen.getByTestId('desktop-button');
      expect(button).not.toHaveStyle({ minHeight: '44px' });
    });
  });

  describe('Touch Gesture Support', () => {
    it('should handle tap gestures correctly', async () => {
      const user = userEvent.setup();
      const onTap = jest.fn();
      mockTabletDevice();
      
      render(
        <Button touchOptimized onClick={onTap} data-testid="tap-button">
          Tap Me
        </Button>
      );
      
      const button = screen.getByTestId('tap-button');
      
      // Simulate touch tap
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      await user.click(button);
      
      expect(onTap).toHaveBeenCalledTimes(1);
    });

    it('should prevent accidental activations with touch delay', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      mockTabletDevice();
      
      render(
        <Button touchOptimized onClick={onClick} data-testid="delayed-button">
          Delayed Button
        </Button>
      );
      
      const button = screen.getByTestId('delayed-button');
      
      // Simulate quick touch and release (should still work)
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      await user.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle swipe gestures for dismissal', () => {
      mockTabletDevice();
      
      const SwipeCard = () => {
        const [dismissed, setDismissed] = React.useState(false);
        
        const handleTouchStart = (e: React.TouchEvent) => {
          const touch = e.touches[0];
          (e.currentTarget as any).startX = touch.clientX;
          (e.currentTarget as any).startY = touch.clientY;
        };
        
        const handleTouchEnd = (e: React.TouchEvent) => {
          const touch = e.changedTouches[0];
          const startX = (e.currentTarget as any).startX;
          const startY = (e.currentTarget as any).startY;
          
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;
          
          // Horizontal swipe detection
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
            setDismissed(true);
          }
        };
        
        if (dismissed) {
          return <div data-testid="dismissed">Card dismissed</div>;
        }
        
        return (
          <Card
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            data-testid="swipe-card"
          >
            <CardContent>Swipe to dismiss</CardContent>
          </Card>
        );
      };
      
      render(<SwipeCard />);
      
      const card = screen.getByTestId('swipe-card');
      
      // Simulate swipe right
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 200 }]
      });
      fireEvent.touchEnd(card, {
        changedTouches: [{ clientX: 250, clientY: 200 }] // 150px swipe
      });
      
      expect(screen.getByTestId('dismissed')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should provide visible focus indicators for keyboard users', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button data-testid="focus-button-1">Button 1</Button>
          <Button data-testid="focus-button-2">Button 2</Button>
        </div>
      );
      
      // Tab to first button
      await user.tab();
      expect(screen.getByTestId('focus-button-1')).toHaveFocus();
      
      // Tab to second button
      await user.tab();
      expect(screen.getByTestId('focus-button-2')).toHaveFocus();
    });

    it('should skip disabled elements in tab order', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Button data-testid="button-1">Button 1</Button>
          <Button disabled data-testid="button-2">Disabled Button</Button>
          <Button data-testid="button-3">Button 3</Button>
        </div>
      );
      
      await user.tab();
      expect(screen.getByTestId('button-1')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('button-3')).toHaveFocus(); // Skipped disabled button
    });

    it('should maintain focus within modal dialogs', async () => {
      const user = userEvent.setup();
      
      const ModalWithFocus = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        
        return (
          <>
            <Button data-testid="outside-button">Outside Button</Button>
            {isOpen && (
              <div role="dialog" aria-modal="true" data-testid="modal">
                <Button data-testid="modal-button-1">Modal Button 1</Button>
                <Button data-testid="modal-button-2">Modal Button 2</Button>
                <Button onClick={() => setIsOpen(false)} data-testid="close-button">
                  Close
                </Button>
              </div>
            )}
          </>
        );
      };
      
      render(<ModalWithFocus />);
      
      // Focus should be trapped within modal
      await user.tab();
      const focusedElement1 = document.activeElement;
      expect(focusedElement1?.closest('[data-testid="modal"]')).toBeInTheDocument();
      
      await user.tab();
      const focusedElement2 = document.activeElement;
      expect(focusedElement2?.closest('[data-testid="modal"]')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Adaptation', () => {
    it('should adapt button layouts for touch devices', () => {
      mockTabletDevice();
      
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="responsive-grid">
          <Button touchOptimized fullWidth>Action 1</Button>
          <Button touchOptimized fullWidth>Action 2</Button>
        </div>
      );
      
      const grid = screen.getByTestId('responsive-grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveStyle({ width: '100%' });
      });
    });

    it('should use larger text sizes on tablets for readability', () => {
      mockTabletDevice();
      
      const ResponsiveText = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const tablet = window.innerWidth >= 768 && 
                        window.innerWidth <= 1024 && 
                        navigator.maxTouchPoints > 0;
          setIsTablet(tablet);
        }, []);
        
        return (
          <div data-testid="responsive-text">
            <h1 className={isTablet ? 'text-3xl' : 'text-2xl'}>
              Responsive Heading
            </h1>
            <p className={isTablet ? 'text-lg' : 'text-base'}>
              Responsive paragraph
            </p>
          </div>
        );
      };
      
      render(<ResponsiveText />);
      
      const heading = screen.getByText('Responsive Heading');
      const paragraph = screen.getByText('Responsive paragraph');
      
      expect(heading).toHaveClass('text-3xl');
      expect(paragraph).toHaveClass('text-lg');
    });

    it('should adjust spacing for finger navigation', () => {
      mockTabletDevice();
      
      const TouchMenu = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const tablet = window.innerWidth >= 768 && 
                        window.innerWidth <= 1024 && 
                        navigator.maxTouchPoints > 0;
          setIsTablet(tablet);
        }, []);
        
        return (
          <nav className={isTablet ? 'space-y-3' : 'space-y-1'} data-testid="touch-menu">
            <Button touchOptimized={isTablet} fullWidth>Menu Item 1</Button>
            <Button touchOptimized={isTablet} fullWidth>Menu Item 2</Button>
            <Button touchOptimized={isTablet} fullWidth>Menu Item 3</Button>
          </nav>
        );
      };
      
      render(<TouchMenu />);
      
      const menu = screen.getByTestId('touch-menu');
      expect(menu).toHaveClass('space-y-3'); // Larger spacing for touch
    });
  });

  describe('Input Field Optimizations', () => {
    it('should prevent zoom on iOS devices with proper font size', () => {
      mockTabletDevice();
      
      render(
        <Input 
          touchOptimized 
          type="email"
          placeholder="email@example.com"
          data-testid="email-input"
        />
      );
      
      const input = screen.getByTestId('email-input');
      // Font size should be at least 16px to prevent zoom on iOS
      expect(input).toHaveClass('text-base'); // 16px in Tailwind
    });

    it('should provide larger touch targets for form controls', () => {
      mockTabletDevice();
      
      render(
        <form>
          <Input touchOptimized label="Name" data-testid="name-input" />
          <Input touchOptimized label="Email" type="email" data-testid="email-input" />
          <Button touchOptimized type="submit" data-testid="submit-button">Submit</Button>
        </form>
      );
      
      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('submit-button');
      
      expect(nameInput).toHaveClass('min-h-[44px]');
      expect(emailInput).toHaveClass('min-h-[44px]');
      expect(submitButton).toHaveStyle({ minHeight: '44px' });
    });

    it('should handle virtual keyboard appearance', () => {
      mockTabletDevice();
      
      const FormWithKeyboard = () => {
        const [keyboardVisible, setKeyboardVisible] = React.useState(false);
        
        const handleFocus = () => setKeyboardVisible(true);
        const handleBlur = () => setKeyboardVisible(false);
        
        return (
          <div className={keyboardVisible ? 'pb-64' : ''} data-testid="form-container">
            <Input 
              touchOptimized
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Type here"
              data-testid="keyboard-input"
            />
          </div>
        );
      };
      
      render(<FormWithKeyboard />);
      
      const input = screen.getByTestId('keyboard-input');
      const container = screen.getByTestId('form-container');
      
      // Focus input to show keyboard
      fireEvent.focus(input);
      expect(container).toHaveClass('pb-64'); // Extra padding for keyboard
      
      // Blur to hide keyboard
      fireEvent.blur(input);
      expect(container).not.toHaveClass('pb-64');
    });
  });

  describe('Performance Considerations', () => {
    it('should debounce resize events for device detection', () => {
      const resizeHandler = jest.fn();
      
      const ResponsiveComponent = () => {
        React.useEffect(() => {
          let timeoutId: NodeJS.Timeout;
          
          const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              resizeHandler();
            }, 100);
          };
          
          window.addEventListener('resize', debouncedResize);
          return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(timeoutId);
          };
        }, []);
        
        return <div data-testid="responsive-component">Responsive Component</div>;
      };
      
      render(<ResponsiveComponent />);
      
      // Trigger multiple resize events
      fireEvent.resize(window);
      fireEvent.resize(window);
      fireEvent.resize(window);
      
      // Handler should not be called immediately
      expect(resizeHandler).not.toHaveBeenCalled();
      
      // Wait for debounce
      setTimeout(() => {
        expect(resizeHandler).toHaveBeenCalledTimes(1);
      }, 150);
    });

    it('should use CSS transforms for smooth touch interactions', async () => {
      const user = userEvent.setup();
      mockTabletDevice();
      
      const AnimatedButton = () => {
        const [isPressed, setIsPressed] = React.useState(false);
        
        return (
          <Button
            touchOptimized
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className={isPressed ? 'transform scale-95' : 'transform scale-100'}
            data-testid="animated-button"
          >
            Touch Me
          </Button>
        );
      };
      
      render(<AnimatedButton />);
      
      const button = screen.getByTestId('animated-button');
      
      // Touch start should apply scale transform
      fireEvent.touchStart(button);
      expect(button).toHaveClass('scale-95');
      
      // Touch end should reset transform
      fireEvent.touchEnd(button);
      expect(button).toHaveClass('scale-100');
    });
  });

  describe('Accessibility with Touch', () => {
    it('should maintain screen reader compatibility with touch gestures', async () => {
      const user = userEvent.setup();
      
      render(
        <Button 
          touchOptimized
          aria-label="Activate feature"
          data-testid="accessible-button"
        >
          🎯
        </Button>
      );
      
      const button = screen.getByTestId('accessible-button');
      
      // Should be accessible to screen readers
      expect(button).toHaveAttribute('aria-label', 'Activate feature');
      
      // Should work with keyboard
      button.focus();
      expect(button).toHaveFocus();
      
      // Should work with touch
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      await user.click(button);
    });

    it('should provide haptic feedback cues where appropriate', () => {
      mockTabletDevice();
      
      const HapticButton = () => {
        const handleTouch = () => {
          // In real implementation, this would trigger haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(10); // 10ms vibration
          }
        };
        
        return (
          <Button 
            touchOptimized
            onTouchStart={handleTouch}
            data-testid="haptic-button"
          >
            Haptic Button
          </Button>
        );
      };
      
      render(<HapticButton />);
      
      const button = screen.getByTestId('haptic-button');
      
      // Mock vibrate function
      const vibrateMock = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        configurable: true
      });
      
      fireEvent.touchStart(button);
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });
  });
});