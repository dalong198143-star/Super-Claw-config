import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageToVideoTool from '../components/tools/ImageToVideoTool'

describe('ImageToVideoTool Component', () => {
  const mockProps = {
    image: null,
    onImageUpload: jest.fn(),
    onRemoveImage: jest.fn(),
    onGenerate: jest.fn(),
    isGenerating: false,
    progress: 0,
    result: null,
    error: null,
    onDownload: jest.fn(),
    onReset: jest.fn(),
    params: {},
    onParamChange: jest.fn(),
  }

  test('renders upload area in step 1', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('图生视频')).toBeInTheDocument()
    expect(screen.getByText(/步骤 1\/3/)).toBeInTheDocument()
    expect(screen.getByText(/点击上传图片/)).toBeInTheDocument()
  })

  test('displays supported image formats', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText(/JPG \/ PNG \/ WebP/)).toBeInTheDocument()
  })

  test('displays uploaded image preview', () => {
    render(<ImageToVideoTool {...mockProps} image="test-image.jpg" />)
    
    const img = screen.getByAltText('预览')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test-image.jpg')
  })

  test('shows next button when image uploaded', () => {
    render(<ImageToVideoTool {...mockProps} image="test-image.jpg" />)
    
    expect(screen.getByText(/下一步/)).toBeInTheDocument()
  })

  test('calls onRemoveImage when clicking remove button', () => {
    render(<ImageToVideoTool {...mockProps} image="test-image.jpg" />)
    
    const removeButton = screen.getByText(/✕ 移除/)
    fireEvent.click(removeButton)
    
    expect(mockProps.onRemoveImage).toHaveBeenCalled()
  })
})
