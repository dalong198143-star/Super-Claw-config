import { render, screen, fireEvent } from '@testing-library/react';
import ToolSelector from '../../components/shared/ToolSelector';

describe('ToolSelector Component', () => {
  test('renders all 8 tools', () => {
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={() => {}} />);
    
    const tools = screen.getAllByRole('button');
    expect(tools).toHaveLength(8);
  });

  test('renders correct tool names', () => {
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={() => {}} />);
    
    expect(screen.getByText('文生图')).toBeInTheDocument();
    expect(screen.getByText('图生视频')).toBeInTheDocument();
    expect(screen.getByText('图生图')).toBeInTheDocument();
    expect(screen.getByText('视频生图')).toBeInTheDocument();
    expect(screen.getByText('动作迁移')).toBeInTheDocument();
    expect(screen.getByText('换装')).toBeInTheDocument();
    expect(screen.getByText('重绘洗图')).toBeInTheDocument();
    expect(screen.getByText('视频拼接')).toBeInTheDocument();
  });

  test('calls onSelectTool when a tool is clicked', () => {
    const mockOnSelect = jest.fn();
    render(<ToolSelector selectedTool="text-to-image" onSelectTool={mockOnSelect} />);
    
    const motionTransferBtn = screen.getByText('动作迁移');
    fireEvent.click(motionTransferBtn);
    
    expect(mockOnSelect).toHaveBeenCalledWith('motion-transfer');
  });

  test('applies selected class to selected tool', () => {
    const { container } = render(<ToolSelector selectedTool="outfit" onSelectTool={() => {}} />);
    
    const outfitBtn = container.querySelector('.tool-card.selected');
    expect(outfitBtn).toBeInTheDocument();
    expect(outfitBtn.textContent).toContain('换装');
  });
});