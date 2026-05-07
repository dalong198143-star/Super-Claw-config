import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageToVideoTool from '../components/tools/ImageToVideoTool'

describe('ImageToVideoTool Component', () => {
  const mockProps = {
    uploadedImage: null,
    originalImageSize: null,
    lockOriginalRatio: true,
    onLockRatioChange: jest.fn(),
    videoFitMode: 'contain',
    onFitModeChange: jest.fn(),
    videoResolution: '1080p',
    onResolutionChange: jest.fn(),
    videoAspectRatio: '16:9',
    onAspectRatioChange: jest.fn(),
    onImageUpload: jest.fn(),
    onRemoveImage: jest.fn(),
    onNextStep: jest.fn(),
    hasInput: false,
  }

  test('renders correctly with initial state', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('步骤1/3')).toBeInTheDocument()
    expect(screen.getByText('输入素材')).toBeInTheDocument()
    expect(screen.getByLabelText(/上传图片/)).toBeInTheDocument()
  })

  test('displays upload area when no image uploaded', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('点击或拖拽上传图片')).toBeInTheDocument()
  })

  test('displays uploaded image preview', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test-image.jpg" />)
    
    const img = screen.getByAltText('Uploaded')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test-image.jpg')
  })

  test('calls onRemoveImage when clicking remove button', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test-image.jpg" />)
    
    const removeButton = screen.getByText('✕').closest('button')
    fireEvent.click(removeButton)
    
    expect(mockProps.onRemoveImage).toHaveBeenCalled()
  })

  test('displays original image info when image is uploaded', () => {
    const imageSize = { width: 1920, height: 1080, ratio: '16:9' }
    render(<ImageToVideoTool {...mockProps} uploadedImage="test.jpg" originalImageSize={imageSize} />)
    
    expect(screen.getByText(/原始图像信息/)).toBeInTheDocument()
    expect(screen.getByText(/尺寸: 1920 × 1080/)).toBeInTheDocument()
    expect(screen.getByText(/比例: 16:9/)).toBeInTheDocument()
  })

  test('lock ratio checkbox calls onLockRatioChange', () => {
    const imageSize = { width: 1920, height: 1080, ratio: '16:9' }
    render(<ImageToVideoTool {...mockProps} uploadedImage="test.jpg" originalImageSize={imageSize} />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    expect(mockProps.onLockRatioChange).toHaveBeenCalledWith(false)
  })

  test('displays fit mode options', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('保持比例')).toBeInTheDocument()
    expect(screen.getByText('填充裁剪')).toBeInTheDocument()
    expect(screen.getByText('拉伸')).toBeInTheDocument()
  })

  test('stretch mode is disabled when lock ratio is enabled', () => {
    render(<ImageToVideoTool {...mockProps} lockOriginalRatio={true} videoFitMode="stretch" />)
    
    const stretchButton = screen.getByText('拉伸').closest('button')
    expect(stretchButton).toBeDisabled()
  })

  test('calls onFitModeChange when clicking fit mode button', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    const coverButton = screen.getByText('填充裁剪').closest('button')
    fireEvent.click(coverButton)
    
    expect(mockProps.onFitModeChange).toHaveBeenCalledWith('cover')
  })

  test('displays resolution options', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('4K')).toBeInTheDocument()
    expect(screen.getByText('1080p')).toBeInTheDocument()
    expect(screen.getByText('720p')).toBeInTheDocument()
    expect(screen.getByText('480p')).toBeInTheDocument()
  })

  test('calls onResolutionChange when clicking resolution button', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    const resolutionButton = screen.getByText('4K').closest('button')
    fireEvent.click(resolutionButton)
    
    expect(mockProps.onResolutionChange).toHaveBeenCalledWith('2160p')
  })

  test('displays aspect ratio options', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    expect(screen.getByText('宽屏')).toBeInTheDocument()
    expect(screen.getByText('竖屏')).toBeInTheDocument()
    expect(screen.getByText('正方形')).toBeInTheDocument()
    expect(screen.getByText('标准')).toBeInTheDocument()
  })

  test('aspect ratio buttons are disabled when lock ratio is enabled', () => {
    render(<ImageToVideoTool {...mockProps} lockOriginalRatio={true} />)
    
    const ratioButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('宽屏') || btn.textContent.includes('竖屏')
    )
    ratioButtons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  test('next button is disabled when no image uploaded', () => {
    render(<ImageToVideoTool {...mockProps} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).toBeDisabled()
  })

  test('next button is enabled when image is uploaded', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test.jpg" />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).not.toBeDisabled()
  })

  test('calls onNextStep when clicking next button', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test.jpg" />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    fireEvent.click(nextButton)
    
    expect(mockProps.onNextStep).toHaveBeenCalled()
  })
})
