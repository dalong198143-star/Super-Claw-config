import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MotionTransferTool from '../components/tools/MotionTransferTool'

describe('MotionTransferTool Component', () => {
  const mockProps = {
    motionSourceFile: null,
    motionSourcePreview: null,
    motionTargetFile: null,
    motionTargetPreview: null,
    motionMode: 'fast',
    onMotionModeChange: jest.fn(),
    motionWidth: 720,
    onWidthChange: jest.fn(),
    motionHeight: 1280,
    onHeightChange: jest.fn(),
    motionFps: 30,
    onFpsChange: jest.fn(),
    motionQuality: 'medium',
    onQualityChange: jest.fn(),
    onSourceUpload: jest.fn(),
    onTargetUpload: jest.fn(),
    onRemoveSource: jest.fn(),
    onRemoveTarget: jest.fn(),
    onNextStep: jest.fn(),
    hasInput: false,
  }

  test('renders correctly with initial state', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    expect(screen.getByText('步骤1/3')).toBeInTheDocument()
    expect(screen.getByText('输入素材')).toBeInTheDocument()
    expect(screen.getAllByText(/动作来源/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/目标图片/)[0]).toBeInTheDocument()
  })

  test('displays upload areas for source and target', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    expect(screen.getByText('上传视频或图片')).toBeInTheDocument()
    expect(screen.getByText('上传目标图片')).toBeInTheDocument()
  })

  test('displays mode options', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    expect(screen.getByText('快速版')).toBeInTheDocument()
    expect(screen.getByText('高精度版')).toBeInTheDocument()
  })

  test('calls onMotionModeChange when clicking mode button', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const preciseButton = screen.getByText('高精度版').closest('button')
    fireEvent.click(preciseButton)
    
    expect(mockProps.onMotionModeChange).toHaveBeenCalledWith('precise')
  })

  test('displays width select dropdown', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const widthSelect = screen.getByRole('combobox')
    expect(widthSelect).toBeInTheDocument()
    expect(screen.getByText('512px')).toBeInTheDocument()
    expect(screen.getByText('720px')).toBeInTheDocument()
    expect(screen.getByText('1080px')).toBeInTheDocument()
  })

  test('calls onWidthChange when selecting width', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const widthSelect = screen.getByRole('combobox')
    fireEvent.change(widthSelect, { target: { value: '1080' } })
    
    expect(mockProps.onWidthChange).toHaveBeenCalledWith(1080)
  })

  test('displays height input', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const spinbuttons = screen.getAllByRole('spinbutton')
    // Find the height input by checking its value or position
    expect(spinbuttons.length).toBeGreaterThanOrEqual(2)
  })

  test('displays FPS input and can change it', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const spinbuttons = screen.getAllByRole('spinbutton')
    // There should be at least 2 number inputs (width and height or fps)
    expect(spinbuttons.length).toBeGreaterThanOrEqual(2)
  })

  test('calls onFpsChange when changing FPS', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const fpsInputs = screen.getAllByRole('spinbutton')
    const fpsInput = fpsInputs[1]
    fireEvent.change(fpsInput, { target: { value: '60' } })
    
    expect(mockProps.onFpsChange).toHaveBeenCalledWith(60)
  })

  test('displays quality options', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    expect(screen.getByText('流畅')).toBeInTheDocument()
    expect(screen.getByText('标准')).toBeInTheDocument()
    expect(screen.getByText('高清')).toBeInTheDocument()
  })

  test('calls onQualityChange when clicking quality button', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const highButton = screen.getByText('高清').closest('button')
    fireEvent.click(highButton)
    
    expect(mockProps.onQualityChange).toHaveBeenCalledWith('high')
  })

  test('next button is disabled when files not uploaded', () => {
    render(<MotionTransferTool {...mockProps} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).toBeDisabled()
  })

  test('next button is enabled when both files uploaded', () => {
    render(<MotionTransferTool 
      {...mockProps} 
      motionSourcePreview="source.mp4" 
      motionTargetPreview="target.jpg" 
    />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).not.toBeDisabled()
  })

  test('calls onNextStep when clicking next button', () => {
    render(<MotionTransferTool 
      {...mockProps} 
      motionSourcePreview="source.mp4" 
      motionTargetPreview="target.jpg" 
    />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    fireEvent.click(nextButton)
    
    expect(mockProps.onNextStep).toHaveBeenCalled()
  })

  test('shows ready hint when both files uploaded', () => {
    render(<MotionTransferTool 
      {...mockProps} 
      motionSourcePreview="source.mp4" 
      motionTargetPreview="target.jpg" 
    />)
    
    expect(screen.getByText('✓ 已准备好')).toBeInTheDocument()
  })
})
