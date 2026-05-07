import { render, screen, fireEvent } from '@testing-library/react';
import AIAssistant from '../../components/shared/AIAssistant';

describe('AIAssistant Component', () => {
  const mockProps = {
    aiProvider: 'ollama',
    availableModels: ['model1', 'model2'],
    selectedModel: 'model1',
    onModelChange: jest.fn(),
    aiResponse: '这是AI的回答',
    loading: false,
    onAskAI: jest.fn(),
    onCopyResponse: jest.fn(),
    onOptimizePrompt: jest.fn(),
    onFillPrompt: jest.fn()
  };

  test('renders AI assistant header', () => {
    render(<AIAssistant {...mockProps} />);
    expect(screen.getByText('AI 小助手')).toBeInTheDocument();
  });

  test('renders model selector when models are available', () => {
    render(<AIAssistant {...mockProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('model1')).toBeInTheDocument();
    expect(screen.getByText('model2')).toBeInTheDocument();
  });

  test('calls onModelChange when model is changed', () => {
    render(<AIAssistant {...mockProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'model2' } });
    expect(mockProps.onModelChange).toHaveBeenCalledWith('model2');
  });

  test('renders AI response', () => {
    render(<AIAssistant {...mockProps} />);
    expect(screen.getByText('这是AI的回答')).toBeInTheDocument();
  });

  test('renders AI thinking message when loading', () => {
    render(<AIAssistant {...mockProps} loading={true} aiResponse="" />);
    expect(screen.getByText('AI 正在思考...')).toBeInTheDocument();
  });

  test('renders action buttons when there is a response', () => {
    render(<AIAssistant {...mockProps} />);
    expect(screen.getByText('一键复制')).toBeInTheDocument();
    expect(screen.getByText('提取并优化提示词')).toBeInTheDocument();
    expect(screen.getByText('直接填充')).toBeInTheDocument();
  });

  test('calls onAskAI when button is clicked', () => {
    const propsWithEmptyResponse = { ...mockProps, aiResponse: '' };
    const { container } = render(<AIAssistant {...propsWithEmptyResponse} />);
    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'test question' } });
    const button = screen.getByText('问AI');
    fireEvent.click(button);
    expect(mockProps.onAskAI).toHaveBeenCalledWith('test question');
  });

  test('does not show action buttons when there is no response', () => {
    render(<AIAssistant {...mockProps} aiResponse="" />);
    expect(screen.queryByText('一键复制')).not.toBeInTheDocument();
  });
});