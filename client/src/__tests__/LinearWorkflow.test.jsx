import { render, screen, fireEvent } from '@testing-library/react'
import LinearWorkflow from '../components/workflow/LinearWorkflow'
import useWorkflowStore, { WORKFLOW_MODES } from '../store/workflowStore'

describe('LinearWorkflow Component', () => {
  const mockToolComponent = <div data-testid="mock-tool">Mock Tool</div>
  
  beforeEach(() => {
    // Reset store to initial state
    useWorkflowStore.setState({
      currentMode: WORKFLOW_MODES.LINEAR,
      linearWorkflow: {
        currentStep: 1,
        totalSteps: 4,
        completedSteps: [],
        stepData: {}
      }
    })
  })

  test('renders workflow with steps', () => {
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    expect(screen.getByText('步骤 1: 输入提示词')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
  })

  test('displays correct steps for different tools', () => {
    const { rerender } = render(
      <LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />
    )
    
    expect(screen.getByText('输入提示词')).toBeInTheDocument()
    
    rerender(<LinearWorkflow selectedTool="image-to-video" toolComponent={mockToolComponent} />)
    expect(screen.getByText('上传图片')).toBeInTheDocument()
    
    rerender(<LinearWorkflow selectedTool="motion-transfer" toolComponent={mockToolComponent} />)
    expect(screen.getByText('上传人物图')).toBeInTheDocument()
  })

  test('renders tool component in step body', () => {
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    expect(screen.getByTestId('mock-tool')).toBeInTheDocument()
  })

  test('next button is disabled on last step', () => {
    useWorkflowStore.setState({
      linearWorkflow: {
        currentStep: 4,
        totalSteps: 4,
        completedSteps: [1, 2, 3],
        stepData: {}
      }
    })
    
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const nextButton = screen.getByRole('button', { name: /✓ 完成/ })
    expect(nextButton).toBeDisabled()
  })

  test('prev button is disabled on first step', () => {
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const prevButton = screen.getByRole('button', { name: /← 上一步/ })
    expect(prevButton).toBeDisabled()
  })

  test('next button advances to next step', () => {
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const nextButton = screen.getByRole('button', { name: /下一步/ })
    fireEvent.click(nextButton)
    
    expect(useWorkflowStore.getState().linearWorkflow.currentStep).toBe(2)
    expect(screen.getByText('步骤 2: 选择风格')).toBeInTheDocument()
  })

  test('prev button goes back to previous step', () => {
    useWorkflowStore.setState({
      linearWorkflow: {
        currentStep: 3,
        totalSteps: 4,
        completedSteps: [1, 2],
        stepData: {}
      }
    })
    
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const prevButton = screen.getByRole('button', { name: /← 上一步/ })
    fireEvent.click(prevButton)
    
    expect(useWorkflowStore.getState().linearWorkflow.currentStep).toBe(2)
    expect(screen.getByText('步骤 2: 选择风格')).toBeInTheDocument()
  })

  test('reset button resets workflow', () => {
    useWorkflowStore.setState({
      linearWorkflow: {
        currentStep: 3,
        totalSteps: 4,
        completedSteps: [1, 2],
        stepData: { step1: 'data' }
      }
    })
    
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const resetButton = screen.getByRole('button', { name: /🔄 重新开始/ })
    fireEvent.click(resetButton)
    
    const state = useWorkflowStore.getState().linearWorkflow
    expect(state.currentStep).toBe(1)
    expect(state.completedSteps).toEqual([])
    expect(state.stepData).toEqual({})
  })

  test('shows completion message on last step', () => {
    useWorkflowStore.setState({
      linearWorkflow: {
        currentStep: 4,
        totalSteps: 4,
        completedSteps: [1, 2, 3],
        stepData: {}
      }
    })
    
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    expect(screen.getByText('步骤 4: 生成图片')).toBeInTheDocument()
    expect(screen.getByText('✓ 完成')).toBeInTheDocument()
  })

  test('updates progress indicator', () => {
    const { rerender } = render(
      <LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />
    )
    
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
    
    useWorkflowStore.getState().nextStep()
    rerender(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
  })

  test('uses default steps for unknown tool', () => {
    render(<LinearWorkflow selectedTool="unknown-tool" toolComponent={mockToolComponent} />)
    
    expect(screen.getByText('输入提示词')).toBeInTheDocument()
  })

  test('StepIndicator receives correct props', () => {
    useWorkflowStore.setState({
      linearWorkflow: {
        currentStep: 2,
        totalSteps: 4,
        completedSteps: [1],
        stepData: {}
      }
    })
    
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    // Check that StepIndicator renders with correct state
    expect(screen.getByText('步骤 2: 选择风格')).toBeInTheDocument()
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks).toHaveLength(1)
  })

  test('workflow buttons have correct styling classes', () => {
    render(<LinearWorkflow selectedTool="text-to-image" toolComponent={mockToolComponent} />)
    
    const prevButton = screen.getByRole('button', { name: /← 上一步/ })
    expect(prevButton).toHaveClass('btn-prev')
    
    const resetButton = screen.getByRole('button', { name: /🔄 重新开始/ })
    expect(resetButton).toHaveClass('btn-reset')
    
    const nextButton = screen.getByRole('button', { name: /下一步/ })
    expect(nextButton).toHaveClass('btn-next')
  })
})
