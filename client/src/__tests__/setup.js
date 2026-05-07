import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock window.matchMedia for tests
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

// Mock import.meta.env for Jest environment
if (typeof global.importMetaEnv === 'undefined') {
  Object.defineProperty(global, 'importMetaEnv', {
    value: {
      VITE_API_URL: 'http://localhost:3001',
      VITE_OLLAMA_URL: 'http://localhost:11434'
    },
    writable: false
  });
}

// Mock fetch globally for tests
global.fetch = jest.fn();

// Helper to mock fetch responses
global.mockFetchResponse = (data, options = {}) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    ...options
  });
};

global.mockFetchError = (errorMessage) => {
  global.fetch.mockRejectedValueOnce(new Error(errorMessage));
};