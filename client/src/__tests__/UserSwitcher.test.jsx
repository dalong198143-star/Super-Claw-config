import { render, screen, fireEvent } from '@testing-library/react'
import UserSwitcher from '../components/shared/UserSwitcher'
import INTERNAL_USERS from '../config/internalUsers'

describe('UserSwitcher Component', () => {
  const mockUser = INTERNAL_USERS[0]
  const mockOnUserChange = jest.fn()

  beforeEach(() => {
    mockOnUserChange.mockClear()
    localStorage.clear()
  })

  test('renders current user info', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    expect(screen.getByText(mockUser.avatar)).toBeInTheDocument()
  })

  test('shows dropdown when clicked', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('选择用户')).toBeInTheDocument()
  })

  test('displays all available users in dropdown', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    INTERNAL_USERS.forEach(user => {
      // Use getAllByText to handle multiple occurrences
      const nameElements = screen.getAllByText(user.name)
      expect(nameElements.length).toBeGreaterThan(0)
      
      const roleElements = screen.getAllByText(user.role)
      expect(roleElements.length).toBeGreaterThan(0)
    })
  })

  test('highlights current active user', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    // Current user should have check mark
    const activeButtons = screen.getAllByRole('button')
    const currentUserButton = activeButtons.find(btn => 
      btn.classList.contains('active')
    )
    expect(currentUserButton).toBeInTheDocument()
    expect(currentUserButton).toHaveTextContent('✓')
  })

  test('calls onUserChange when selecting a different user', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    // Click on second user
    const secondUser = INTERNAL_USERS[1]
    const userButtons = screen.getAllByRole('button')
    const targetButton = userButtons.find(btn => 
      btn.textContent.includes(secondUser.name)
    )
    fireEvent.click(targetButton)
    
    expect(mockOnUserChange).toHaveBeenCalledWith(secondUser)
  })

  test('saves selected user to localStorage', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    const secondUser = INTERNAL_USERS[1]
    const userButtons = screen.getAllByRole('button')
    const targetButton = userButtons.find(btn => 
      btn.textContent.includes(secondUser.name)
    )
    fireEvent.click(targetButton)
    
    const savedUser = JSON.parse(localStorage.getItem('currentUser'))
    expect(savedUser).toEqual(secondUser)
  })

  test('closes dropdown after selecting a user', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('选择用户')).toBeInTheDocument()
    
    const secondUser = INTERNAL_USERS[1]
    const userButtons = screen.getAllByRole('button')
    const targetButton = userButtons.find(btn => 
      btn.textContent.includes(secondUser.name)
    )
    fireEvent.click(targetButton)
    
    // Dropdown should be closed
    expect(screen.queryByText('选择用户')).not.toBeInTheDocument()
  })

  test('toggles dropdown open/close on button click', () => {
    render(<UserSwitcher currentUser={mockUser} onUserChange={mockOnUserChange} />)
    
    const toggleButton = screen.getByTitle('切换用户')
    
    // Initially closed
    expect(screen.queryByText('选择用户')).not.toBeInTheDocument()
    
    // Open
    fireEvent.click(toggleButton)
    expect(screen.getByText('选择用户')).toBeInTheDocument()
    
    // Close
    fireEvent.click(toggleButton)
    expect(screen.queryByText('选择用户')).not.toBeInTheDocument()
  })
})
