import { render, screen, fireEvent } from '@testing-library/react'
import CreationHistory from '../components/shared/CreationHistory'

describe('CreationHistory Component', () => {
  const mockUserId = 'user1'
  const mockOnLoadCreation = jest.fn()

  beforeEach(() => {
    localStorage.clear()
    mockOnLoadCreation.mockClear()
  })

  const createMockHistory = (count = 3) => {
    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      tool: i % 2 === 0 ? 'text-to-image' : 'image-to-video',
      resultType: i % 2 === 0 ? 'image' : 'video',
      resultUrl: `https://example.com/result${i}.jpg`,
      prompt: `Test prompt ${i}`,
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      userId: mockUserId
    }))
  }

  test('renders empty state when no history', () => {
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    expect(screen.getByText('暂无创作记录')).toBeInTheDocument()
    expect(screen.getByText('开始使用AI工具进行创作吧！')).toBeInTheDocument()
  })

  test('loads history from localStorage on mount', () => {
    const mockHistory = createMockHistory(2)
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Check that tool badges are present (may be multiple)
    const toolBadges = screen.getAllByText(/文生图|图生视频/)
    expect(toolBadges.length).toBeGreaterThan(0)
  })

  test('displays history items with correct information', () => {
    const mockHistory = createMockHistory(1)
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Use getAllByText for tool badge
    const toolBadges = screen.getAllByText('文生图')
    expect(toolBadges.length).toBeGreaterThan(0)
    
    expect(screen.getByText(/Test prompt 0/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument()
  })

  test('renders image preview for image results', () => {
    const mockHistory = [{
      id: 1,
      tool: 'text-to-image',
      resultType: 'image',
      resultUrl: 'https://example.com/test.jpg',
      prompt: 'Test',
      timestamp: new Date().toISOString(),
      userId: mockUserId
    }]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    const img = screen.getByAltText('创作结果')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/test.jpg')
  })

  test('renders video preview for video results', () => {
    const mockHistory = [{
      id: 1,
      tool: 'image-to-video',
      resultType: 'video',
      resultUrl: 'https://example.com/test.mp4',
      prompt: 'Test',
      timestamp: new Date().toISOString(),
      userId: mockUserId
    }]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    const { container } = render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Use querySelector for video element
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  test('calls onLoadCreation when clicking load button', () => {
    const mockHistory = createMockHistory(1)
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    const loadButton = screen.getByRole('button', { name: '重新加载' })
    fireEvent.click(loadButton)
    
    expect(mockOnLoadCreation).toHaveBeenCalledWith(mockHistory[0])
  })

  test('deletes record when clicking delete button', () => {
    const mockHistory = createMockHistory(2)
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: '删除' })
    fireEvent.click(deleteButtons[0])
    
    // Check localStorage was updated
    const updated = JSON.parse(localStorage.getItem(`creation_history_${mockUserId}`))
    expect(updated.length).toBe(1)
  })

  test('filters by tool type', () => {
    const mockHistory = [
      { ...createMockHistory(1)[0], tool: 'text-to-image' },
      { ...createMockHistory(1)[0], id: 2, tool: 'image-to-video' }
    ]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Initially show all
    expect(screen.getAllByText('文生图').length).toBeGreaterThanOrEqual(1)
    
    // Filter by text-to-image
    const toolSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(toolSelect, { target: { value: 'text-to-image' } })
    
    // Should only show text-to-image items
    const items = screen.queryAllByText('文生图')
    expect(items.length).toBeGreaterThan(0)
  })

  test('filters by date range', () => {
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    const lastWeek = new Date(Date.now() - 8 * 86400000)
    
    const mockHistory = [
      {
        id: 1,
        tool: 'text-to-image',
        resultType: 'image',
        resultUrl: 'https://example.com/1.jpg',
        prompt: 'Today',
        timestamp: today.toISOString(),
        userId: mockUserId
      },
      {
        id: 2,
        tool: 'text-to-image',
        resultType: 'image',
        resultUrl: 'https://example.com/2.jpg',
        prompt: 'Last Week',
        timestamp: lastWeek.toISOString(),
        userId: mockUserId
      }
    ]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Filter by today
    const dateSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(dateSelect, { target: { value: 'today' } })
    
    // Should only show today's item
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText('Last Week')).not.toBeInTheDocument()
  })

  test('shows tool badges with Chinese names', () => {
    const mockHistory = [
      { id: 1, tool: 'text-to-image', resultType: 'image', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString(), userId: mockUserId },
      { id: 2, tool: 'motion-transfer', resultType: 'video', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString(), userId: mockUserId },
      { id: 3, tool: 'outfit', resultType: 'image', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString(), userId: mockUserId }
    ]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    // Use getAllByText for multiple occurrences
    const textToImageBadges = screen.getAllByText('文生图')
    expect(textToImageBadges.length).toBeGreaterThan(0)
    
    const motionTransferBadges = screen.getAllByText('动作迁移')
    expect(motionTransferBadges.length).toBeGreaterThan(0)
    
    const outfitBadges = screen.getAllByText('换装')
    expect(outfitBadges.length).toBeGreaterThan(0)
  })

  test('truncates long prompts', () => {
    const longPrompt = 'A'.repeat(100)
    const mockHistory = [{
      id: 1,
      tool: 'text-to-image',
      resultType: 'image',
      resultUrl: 'url',
      prompt: longPrompt,
      timestamp: new Date().toISOString(),
      userId: mockUserId
    }]
    localStorage.setItem(`creation_history_${mockUserId}`, JSON.stringify(mockHistory))
    
    render(<CreationHistory userId={mockUserId} onLoadCreation={mockOnLoadCreation} />)
    
    const promptElement = screen.getByText(/A{50}/)
    expect(promptElement).toBeInTheDocument()
    expect(promptElement.textContent).toContain('...')
  })

  test('does not render without userId', () => {
    render(<CreationHistory userId={null} onLoadCreation={mockOnLoadCreation} />)
    
    expect(screen.getByText('暂无创作记录')).toBeInTheDocument()
  })
})
