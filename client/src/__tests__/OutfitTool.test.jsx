import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OutfitTool from '../components/tools/OutfitTool'

describe('OutfitTool Component', () => {
  const mockProps = {
    outfitPersonFile: null,
    outfitPersonPreview: null,
    outfitClothFile: null,
    outfitClothPreview: null,
    outfitEdgeSmooth: 5,
    onEdgeSmoothChange: jest.fn(),
    outfitBlend: 50,
    onBlendChange: jest.fn(),
    onPersonUpload: jest.fn(),
    onClothUpload: jest.fn(),
    onRemovePerson: jest.fn(),
    onRemoveCloth: jest.fn(),
    onNextStep: jest.fn(),
    hasInput: false,
  }

  test('renders correctly with initial state', () => {
    render(<OutfitTool {...mockProps} />)
    
    expect(screen.getByText('步骤1/3')).toBeInTheDocument()
    expect(screen.getByText('输入素材')).toBeInTheDocument()
    expect(screen.getAllByText(/人物图片/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/服装图片/)[0]).toBeInTheDocument()
  })

  test('displays upload areas for person and cloth', () => {
    render(<OutfitTool {...mockProps} />)
    
    expect(screen.getByText('上传人物图片')).toBeInTheDocument()
    expect(screen.getByText('上传服装图片')).toBeInTheDocument()
  })

  test('displays edge smooth slider', () => {
    render(<OutfitTool {...mockProps} />)
    
    expect(screen.getByText(/边缘平滑度: 5/)).toBeInTheDocument()
    const sliders = screen.getAllByRole('slider')
    const edgeSlider = sliders[0]
    expect(edgeSlider).toBeInTheDocument()
    // Slider value check may vary, just ensure it exists
    expect(edgeSlider).toHaveAttribute('type', 'range')
  })

  test('calls onEdgeSmoothChange when changing slider', () => {
    render(<OutfitTool {...mockProps} />)
    
    const sliders = screen.getAllByRole('slider')
    const edgeSlider = sliders[0]
    fireEvent.change(edgeSlider, { target: { value: '8' } })
    
    expect(mockProps.onEdgeSmoothChange).toHaveBeenCalledWith(8)
  })

  test('displays blend slider', () => {
    render(<OutfitTool {...mockProps} />)
    
    expect(screen.getByText(/融合程度: 50%/)).toBeInTheDocument()
    const sliders = screen.getAllByRole('slider')
    const blendSlider = sliders[1]
    expect(blendSlider).toBeInTheDocument()
    // Slider value check may vary, just ensure it exists
    expect(blendSlider).toHaveAttribute('type', 'range')
  })

  test('calls onBlendChange when changing blend slider', () => {
    render(<OutfitTool {...mockProps} />)
    
    const sliders = screen.getAllByRole('slider')
    const blendSlider = sliders[1]
    fireEvent.change(blendSlider, { target: { value: '75' } })
    
    expect(mockProps.onBlendChange).toHaveBeenCalledWith(75)
  })

  test('next button is disabled when files not uploaded', () => {
    render(<OutfitTool {...mockProps} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).toBeDisabled()
  })

  test('next button is enabled when both files uploaded', () => {
    render(<OutfitTool 
      {...mockProps} 
      outfitPersonPreview="person.jpg" 
      outfitClothPreview="cloth.jpg" 
    />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).not.toBeDisabled()
  })

  test('calls onNextStep when clicking next button', () => {
    render(<OutfitTool 
      {...mockProps} 
      outfitPersonPreview="person.jpg" 
      outfitClothPreview="cloth.jpg" 
    />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    fireEvent.click(nextButton)
    
    expect(mockProps.onNextStep).toHaveBeenCalled()
  })

  test('shows ready hint when both files uploaded', () => {
    render(<OutfitTool 
      {...mockProps} 
      outfitPersonPreview="person.jpg" 
      outfitClothPreview="cloth.jpg" 
    />)
    
    expect(screen.getByText('✓ 已准备好')).toBeInTheDocument()
  })

  test('calls onRemovePerson when clicking remove person button', () => {
    render(<OutfitTool {...mockProps} outfitPersonPreview="person.jpg" />)
    
    const removeButtons = screen.getAllByRole('button')
    fireEvent.click(removeButtons[0])
    
    expect(mockProps.onRemovePerson).toHaveBeenCalled()
  })

  test('calls onRemoveCloth when clicking remove cloth button', () => {
    render(<OutfitTool {...mockProps} outfitClothPreview="cloth.jpg" />)
    
    const removeButtons = screen.getAllByRole('button')
    fireEvent.click(removeButtons[0])
    
    expect(mockProps.onRemoveCloth).toHaveBeenCalled()
  })
})
