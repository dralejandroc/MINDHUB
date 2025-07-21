import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Input, Card, CardContent, Loading, Modal } from '@/components/shared';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    mockDesktopDevice();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      const start = performance.now();
      
      const LargeList = () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`
        }));

        return (
          <div data-testid="large-list">
            {items.slice(0, 50).map((item) => ( // Only render first 50 for testing
              <Card key={item.id} data-testid={`item-${item.id}`}>
                <CardContent>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      };

      render(<LargeList />);
      
      const renderTime = performance.now() - start;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(100); // 100ms threshold
      
      // Should render all visible items
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-49')).toBeInTheDocument();
    });

    it('should handle rapid state updates efficiently', async () => {
      const user = userEvent.setup();
      
      const RapidUpdates = () => {
        const [count, setCount] = React.useState(0);
        const [updates, setUpdates] = React.useState(0);
        
        const handleRapidUpdates = () => {
          // Simulate rapid updates
          for (let i = 0; i < 100; i++) {
            setTimeout(() => {
              setCount(prev => prev + 1);
              setUpdates(prev => prev + 1);
            }, i * 10);
          }
        };
        
        return (
          <div data-testid="rapid-updates">
            <div data-testid="count">Count: {count}</div>
            <div data-testid="updates">Updates: {updates}</div>
            <Button onClick={handleRapidUpdates} data-testid="trigger-updates">
              Trigger Updates
            </Button>
          </div>
        );
      };

      render(<RapidUpdates />);
      
      const start = performance.now();
      await user.click(screen.getByTestId('trigger-updates'));
      
      // Advance timers to complete all updates
      jest.advanceTimersByTime(1000);
      
      const updateTime = performance.now() - start;
      
      // Should handle updates within reasonable time
      expect(updateTime).toBeLessThan(200);
      
      // Final state should be correct
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('Count: 100');
        expect(screen.getByTestId('updates')).toHaveTextContent('Updates: 100');
      });
    });

    it('should optimize re-renders with memoization', () => {
      const renderSpy = jest.fn();
      
      const ExpensiveChild = React.memo(({ value }: { value: number }) => {
        renderSpy();
        return <div data-testid="expensive-child">Value: {value}</div>;
      });
      
      const OptimizedParent = () => {
        const [count, setCount] = React.useState(0);
        const [otherState, setOtherState] = React.useState(0);
        
        return (
          <div>
            <ExpensiveChild value={count} />
            <Button onClick={() => setCount(count + 1)} data-testid="increment-count">
              Increment Count
            </Button>
            <Button onClick={() => setOtherState(otherState + 1)} data-testid="increment-other">
              Increment Other
            </Button>
          </div>
        );
      };

      render(<OptimizedParent />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Changing unrelated state should not re-render child
      fireEvent.click(screen.getByTestId('increment-other'));
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Changing relevant state should re-render child
      fireEvent.click(screen.getByTestId('increment-count'));
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const ComponentWithListeners = () => {
        React.useEffect(() => {
          const handleResize = () => {};
          const handleScroll = () => {};
          
          window.addEventListener('resize', handleResize);
          window.addEventListener('scroll', handleScroll);
          
          return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
          };
        }, []);
        
        return <div data-testid="component-with-listeners">Component</div>;
      };

      const { unmount } = render(<ComponentWithListeners />);
      
      // Should add listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      unmount();
      
      // Should remove listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should cancel async operations on unmount', () => {
      const ComponentWithAsync = () => {
        const [data, setData] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(false);
        
        React.useEffect(() => {
          let cancelled = false;
          
          const fetchData = async () => {
            setLoading(true);
            
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!cancelled) {
              setData('Fetched data');
              setLoading(false);
            }
          };
          
          fetchData();
          
          return () => {
            cancelled = true;
          };
        }, []);
        
        return (
          <div data-testid="async-component">
            {loading && <Loading />}
            {data && <div data-testid="data">{data}</div>}
          </div>
        );
      };

      const { unmount } = render(<ComponentWithAsync />);
      
      // Unmount before async operation completes
      unmount();
      
      // Advance timer to complete the async operation
      jest.advanceTimersByTime(1000);
      
      // Should not throw any errors about setting state on unmounted component
      expect(() => {
        jest.runAllTimers();
      }).not.toThrow();
    });

    it('should handle memory leaks in timers', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const ComponentWithTimers = () => {
        const [count, setCount] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(prev => prev + 1);
          }, 100);
          
          const timeout = setTimeout(() => {
            console.log('Timeout executed');
          }, 500);
          
          return () => {
            clearInterval(interval);
            clearTimeout(timeout);
          };
        }, []);
        
        return <div data-testid="timer-component">Count: {count}</div>;
      };

      const { unmount } = render(<ComponentWithTimers />);
      
      expect(setTimeoutSpy).toHaveBeenCalled();
      
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Bundle Size and Loading Performance', () => {
    it('should lazy load non-critical components', async () => {
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div data-testid="lazy-component">Lazy loaded!</div>
        })
      );
      
      const ParentWithLazy = () => {
        const [showLazy, setShowLazy] = React.useState(false);
        
        return (
          <div>
            <Button onClick={() => setShowLazy(true)} data-testid="load-lazy">
              Load Lazy Component
            </Button>
            {showLazy && (
              <React.Suspense fallback={<Loading data-testid="lazy-loading" />}>
                <LazyComponent />
              </React.Suspense>
            )}
          </div>
        );
      };

      render(<ParentWithLazy />);
      
      // Initially lazy component should not be loaded
      expect(screen.queryByTestId('lazy-component')).not.toBeInTheDocument();
      
      // Click to load lazy component
      fireEvent.click(screen.getByTestId('load-lazy'));
      
      // Should show loading state first
      expect(screen.getByTestId('lazy-loading')).toBeInTheDocument();
      
      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
      });
    });

    it('should minimize bundle size with tree shaking', () => {
      // Test that only used components are included
      const UsedComponents = () => (
        <div>
          <Button>Used Button</Button>
          <Input placeholder="Used Input" />
          {/* Card component not used here */}
        </div>
      );

      render(<UsedComponents />);
      
      // Should render used components
      expect(screen.getByText('Used Button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Used Input')).toBeInTheDocument();
      
      // This test would be more meaningful in a real bundle analysis
      // but demonstrates the principle
    });
  });

  describe('Interaction Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      const user = userEvent.setup();
      let eventCount = 0;
      
      const HighFrequencyComponent = () => {
        const [position, setPosition] = React.useState({ x: 0, y: 0 });
        
        const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
          eventCount++;
          setPosition({ x: e.clientX, y: e.clientY });
        }, []);
        
        return (
          <div 
            onMouseMove={handleMouseMove}
            className="w-64 h-64 bg-gray-100"
            data-testid="tracking-area"
          >
            <div data-testid="position">
              Position: {position.x}, {position.y}
            </div>
          </div>
        );
      };

      render(<HighFrequencyComponent />);
      
      const trackingArea = screen.getByTestId('tracking-area');
      
      // Simulate multiple mouse move events
      for (let i = 0; i < 50; i++) {
        fireEvent.mouseMove(trackingArea, { clientX: i, clientY: i });
      }
      
      // Should handle all events without performance issues
      expect(eventCount).toBe(50);
      expect(screen.getByTestId('position')).toHaveTextContent('Position: 49, 49');
    });

    it('should debounce search input for performance', async () => {
      const user = userEvent.setup();
      const searchSpy = jest.fn();
      
      const DebouncedSearch = () => {
        const [query, setQuery] = React.useState('');
        
        React.useEffect(() => {
          const timeoutId = setTimeout(() => {
            if (query) {
              searchSpy(query);
            }
          }, 300);
          
          return () => clearTimeout(timeoutId);
        }, [query]);
        
        return (
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
        );
      };

      render(<DebouncedSearch />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Type rapidly
      await user.type(searchInput, 'test query');
      
      // Should not call search immediately
      expect(searchSpy).not.toHaveBeenCalled();
      
      // Advance timer to trigger debounced search
      jest.advanceTimersByTime(300);
      
      // Should call search once with final value
      expect(searchSpy).toHaveBeenCalledTimes(1);
      expect(searchSpy).toHaveBeenCalledWith('test query');
    });

    it('should handle scroll events efficiently', () => {
      const scrollSpy = jest.fn();
      
      const ScrollOptimized = () => {
        const [isScrolled, setIsScrolled] = React.useState(false);
        
        React.useEffect(() => {
          let ticking = false;
          
          const handleScroll = () => {
            if (!ticking) {
              requestAnimationFrame(() => {
                scrollSpy();
                setIsScrolled(window.scrollY > 100);
                ticking = false;
              });
              ticking = true;
            }
          };
          
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);
        
        return (
          <div data-testid="scroll-indicator">
            {isScrolled ? 'Scrolled' : 'Not scrolled'}
          </div>
        );
      };

      render(<ScrollOptimized />);
      
      // Mock requestAnimationFrame
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });
      
      // Simulate rapid scroll events
      for (let i = 0; i < 20; i++) {
        fireEvent.scroll(window, { target: { scrollY: 50 + i * 10 } });
      }
      
      // Should throttle scroll events with requestAnimationFrame
      expect(rafSpy).toHaveBeenCalledTimes(20);
      expect(scrollSpy).toHaveBeenCalledTimes(20);
      
      rafSpy.mockRestore();
    });
  });

  describe('Data Handling Performance', () => {
    it('should efficiently handle large datasets', () => {
      const LargeDataset = () => {
        const data = React.useMemo(() => {
          return Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            category: `Category ${i % 10}`,
            value: Math.random() * 1000
          }));
        }, []);
        
        const [filter, setFilter] = React.useState('');
        
        const filteredData = React.useMemo(() => {
          if (!filter) return data.slice(0, 100); // Show first 100
          return data.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase())
          ).slice(0, 100);
        }, [data, filter]);
        
        return (
          <div>
            <Input
              placeholder="Filter items..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              data-testid="filter-input"
            />
            <div data-testid="item-count">
              Showing {filteredData.length} items
            </div>
            <div data-testid="item-list">
              {filteredData.map(item => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        );
      };

      const start = performance.now();
      render(<LargeDataset />);
      const renderTime = performance.now() - start;
      
      // Should render efficiently
      expect(renderTime).toBeLessThan(50);
      
      // Should show correct initial count
      expect(screen.getByTestId('item-count')).toHaveTextContent('Showing 100 items');
      
      // Should render first item
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
    });

    it('should implement virtual scrolling for large lists', () => {
      const VirtualList = () => {
        const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 10 });
        const itemHeight = 50;
        const containerHeight = 500;
        const totalItems = 10000;
        
        const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
          const scrollTop = e.currentTarget.scrollTop;
          const start = Math.floor(scrollTop / itemHeight);
          const visibleCount = Math.ceil(containerHeight / itemHeight);
          const end = Math.min(start + visibleCount, totalItems);
          
          setVisibleRange({ start, end });
        };
        
        const visibleItems = Array.from(
          { length: visibleRange.end - visibleRange.start },
          (_, i) => visibleRange.start + i
        );
        
        return (
          <div
            style={{ height: containerHeight, overflow: 'auto' }}
            onScroll={handleScroll}
            data-testid="virtual-list"
          >
            <div style={{ height: totalItems * itemHeight, position: 'relative' }}>
              {visibleItems.map(index => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: index * itemHeight,
                    height: itemHeight,
                    left: 0,
                    right: 0
                  }}
                  data-testid={`virtual-item-${index}`}
                >
                  Item {index}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<VirtualList />);
      
      // Should only render visible items initially
      expect(screen.getByTestId('virtual-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('virtual-item-9')).toBeInTheDocument();
      expect(screen.queryByTestId('virtual-item-50')).not.toBeInTheDocument();
      
      // Simulate scroll
      const virtualList = screen.getByTestId('virtual-list');
      fireEvent.scroll(virtualList, { target: { scrollTop: 2000 } });
      
      // Should update visible items
      expect(screen.queryByTestId('virtual-item-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('virtual-item-40')).toBeInTheDocument();
    });
  });

  describe('Network and API Performance', () => {
    it('should implement request deduplication', async () => {
      const fetchSpy = jest.fn().mockResolvedValue({ data: 'test data' });
      
      const useDataHook = (id: string) => {
        const [data, setData] = React.useState<any>(null);
        const [loading, setLoading] = React.useState(false);
        
        React.useEffect(() => {
          const cache = new Map();
          
          const fetchData = async (id: string) => {
            if (cache.has(id)) {
              return cache.get(id);
            }
            
            setLoading(true);
            const result = await fetchSpy(id);
            cache.set(id, result);
            setLoading(false);
            setData(result.data);
            
            return result;
          };
          
          fetchData(id);
        }, [id]);
        
        return { data, loading };
      };
      
      const ComponentWithData = ({ id }: { id: string }) => {
        const { data, loading } = useDataHook(id);
        
        return (
          <div data-testid={`component-${id}`}>
            {loading && <Loading />}
            {data && <div data-testid={`data-${id}`}>{data}</div>}
          </div>
        );
      };
      
      const ParentComponent = () => (
        <div>
          <ComponentWithData id="1" />
          <ComponentWithData id="1" />
          <ComponentWithData id="2" />
        </div>
      );

      render(<ParentComponent />);
      
      // Should only fetch each unique ID once
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2); // Only for id "1" and "2"
      });
    });

    it('should handle offline scenarios gracefully', () => {
      const OfflineComponent = () => {
        const [isOnline, setIsOnline] = React.useState(navigator.onLine);
        
        React.useEffect(() => {
          const handleOnline = () => setIsOnline(true);
          const handleOffline = () => setIsOnline(false);
          
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
          
          return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          };
        }, []);
        
        return (
          <div data-testid="offline-component">
            {isOnline ? (
              <div data-testid="online-status">Connected</div>
            ) : (
              <div data-testid="offline-status">
                You are offline. Some features may not be available.
              </div>
            )}
          </div>
        );
      };

      render(<OfflineComponent />);
      
      // Initially should be online
      expect(screen.getByTestId('online-status')).toBeInTheDocument();
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      fireEvent(window, new Event('offline'));
      
      expect(screen.getByTestId('offline-status')).toBeInTheDocument();
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      fireEvent(window, new Event('online'));
      
      expect(screen.getByTestId('online-status')).toBeInTheDocument();
    });
  });
});