import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ImageToVideoTool from '../components/tools/ImageToVideoTool'

describe('ImageToVideoTool Component', () => {
  const mockProps = {
    uploadedImage: null,
    originalImageSize: null,
    lockOriginalRatio: false,
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
  }

  test('renders upload area in step 1', () => {
    render(<ImageToVideoTool {...mockProps} />)
    expect(screen.getByText(/步骤1\/3/)).toBeInTheDocument()
    expect(screen.getAllByText(/上传图片/).length).toBeGreaterThan(0)
  })

  test('shows file upload input', () => {
    render(<ImageToVideoTool {...mockProps} />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })

  test('displays uploaded image preview', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test-image.jpg" />)
    const img = document.querySelector('.uploaded-preview img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test-image.jpg')
  })

  test('shows next step button when image uploaded', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test-image.jpg" />)
    expect(screen.getByText(/进入步骤2/)).toBeInTheDocument()
  })

  test('calls onRemoveImage when clicking remove button', () => {
    render(<ImageToVideoTool {...mockProps} uploadedImage="test-image.jpg" />)
    const removeBtn = document.querySelector('.remove-upload')
    expect(removeBtn).toBeInTheDocument()
    fireEvent.click(removeBtn)
    expect(mockProps.onRemoveImage).toHaveBeenCalled()
  })
})
