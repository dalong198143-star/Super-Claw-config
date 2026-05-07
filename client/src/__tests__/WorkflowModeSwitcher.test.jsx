import { render, screen, fireEvent } from '@testing-library/react'
import WorkflowModeSwitcher from '../components/workflow/WorkflowModeSwitcher'
import useWorkflowStore, { WORKFLOW_MODES } from '../store/workflowStore'

describe('WorkflowModeSwitcher Component', () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      currentMode: WORKFLOW_MODES.LINEAR
    })
  })

  test('renders all three mode buttons', () => {
    render(<WorkflowModeSwitcher />)

    expect(screen.getByText('新手引导')).toBeInTheDocument()
    expect(screen.getByText('专家自由')).toBeInTheDocument()
    expect(screen.getByText('智能推荐')).toBeInTheDocument()
  })

  test('displays mode icons', () => {
    render(<WorkflowModeSwitcher />)

    expect(screen.getByText('📚')).toBeInTheDocument()
    expect(screen.getByText('🎨')).toBeInTheDocument()
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  test('highlights current active mode', () => {
    render(<WorkflowModeSwitcher />)

    const linearButton = screen.getByText('新手引导').closest('button')
    expect(linearButton).toHaveClass('active')

    const canvasButton = screen.getByText('专家自由').closest('button')
    expect(canvasButton).not.toHaveClass('active')
  })

  test('switches mode when clicking a button', () => {
    render(<WorkflowModeSwitcher />)

    const canvasButton = screen.getByText('专家自由')
    fireEvent.click(canvasButton)

    expect(useWorkflowStore.getState().currentMode).toBe(WORKFLOW_MODES.CANVAS)

    expect(screen.getByText('专家自由').closest('button')).toHaveClass('active')
  })

  test('displays description for current mode', () => {
    render(<WorkflowModeSwitcher />)

    expect(screen.getByText('4步流程指引')).toBeInTheDocument()

    fireEvent.click(screen.getByText('专家自由'))
    expect(screen.getByText('拖拽节点到画布')).toBeInTheDocument()

    fireEvent.click(screen.getByText('智能推荐'))
    expect(screen.getByText('AI分析推荐工作流')).toBeInTheDocument()
  })

  test('applies correct color theme to active button', () => {
    render(<WorkflowModeSwitcher />)

    const linearButton = screen.getByText('新手引导').closest('button')
    expect(linearButton).toHaveStyle('--mode-color: #667eea')

    fireEvent.click(screen.getByText('专家自由'))
    const canvasButton = screen.getByText('专家自由').closest('button')
    expect(canvasButton).toHaveStyle('--mode-color: #ed64a6')
  })

  test('mode indicator appears in header', () => {
    render(<WorkflowModeSwitcher />)

    const indicators = document.querySelectorAll('.mode-indicator')
    expect(indicators).toHaveLength(1)
  })

  test('preserves mode selection after re-render', () => {
    const { rerender } = render(<WorkflowModeSwitcher />)

    fireEvent.click(screen.getByText('智能推荐'))
    expect(useWorkflowStore.getState().currentMode).toBe(WORKFLOW_MODES.SMART)

    rerender(<WorkflowModeSwitcher />)

    expect(screen.getByText('智能推荐').closest('button')).toHaveClass('active')
  })
})