import { render, screen } from '@testing-library/react';
import Header from '../../components/shared/Header';

describe('Header Component', () => {
  const mockUser = { id: 1, name: 'Test User', balance: 200 };

  test('renders app title', () => {
    render(<Header user={null} aiMode="cloud" />);
    expect(screen.getByText('学习变现平台')).toBeInTheDocument();
  });

  test('renders version', () => {
    render(<Header user={null} aiMode="cloud" />);
    expect(screen.getByText('v1.9.3')).toBeInTheDocument();
  });

  test('renders AI mode indicator', () => {
    render(<Header user={null} aiMode="cloud" />);
    expect(screen.getByText('AI: 云端')).toBeInTheDocument();
  });

  test('renders different AI modes correctly', () => {
    const { container } = render(<Header user={null} aiMode="local" />);
    const aiModeElement = container.querySelector('.ai-mode');
    expect(aiModeElement.textContent).toContain('本地Ollama');
  });

  test('renders checking mode', () => {
    render(<Header user={null} aiMode="checking" />);
    expect(screen.getByText('AI: 检测中')).toBeInTheDocument();
  });

  test('renders user balance when user is provided', () => {
    render(<Header user={mockUser} aiMode="cloud" />);
    expect(screen.getByText('余额: 200 元')).toBeInTheDocument();
  });

  test('does not render balance when user is null', () => {
    render(<Header user={null} aiMode="cloud" />);
    expect(screen.queryByText('余额')).not.toBeInTheDocument();
  });

  test('applies correct class based on aiMode', () => {
    const { container } = render(<Header user={null} aiMode="local" />);
    const aiModeElement = container.querySelector('.ai-mode.local');
    expect(aiModeElement).toBeInTheDocument();
  });
});