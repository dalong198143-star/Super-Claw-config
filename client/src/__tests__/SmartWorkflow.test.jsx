import { render, screen, fireEvent, act } from '@testing-library/react'
import SmartWorkflow from '../components/workflow/SmartWorkflow'
import useWorkflowStore, { WORKFLOW_MODES } from '../store/workflowStore'

// Mock alert to prevent popup during tests
window.alert = jest.fn()

describe('SmartWorkflow Component', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWorkflowStore.setState({
      currentMode: WORKFLOW_MODES.SMART,
      smartWorkflow: {
        requirement: '',
        recommendations: [],
        analyzing: false
      }
    })
    window.alert.mockClear()
  })

  test('renders requirement input section', () => {
    render(<SmartWorkflow />)
    
    expect(screen.getByText(/描述您的创作需求/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)).toBeInTheDocument()
  })

  test('displays AI analysis button', () => {
    render(<SmartWorkflow />)
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    expect(analyzeButton).toBeInTheDocument()
  })

  test('AI analysis button is disabled when input is empty', () => {
    render(<SmartWorkflow />)
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    expect(analyzeButton).toBeDisabled()
  })

  test('AI analysis button is enabled when input has text', () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '我想制作视频' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    expect(analyzeButton).not.toBeDisabled()
  })

  test('updates requirement when typing', () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '测试需求' } })
    
    expect(useWorkflowStore.getState().smartWorkflow.requirement).toBe('测试需求')
  })

  test('shows empty state initially', () => {
    render(<SmartWorkflow />)
    
    expect(screen.getByText(/输入您的需求，点击"AI分析"获取推荐方案/)).toBeInTheDocument()
  })

  test('analyzes requirement and shows recommendations', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      // Wait for the setTimeout in the component
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('产品展示视频')).toBeInTheDocument()
  })

  test('shows analyzing state', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    fireEvent.click(analyzeButton)
    
    expect(screen.getByText(/🤖 AI分析中.../)).toBeInTheDocument()
    expect(useWorkflowStore.getState().smartWorkflow.analyzing).toBe(true)
  })

  test('matches product-related keywords', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '商品展示' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('产品展示视频')).toBeInTheDocument()
  })

  test('matches outfit-related keywords', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '换装衣服' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('人物换装秀')).toBeInTheDocument()
  })

  test('matches motion-related keywords', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '动作模仿舞蹈' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('动作模仿视频')).toBeInTheDocument()
  })

  test('matches upscale-related keywords', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '高清清晰修复放大' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('高清修复流程')).toBeInTheDocument()
  })

  test('matches video-related keywords', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '视频剪辑拼接' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    // Use getAllByText since there might be multiple matches
    const videoTemplates = screen.getAllByText('视频剪辑拼接')
    expect(videoTemplates.length).toBeGreaterThanOrEqual(1)
  })

  test('shows all templates when no keywords match', async () => {
    render(<SmartWorkflow />)
    
    const input = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/i)
    const button = screen.getByRole('button', { name: /AI分析/i })
    
    fireEvent.change(input, { target: { value: '随便写点东西' } })
    
    await act(async () => {
      fireEvent.click(button)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    // Should show all 6 templates (新增了一个模板)
    expect(screen.getAllByRole('button', { name: /应用此方案/ })).toHaveLength(6)
  })

  test('displays template cards with correct information', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('📦')).toBeInTheDocument()
    expect(screen.getByText('从产品图片生成动态展示视频')).toBeInTheDocument()
  })

  test('displays workflow steps in recommendation card', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('上传产品图')).toBeInTheDocument()
    expect(screen.getByText('重绘优化')).toBeInTheDocument()
    expect(screen.getByText('图生视频')).toBeInTheDocument()
    expect(screen.getByText('导出成品')).toBeInTheDocument()
  })

  test('applies workflow when clicking apply button', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    const applyButton = screen.getByRole('button', { name: /应用此方案/ })
    fireEvent.click(applyButton)
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('产品展示视频'))
  })

  test('shows arrow between workflow steps', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    const arrows = screen.getAllByText('→')
    expect(arrows.length).toBeGreaterThan(0)
  })

  test('recommendation cards have correct styling', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    const card = document.querySelector('.recommendation-card')
    expect(card).toHaveStyle('--template-color: #667eea')
  })

  test('handles multiple keyword matches', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '产品视频高清' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    // Should match both product and upscale templates
    const cards = document.querySelectorAll('.recommendation-card')
    expect(cards.length).toBeGreaterThanOrEqual(2)
  })

  test('textarea has correct attributes', () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    expect(textarea).toHaveAttribute('rows', '4')
    expect(textarea).toHaveClass('requirement-input')
  })

  test('section hint is displayed', () => {
    render(<SmartWorkflow />)
    
    expect(screen.getByText(/告诉AI您想创作什么/)).toBeInTheDocument()
  })

  test('recommends correct template for clothing keyword', async () => {
    render(<SmartWorkflow />)
    
    const textarea = screen.getByPlaceholderText(/例如：我想制作一个产品展示视频/)
    fireEvent.change(textarea, { target: { value: '服装' } })
    
    const analyzeButton = screen.getByRole('button', { name: /🤖 AI分析/ })
    
    await act(async () => {
      fireEvent.click(analyzeButton)
      await new Promise(resolve => setTimeout(resolve, 1100))
    })
    
    expect(screen.getByText('人物换装秀')).toBeInTheDocument()
    expect(screen.getByText('为人物照片更换不同服装')).toBeInTheDocument()
  })
})
