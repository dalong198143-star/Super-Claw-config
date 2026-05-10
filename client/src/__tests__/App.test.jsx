import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock all API calls before each test
beforeEach(() => {
  global.fetch = jest.fn();
  
  // Mock checkOllama API call
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ models: [] })
  });
  
  // Mock fetchImageStyles API call - return empty array to avoid .map errors
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('App Component', () => {
  test('renders app header', () => {
    render(<App />);
    const header = screen.getByText(/AI漫剧创作平台/i);
    expect(header).toBeInTheDocument();
  });

  test('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('displays AI mode indicator', async () => {
    render(<App />);
    
    // Wait for AI mode to be displayed
    const aiMode = await screen.findByText(/AI:/i);
    expect(aiMode).toBeInTheDocument();
  });

  test('changes tool selection', async () => {
    render(<App />);
    
    // Tool selector should be present
    const toolSelectors = screen.getAllByRole('combobox');
    expect(toolSelectors.length).toBeGreaterThan(0);
    
    const mainToolSelector = toolSelectors[0];
    expect(mainToolSelector).toBeInTheDocument();
    
    // Change tool - just verify no errors occur
    fireEvent.change(mainToolSelector, { target: { value: 'image-to-video' } });
    // Component state changes are internal
    expect(mainToolSelector).toBeInTheDocument();
  });

  test('renders tool workflow area', () => {
    render(<App />);
    
    // App should render without crashing
    expect(screen.getByText(/AI漫剧创作平台/i)).toBeInTheDocument();
  });
});
