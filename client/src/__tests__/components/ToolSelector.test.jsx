import { render, screen, fireEvent } from '@testing-library/react';
import ToolSelector from '../../components/shared/ToolSelector';

describe('ToolSelector Component', () => {
  test('renders all 5 tools', () => {
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={() => {}} />);

    const tools = screen.getAllByRole('button');
    expect(tools).toHaveLength(5);
  });

  test('renders correct tool names', () => {
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={() => {}} />);
    
    expect(screen.getByText('AI漫剧')).toBeInTheDocument();
    expect(screen.getByText('动漫视频')).toBeInTheDocument();
    expect(screen.getByText('文生图')).toBeInTheDocument();
    expect(screen.getByText('图生视频')).toBeInTheDocument();
    expect(screen.getByText('首页')).toBeInTheDocument();
  });

  test('calls onSelectTool when a tool is clicked', () => {
    const mockOnSelect = jest.fn();
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={mockOnSelect} />);
    
    const comicDramaBtn = screen.getByText('AI漫剧');
    fireEvent.click(comicDramaBtn);
    
    expect(mockOnSelect).toHaveBeenCalledWith('comic-drama');
  });

  test('applies selected class to selected tool', () => {
    const { container } = render(<ToolSelector selectedTool="anime-video" onSelectTool={() => {}} />);
    
    const animeVideoBtn = container.querySelector('.tool-card.selected');
    expect(animeVideoBtn).toBeInTheDocument();
    expect(animeVideoBtn.textContent).toContain('动漫视频');
  });
});