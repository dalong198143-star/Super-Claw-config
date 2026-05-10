import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../../components/shared/Header';

describe('Header Component', () => {
  test('renders app title', () => {
    render(<Header aiProvider="cloud" />);
    expect(screen.getByText('AI漫剧创作平台')).toBeInTheDocument();
  });

  test('renders version', () => {
    render(<Header aiProvider="cloud" />);
    expect(screen.getByText('v2.8.0')).toBeInTheDocument();
  });

  test('renders cloud AI mode', () => {
    render(<Header aiProvider="cloud" />);
    expect(screen.getByText('AI: 云端')).toBeInTheDocument();
  });

  test('renders deepseek AI mode', () => {
    render(<Header aiProvider="deepseek" />);
    expect(screen.getByText('AI: DeepSeek')).toBeInTheDocument();
  });

  test('renders ollama AI mode', () => {
    render(<Header aiProvider="ollama" />);
    expect(screen.getByText('AI: Ollama')).toBeInTheDocument();
  });

  test('renders checking mode', () => {
    render(<Header aiProvider="checking" />);
    expect(screen.getByText('AI: 检测中')).toBeInTheDocument();
  });

  test('applies correct class based on aiProvider', () => {
    const { container } = render(<Header aiProvider="ollama" />);
    const aiModeElement = container.querySelector('.ai-mode.ollama');
    expect(aiModeElement).toBeInTheDocument();
  });

  test('toggles theme when clicking theme button', () => {
    render(<Header aiProvider="cloud" />);
    const themeButton = screen.getByTitle(/浅色|深色/);
    
    // Initial state should be light (moon icon)
    expect(themeButton).toHaveTextContent('🌙');
    
    // Click to toggle to dark
    fireEvent.click(themeButton);
    expect(themeButton).toHaveTextContent('☀️');
  });
});