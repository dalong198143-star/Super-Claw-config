import { render, screen, fireEvent } from '@testing-library/react';
import SubmitForm from '../../components/shared/SubmitForm';

describe('SubmitForm Component', () => {
  const mockTask = { id: 1, title: 'Test Task', description: 'Test description' };

  test('renders submit form when task is provided', () => {
    render(<SubmitForm task={mockTask} onSubmit={() => {}} submitSuccess={false} />);
    expect(screen.getByText('📝 提交任务')).toBeInTheDocument();
  });

  test('renders form fields', () => {
    render(<SubmitForm task={mockTask} onSubmit={() => {}} submitSuccess={false} />);
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBe(2);
    expect(screen.getByRole('button', { name: '提交任务' })).toBeInTheDocument();
  });

  test('pre-fills task title', () => {
    const { container } = render(<SubmitForm task={mockTask} onSubmit={() => {}} submitSuccess={false} />);
    const titleInput = container.querySelector('input[name="title"]');
    expect(titleInput.value).toBe('Test Task');
  });

  test('calls onSubmit when form is submitted', () => {
    const mockOnSubmit = jest.fn(e => e.preventDefault());
    render(<SubmitForm task={mockTask} onSubmit={mockOnSubmit} submitSuccess={false} />);
    const submitBtn = screen.getByText('提交任务');
    fireEvent.click(submitBtn);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test('renders success message when submitSuccess is true', () => {
    render(<SubmitForm task={mockTask} onSubmit={() => {}} submitSuccess={true} />);
    expect(screen.getByText('提交成功！')).toBeInTheDocument();
  });

  test('does not render form when submitSuccess is true', () => {
    render(<SubmitForm task={mockTask} onSubmit={() => {}} submitSuccess={true} />);
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  test('does not render when task is null', () => {
    const { container } = render(<SubmitForm task={null} onSubmit={() => {}} submitSuccess={false} />);
    expect(container.firstChild).toBeNull();
  });
});