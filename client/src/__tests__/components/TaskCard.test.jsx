import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../components/shared/TaskCard';

describe('TaskCard Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'This is a test task description',
    difficulty: 2,
    reward: 50
  };

  test('renders task information correctly', () => {
    render(<TaskCard task={mockTask} onSelect={() => {}} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('2星')).toBeInTheDocument();
    expect(screen.getByText('50元')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    const mockOnSelect = jest.fn();
    render(<TaskCard task={mockTask} onSelect={mockOnSelect} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockTask);
  });

  test('renders start button', () => {
    render(<TaskCard task={mockTask} onSelect={() => {}} />);
    
    const startBtn = screen.getByText('开始任务');
    expect(startBtn).toBeInTheDocument();
  });
});