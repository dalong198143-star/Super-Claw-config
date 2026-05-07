import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import UpscaleTool from '../components/tools/UpscaleTool'

describe('UpscaleTool Component', () => {
  const mockProps = {
    upscaleFile: null,
    upscalePreview: null,
    upscaleMode: 'denoise',
    onModeChange: jest.fn(),
    upscaleScale: 2,
    onScaleChange: jest.fn(),
    upscaleStyle: 'natural',
    onStyleChange: jest.fn(),
    onImageUpload: jest.fn(),
    onRemoveImage: jest.fn(),
    onNextStep: jest.fn(),
    hasInput: false,
  }

  test('renders correctly with initial state', () => {
    render(<UpscaleTool {...mockProps} />)
    
    expect(screen.getByText('步骤1/3')).toBeInTheDocument()
    expect(screen.getByText('输入素材')).toBeInTheDocument()
    expect(screen.getAllByText(/上传图片/)[0]).toBeInTheDocument()
  })

  test('displays upload area', () => {
    render(<UpscaleTool {...mockProps} />)
    
    expect(screen.getByText('上传图片')).toBeInTheDocument()
  })

  test('displays uploaded image preview', () => {
    render(<UpscaleTool {...mockProps} upscalePreview="test.jpg" />)
    
    const img = screen.getByAltText('Upscale')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test.jpg')
  })

  test('calls onRemoveImage when clicking remove button', () => {
    render(<UpscaleTool {...mockProps} upscalePreview="test.jpg" />)
    
    const removeButton = screen.getByText('✕').closest('button')
    fireEvent.click(removeButton)
    
    expect(mockProps.onRemoveImage).toHaveBeenCalled()
  })

  test('displays mode options', () => {
    render(<UpscaleTool {...mockProps} />)
    
    expect(screen.getByText('去噪')).toBeInTheDocument()
    expect(screen.getByText('增强')).toBeInTheDocument()
    expect(screen.getByText('风格转换')).toBeInTheDocument()
  })

  test('calls onModeChange when clicking mode button', () => {
    render(<UpscaleTool {...mockProps} />)
    
    const sharpenButton = screen.getByText('增强').closest('button')
    fireEvent.click(sharpenButton)
    
    expect(mockProps.onModeChange).toHaveBeenCalledWith('sharpen')
  })

  test('displays scale options', () => {
    render(<UpscaleTool {...mockProps} />)
    
    expect(screen.getByText('2x')).toBeInTheDocument()
    expect(screen.getByText('4x')).toBeInTheDocument()
  })

  test('calls onScaleChange when clicking scale button', () => {
    render(<UpscaleTool {...mockProps} />)
    
    const scaleButton = screen.getByText('4x').closest('button')
    fireEvent.click(scaleButton)
    
    expect(mockProps.onScaleChange).toHaveBeenCalledWith(4)
  })

  test('shows style options only when mode is style', () => {
    const { rerender } = render(<UpscaleTool {...mockProps} upscaleMode="denoise" />)
    
    // When mode is not 'style', style section should not be visible
    const styleLabels = screen.queryAllByText(/目标风格/)
    expect(styleLabels.length).toBe(0)
    
    rerender(<UpscaleTool {...mockProps} upscaleMode="style" />)
    
    // When mode is 'style', style section should be visible
    expect(screen.getByText(/目标风格/)).toBeInTheDocument()
    expect(screen.getByText('自然')).toBeInTheDocument()
    expect(screen.getByText('动漫')).toBeInTheDocument()
  })

  test('calls onStyleChange when clicking style button', () => {
    render(<UpscaleTool {...mockProps} upscaleMode="style" />)
    
    const animeButton = screen.getByText('动漫').closest('button')
    fireEvent.click(animeButton)
    
    expect(mockProps.onStyleChange).toHaveBeenCalledWith('anime')
  })

  test('next button is disabled when no image uploaded', () => {
    render(<UpscaleTool {...mockProps} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).toBeDisabled()
  })

  test('next button is enabled when image is uploaded', () => {
    render(<UpscaleTool {...mockProps} upscalePreview="test.jpg" />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).not.toBeDisabled()
  })

  test('calls onNextStep when clicking next button', () => {
    render(<UpscaleTool {...mockProps} upscalePreview="test.jpg" />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    fireEvent.click(nextButton)
    
    expect(mockProps.onNextStep).toHaveBeenCalled()
  })

  test('shows ready hint when image uploaded', () => {
    render(<UpscaleTool {...mockProps} upscalePreview="test.jpg" />)
    
    expect(screen.getByText('✓ 已准备好')).toBeInTheDocument()
  })
})
