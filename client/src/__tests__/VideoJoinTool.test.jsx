import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoJoinTool from '../components/tools/VideoJoinTool'

describe('VideoJoinTool Component', () => {
  const mockProps = {
    videoClips: [],
    onVideoUpload: jest.fn(),
    onRemoveClip: jest.fn(),
    onMoveClip: jest.fn(),
    onNextStep: jest.fn(),
  }

  test('renders correctly with initial state', () => {
    render(<VideoJoinTool {...mockProps} />)
    
    expect(screen.getByText('步骤1/3')).toBeInTheDocument()
    expect(screen.getByText('输入素材')).toBeInTheDocument()
    expect(screen.getAllByText(/上传视频片段/)[0]).toBeInTheDocument()
  })

  test('displays upload area', () => {
    render(<VideoJoinTool {...mockProps} />)
    
    expect(screen.getByText('上传视频片段')).toBeInTheDocument()
    expect(screen.getByText(/MP4 \/ WebM \/ MOV/)).toBeInTheDocument()
  })

  test('shows clip count when clips uploaded', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    expect(screen.getByText(/已上传片段 \(2\)/)).toBeInTheDocument()
  })

  test('displays uploaded clips list', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    expect(screen.getByText('clip1.mp4')).toBeInTheDocument()
    expect(screen.getByText('5MB')).toBeInTheDocument()
    expect(screen.getByText('clip2.mp4')).toBeInTheDocument()
    expect(screen.getByText('8MB')).toBeInTheDocument()
  })

  test('displays clip index numbers', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('calls onRemoveClip when clicking remove button', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find(btn => btn.textContent === '✕')
    fireEvent.click(removeButton)
    
    expect(mockProps.onRemoveClip).toHaveBeenCalledWith('1')
  })

  test('calls onMoveClip with up direction', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
      { id: '3', name: 'clip3.mp4', size: '6MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const moveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '↑')
    fireEvent.click(moveButtons[1]) // Second clip's up button
    
    expect(mockProps.onMoveClip).toHaveBeenCalledWith('2', 'up')
  })

  test('calls onMoveClip with down direction', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
      { id: '3', name: 'clip3.mp4', size: '6MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const moveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '↓')
    fireEvent.click(moveButtons[0]) // First clip's down button
    
    expect(mockProps.onMoveClip).toHaveBeenCalledWith('1', 'down')
  })

  test('first clip up button is disabled', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const upButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '↑')
    expect(upButtons[0]).toBeDisabled()
  })

  test('last clip down button is disabled', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const downButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '↓')
    expect(downButtons[downButtons.length - 1]).toBeDisabled()
  })

  test('next button is disabled when less than 2 clips', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).toBeDisabled()
  })

  test('next button is enabled when 2 or more clips', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    expect(nextButton).not.toBeDisabled()
  })

  test('calls onNextStep when clicking next button', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    const nextButton = screen.getByRole('button', { name: /进入步骤2/ })
    fireEvent.click(nextButton)
    
    expect(mockProps.onNextStep).toHaveBeenCalled()
  })

  test('shows ready hint when 2 or more clips', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
      { id: '2', name: 'clip2.mp4', size: '8MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    expect(screen.getByText('✓ 已准备好')).toBeInTheDocument()
  })

  test('shows upload hint when less than 2 clips', () => {
    const clips = [
      { id: '1', name: 'clip1.mp4', size: '5MB' },
    ]
    render(<VideoJoinTool {...mockProps} videoClips={clips} />)
    
    expect(screen.getByText(/请上传至少2个视频片段/)).toBeInTheDocument()
  })
})
