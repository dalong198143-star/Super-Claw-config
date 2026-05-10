import { render, screen, fireEvent } from '@testing-library/react'
import CreationHistory from '../components/shared/CreationHistory'

describe('CreationHistory Component', () => {
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
    }))
  }

  test('renders empty state when no history', () => {
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    expect(screen.getByText('📋 创作历史')).toBeInTheDocument()
    expect(screen.getByText('暂无创作记录')).toBeInTheDocument()
  })

  test('loads history from localStorage on mount', () => {
    const mockHistory = createMockHistory(2)
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    // Check that items are rendered
    const badges = screen.getAllByText(/文生图|图生视频/)
    expect(badges.length).toBeGreaterThan(0)
  })

  test('displays history items with correct information', () => {
    const mockHistory = createMockHistory(1)
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    const toolBadges = screen.getAllByText('文生图')
    expect(toolBadges.length).toBeGreaterThan(0)
    
    // Check that history item exists
    const historyItems = screen.getAllByRole('button')
    expect(historyItems.length).toBeGreaterThan(0)
  })

  test('deletes record when clicking delete button', () => {
    const mockHistory = createMockHistory(2)
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    const deleteButtons = screen.getAllByText('✕')
    fireEvent.click(deleteButtons[0])
    
    // Check localStorage was updated
    const updated = JSON.parse(localStorage.getItem('creation_history'))
    expect(updated.length).toBe(1)
  })

  test('filters by tool type', () => {
    const mockHistory = [
      { ...createMockHistory(1)[0], tool: 'text-to-image' },
      { ...createMockHistory(1)[0], id: 2, tool: 'image-to-video' }
    ]
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    // Initially show all
    const initialItems = screen.getAllByText(/文生图|图生视频/)
    expect(initialItems.length).toBeGreaterThanOrEqual(2)
    
    // Filter by text-to-image
    const toolSelect = screen.getByRole('combobox')
    fireEvent.change(toolSelect, { target: { value: 'text-to-image' } })
    
    // Should only show text-to-image items
    const filteredItems = screen.queryAllByText('文生图')
    expect(filteredItems.length).toBeGreaterThan(0)
  })

  test('shows tool badges with Chinese names', () => {
    const mockHistory = [
      { id: 1, tool: 'comic-drama', resultType: 'video', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString() },
      { id: 2, tool: 'anime-video', resultType: 'video', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString() },
      { id: 3, tool: 'text-to-image', resultType: 'image', resultUrl: 'url', prompt: 'Test', timestamp: new Date().toISOString() }
    ]
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    const comicDramaBadges = screen.getAllByText('AI漫剧')
    expect(comicDramaBadges.length).toBeGreaterThan(0)
    
    const animeVideoBadges = screen.getAllByText('动漫视频')
    expect(animeVideoBadges.length).toBeGreaterThan(0)
    
    const textToImageBadges = screen.getAllByText('文生图')
    expect(textToImageBadges.length).toBeGreaterThan(0)
  })

  test('calls onLoadCreation when clicking history item', () => {
    const mockHistory = createMockHistory(1)
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    // Click on the history item (the div with class history-item)
    const historyItem = screen.getAllByRole('button')[0].parentElement
    fireEvent.click(historyItem)
    
    expect(mockOnLoadCreation).toHaveBeenCalledWith(mockHistory[0])
  })

  test('formats timestamp correctly', () => {
    const mockHistory = [{
      id: 1,
      tool: 'text-to-image',
      resultType: 'image',
      resultUrl: 'url',
      prompt: 'Test',
      timestamp: new Date('2026-05-09T10:30:00').toISOString(),
    }]
    localStorage.setItem('creation_history', JSON.stringify(mockHistory))
    
    render(<CreationHistory onLoadCreation={mockOnLoadCreation} />)
    
    // The component formats time as "M/D HH:mm"
    expect(screen.getByText(/5\/9/)).toBeInTheDocument()
  })
})
