import { render, screen } from '@testing-library/react';
import UserProfile from '../../components/shared/UserProfile';

describe('UserProfile Component', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    balance: 100
  };

  test('renders user profile when user is provided', () => {
    render(<UserProfile user={mockUser} />);
    
    const userName = screen.getByText('Test User');
    const userBalance = screen.getByText('余额: 100 元');
    
    expect(userName).toBeInTheDocument();
    expect(userBalance).toBeInTheDocument();
  });

  test('renders default user name when name is not provided', () => {
    const userWithoutName = { id: 1, balance: 50 };
    render(<UserProfile user={userWithoutName} />);
    
    const userName = screen.getByText('用户');
    expect(userName).toBeInTheDocument();
  });

  test('does not render when user is null', () => {
    const { container } = render(<UserProfile user={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('does not render when user is undefined', () => {
    const { container } = render(<UserProfile user={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});