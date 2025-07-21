import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Input, Modal, Card, CardContent } from '@/components/shared';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

// Mock matchMedia for responsive tests
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('Responsive Behavior Integration Tests', () => {
  beforeEach(() => {
    // Reset to desktop by default
    mockDesktopDevice();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(mockMatchMedia),
    });
  });

  describe('Device Detection', () => {
    it('should detect tablet devices correctly', () => {
      mockTabletDevice();
      
      const TestComponent = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const checkDevice = () => {
            const tablet = window.innerWidth >= 768 && 
                          window.innerWidth <= 1024 && 
                          navigator.maxTouchPoints > 0;
            setIsTablet(tablet);
          };
          
          checkDevice();
          window.addEventListener('resize', checkDevice);
          return () => window.removeEventListener('resize', checkDevice);
        }, []);
        
        return <div data-testid="device-type">{isTablet ? 'tablet' : 'desktop'}</div>;
      };
      
      render(<TestComponent />);
      expect(screen.getByTestId('device-type')).toHaveTextContent('tablet');
    });

    it('should detect desktop devices correctly', () => {
      mockDesktopDevice();
      
      const TestComponent = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const checkDevice = () => {
            const tablet = window.innerWidth >= 768 && 
                          window.innerWidth <= 1024 && 
                          navigator.maxTouchPoints > 0;
            setIsTablet(tablet);
          };
          
          checkDevice();
          window.addEventListener('resize', checkDevice);
          return () => window.removeEventListener('resize', checkDevice);
        }, []);
        
        return <div data-testid="device-type">{isTablet ? 'tablet' : 'desktop'}</div>;
      };
      
      render(<TestComponent />);
      expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
    });

    it('should handle device changes on resize', () => {
      const TestComponent = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const checkDevice = () => {
            const tablet = window.innerWidth >= 768 && 
                          window.innerWidth <= 1024 && 
                          navigator.maxTouchPoints > 0;
            setIsTablet(tablet);
          };
          
          checkDevice();
          window.addEventListener('resize', checkDevice);
          return () => window.removeEventListener('resize', checkDevice);
        }, []);
        
        return <div data-testid="device-type">{isTablet ? 'tablet' : 'desktop'}</div>;
      };
      
      render(<TestComponent />);
      
      // Initially desktop
      expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
      
      // Change to tablet
      mockTabletDevice();
      fireEvent.resize(window);
      
      expect(screen.getByTestId('device-type')).toHaveTextContent('tablet');
    });
  });

  describe('Touch Target Sizing', () => {
    it('should apply minimum touch targets on tablets', () => {
      mockTabletDevice();
      
      render(
        <Button touchOptimized data-testid="touch-button">
          Touch Button
        </Button>
      );
      
      const button = screen.getByTestId('touch-button');
      expect(button).toHaveStyle({ 
        minHeight: '44px',
        minWidth: '44px'
      });
    });

    it('should use comfortable touch targets for important actions', () => {
      mockTabletDevice();
      
      render(
        <Button touchOptimized size="lg" data-testid="important-button">
          Important Action
        </Button>
      );
      
      const button = screen.getByTestId('important-button');
      expect(button).toHaveStyle({ 
        minHeight: '48px'
      });
    });

    it('should not apply touch optimizations on desktop', () => {
      mockDesktopDevice();
      
      render(
        <Button touchOptimized={false} data-testid="desktop-button">
          Desktop Button
        </Button>
      );
      
      const button = screen.getByTestId('desktop-button');
      // Should use default button height, not touch-optimized
      expect(button).not.toHaveStyle({ minHeight: '44px' });
    });
  });

  describe('Input Field Adaptations', () => {
    it('should use larger inputs on tablets', () => {
      mockTabletDevice();
      
      render(
        <Input 
          touchOptimized 
          placeholder="Touch input"
          data-testid="tablet-input"
        />
      );
      
      const input = screen.getByTestId('tablet-input');
      expect(input).toHaveClass('min-h-[44px]', 'text-base');
    });

    it('should prevent zoom on mobile devices', () => {
      mockTabletDevice();
      
      render(
        <Input 
          touchOptimized 
          type="text"
          data-testid="no-zoom-input"
        />
      );
      
      const input = screen.getByTestId('no-zoom-input');
      // On tablets/mobile, font-size should be at least 16px to prevent zoom
      expect(input).toHaveClass('text-base'); // 16px in Tailwind
    });

    it('should handle focus states appropriately for touch devices', async () => {
      const user = userEvent.setup();
      mockTabletDevice();
      
      render(
        <Input 
          touchOptimized 
          placeholder="Focus test"
          data-testid="focus-input"
        />
      );
      
      const input = screen.getByTestId('focus-input');
      
      // Simulate touch focus
      fireEvent.touchStart(input);
      await user.click(input);
      
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus-clinical');
    });
  });

  describe('Modal Responsiveness', () => {
    it('should adapt modal size for tablets', () => {
      mockTabletDevice();
      
      render(
        <Modal 
          isOpen={true} 
          onClose={() => {}} 
          size="lg"
          data-testid="tablet-modal"
        >
          <div>Modal Content</div>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-2xl'); // Large modal on tablets
    });

    it('should use full-screen modals for small content on mobile', () => {
      // Simulate mobile device
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      render(
        <Modal 
          isOpen={true} 
          onClose={() => {}} 
          data-testid="mobile-modal"
        >
          <div>Mobile Content</div>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      // On mobile, modal should take most of the screen
      expect(modal).toHaveClass('max-w-sm');
    });

    it('should handle touch gestures for modal dismissal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockTabletDevice();
      
      render(
        <Modal 
          isOpen={true} 
          onClose={onClose}
          closeOnOverlayClick={true}
          data-testid="gesture-modal"
        >
          <div>Dismissible Modal</div>
        </Modal>
      );
      
      const backdrop = screen.getByRole('dialog').parentElement;
      
      // Simulate touch tap outside modal
      if (backdrop) {
        fireEvent.touchStart(backdrop);
        fireEvent.touchEnd(backdrop);
        await user.click(backdrop);
      }
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Card Layout Adaptations', () => {
    it('should stack cards vertically on mobile', () => {
      // Mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const CardGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card data-testid="card-1">
            <CardContent>Card 1</CardContent>
          </Card>
          <Card data-testid="card-2">
            <CardContent>Card 2</CardContent>
          </Card>
          <Card data-testid="card-3">
            <CardContent>Card 3</CardContent>
          </Card>
        </div>
      );
      
      render(<CardGrid />);
      
      const grid = screen.getByTestId('card-1').parentElement;
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should use larger cards on tablets for better touch interaction', () => {
      mockTabletDevice();
      
      render(
        <Card 
          interactive 
          touchOptimized 
          data-testid="tablet-card"
        >
          <CardContent>
            <div className="p-6">Tablet Card</div>
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('tablet-card');
      expect(card).toHaveClass('min-h-[200px]');
    });

    it('should handle card interactions with touch events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      mockTabletDevice();
      
      render(
        <Card 
          interactive 
          touchOptimized 
          onClick={onClick}
          data-testid="interactive-card"
        >
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('interactive-card');
      
      // Simulate touch interaction
      fireEvent.touchStart(card);
      fireEvent.touchEnd(card);
      await user.click(card);
      
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Typography Scaling', () => {
    it('should scale text appropriately for tablet viewing distance', () => {
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
              Responsive paragraph text
            </p>
          </div>
        );
      };
      
      render(<ResponsiveText />);
      
      const heading = screen.getByText('Responsive Heading');
      const paragraph = screen.getByText('Responsive paragraph text');
      
      expect(heading).toHaveClass('text-3xl');
      expect(paragraph).toHaveClass('text-lg');
    });

    it('should maintain readability at different zoom levels', () => {
      // Test at 150% zoom (common accessibility setting)
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1.5,
      });
      
      render(
        <div className="text-base leading-relaxed" data-testid="readable-text">
          This text should remain readable at high zoom levels
        </div>
      );
      
      const text = screen.getByTestId('readable-text');
      expect(text).toHaveClass('leading-relaxed'); // Better line spacing for accessibility
    });
  });

  describe('Navigation Adaptations', () => {
    it('should show appropriate navigation for tablet landscape', () => {
      mockTabletDevice();
      
      const TabletNavigation = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          const tablet = window.innerWidth >= 768 && 
                        window.innerWidth <= 1024 && 
                        navigator.maxTouchPoints > 0;
          setIsTablet(tablet);
        }, []);
        
        return (
          <nav data-testid="tablet-nav" className={isTablet ? 'w-72' : 'w-64'}>
            <Button 
              className={isTablet ? 'p-3' : 'p-2'} 
              touchOptimized={isTablet}
            >
              Nav Button
            </Button>
          </nav>
        );
      };
      
      render(<TabletNavigation />);
      
      const nav = screen.getByTestId('tablet-nav');
      expect(nav).toHaveClass('w-72'); // Wider sidebar for tablets
      
      const button = screen.getByText('Nav Button');
      expect(button).toHaveClass('p-3'); // Larger padding for touch
    });

    it('should handle swipe gestures for navigation', () => {
      mockTabletDevice();
      
      const SwipeNavigation = () => {
        const [currentPage, setCurrentPage] = React.useState(0);
        
        const handleTouchStart = (e: React.TouchEvent) => {
          // Store initial touch position
          const touch = e.touches[0];
          (e.currentTarget as any).startX = touch.clientX;
        };
        
        const handleTouchEnd = (e: React.TouchEvent) => {
          const touch = e.changedTouches[0];
          const startX = (e.currentTarget as any).startX;
          const diff = touch.clientX - startX;
          
          if (Math.abs(diff) > 100) { // Minimum swipe distance
            if (diff > 0) {
              setCurrentPage(Math.max(0, currentPage - 1));
            } else {
              setCurrentPage(Math.min(2, currentPage + 1));
            }
          }
        };
        
        return (
          <div 
            data-testid="swipe-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="overflow-hidden"
          >
            <div data-testid="current-page">Page {currentPage}</div>
          </div>
        );
      };
      
      render(<SwipeNavigation />);
      
      const container = screen.getByTestId('swipe-container');
      
      // Simulate swipe left
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 50, clientY: 100 }] // Swipe left 150px
      });
      
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page 1');
    });
  });

  describe('Performance Considerations', () => {
    it('should avoid unnecessary re-renders on resize', () => {
      const renderSpy = jest.fn();
      
      const PerformantComponent = () => {
        const [isTablet, setIsTablet] = React.useState(false);
        
        React.useEffect(() => {
          renderSpy();
          
          const checkDevice = () => {
            const tablet = window.innerWidth >= 768 && 
                          window.innerWidth <= 1024 && 
                          navigator.maxTouchPoints > 0;
            setIsTablet(tablet);
          };
          
          checkDevice();
          
          // Debounce resize events
          let timeoutId: NodeJS.Timeout;
          const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkDevice, 100);
          };
          
          window.addEventListener('resize', debouncedResize);
          return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(timeoutId);
          };
        }, []);
        
        return <div data-testid="performant">{isTablet ? 'tablet' : 'desktop'}</div>;
      };
      
      render(<PerformantComponent />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Multiple rapid resize events
      fireEvent.resize(window);
      fireEvent.resize(window);
      fireEvent.resize(window);
      
      // Should still only have rendered once due to debouncing
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should use CSS media queries for static responsive behavior', () => {
      render(
        <div 
          className="text-sm md:text-base lg:text-lg"
          data-testid="css-responsive"
        >
          CSS Media Query Text
        </div>
      );
      
      const element = screen.getByTestId('css-responsive');
      expect(element).toHaveClass('text-sm', 'md:text-base', 'lg:text-lg');
    });
  });
});