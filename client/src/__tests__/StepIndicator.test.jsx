import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import StepIndicator from '../components/workflow/StepIndicator'

describe('StepIndicator Component', () => {
  const mockSteps = ['步骤1', '步骤2', '步骤3', '步骤4']

  test('renders all steps', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />)
    
    mockSteps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument()
    })
  })

  test('displays step numbers', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  test('marks current step as active', () => {
    render(<StepIndicator steps={mockSteps} currentStep={2} />)
    
    const currentStepElement = screen.getByText('2').closest('.step-item')
    expect(currentStepElement).toHaveClass('current')
  })

  test('marks completed steps correctly', () => {
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={3} 
        completedSteps={[1, 2]} 
      />
    )
    
    const completedStepElement = screen.getAllByText('✓')[0].closest('.step-item')
    expect(completedStepElement).toHaveClass('completed')
    
    // Check that step 1 and 2 show checkmark
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks).toHaveLength(2)
  })

  test('marks pending steps correctly', () => {
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={2} 
        completedSteps={[1]} 
      />
    )
    
    const pendingStep = screen.getByText('3').closest('.step-item')
    expect(pendingStep).toHaveClass('pending')
    
    const pendingStep2 = screen.getByText('4').closest('.step-item')
    expect(pendingStep2).toHaveClass('pending')
  })

  test('renders connectors between steps', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />)
    
    const connectors = document.querySelectorAll('.step-connector')
    expect(connectors).toHaveLength(3) // 4 steps = 3 connectors
  })

  test('marks completed connectors', () => {
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={3} 
        completedSteps={[1, 2]} 
      />
    )
    
    const connectors = document.querySelectorAll('.step-connector')
    expect(connectors[0]).toHaveClass('completed')
    expect(connectors[1]).toHaveClass('completed')
    expect(connectors[2]).toHaveClass('pending')
  })

  test('handles single step without connectors', () => {
    render(<StepIndicator steps={['唯一步骤']} currentStep={1} />)
    
    const connectors = document.querySelectorAll('.step-connector')
    expect(connectors).toHaveLength(0)
  })

  test('applies correct CSS classes based on state', () => {
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={2} 
        completedSteps={[1]} 
      />
    )
    
    // Step 1 should be completed
    const step1Number = screen.getAllByText('✓')[0]
    expect(step1Number.closest('.step-item')).toHaveClass('completed')
    
    // Step 2 should be current
    const step2Number = screen.getByText('2')
    expect(step2Number.closest('.step-item')).toHaveClass('current')
    
    // Step 3 and 4 should be pending
    const step3Number = screen.getByText('3')
    expect(step3Number.closest('.step-item')).toHaveClass('pending')
  })

  test('updates when props change', () => {
    const { rerender } = render(
      <StepIndicator steps={mockSteps} currentStep={1} completedSteps={[]} />
    )
    
    expect(screen.getByText('1').closest('.step-item')).toHaveClass('current')
    
    // Update to step 2 with step 1 completed
    rerender(
      <StepIndicator steps={mockSteps} currentStep={2} completedSteps={[1]} />
    )
    
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks).toHaveLength(1)
    expect(screen.getByText('2').closest('.step-item')).toHaveClass('current')
  })

  test('handles empty completedSteps array', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} completedSteps={[]} />)
    
    const checkmarks = screen.queryAllByText('✓')
    expect(checkmarks).toHaveLength(0)
  })

  test('renders with custom step labels', () => {
    const customSteps = ['输入提示词', '选择风格', '配置参数', '生成图片']
    render(<StepIndicator steps={customSteps} currentStep={1} />)
    
    customSteps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument()
    })
  })
})
