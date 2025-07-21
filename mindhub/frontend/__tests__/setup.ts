import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock touch events for tablet testing
let mockTouchPoints = 0;
let mockTouchStart: any = undefined;

Object.defineProperty(window, 'ontouchstart', {
  writable: true,
  configurable: true,
  value: undefined,
});

// Mock navigator.maxTouchPoints using getter/setter
Object.defineProperty(navigator, 'maxTouchPoints', {
  get: () => mockTouchPoints,
  configurable: true,
});

// Helper to mock tablet device
export const mockTabletDevice = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  // Update mock values
  mockTouchPoints = 5;
  mockTouchStart = {};
  
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: mockTouchStart,
  });
};

// Helper to mock desktop device
export const mockDesktopDevice = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1280,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 720,
  });
  
  // Update mock values
  mockTouchPoints = 0;
  mockTouchStart = undefined;
  
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: mockTouchStart,
  });
};