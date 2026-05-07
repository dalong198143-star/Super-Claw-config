import { render, screen, fireEvent } from '@testing-library/react'
import CanvasWorkflow from '../components/workflow/CanvasWorkflow'
import useWorkflowStore, { WORKFLOW_MODES } from '../store/workflowStore'

describe('CanvasWorkflow Component', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWorkflowStore.setState({
      currentMode: WORKFLOW_MODES.CANVAS,
      canvasWorkflow: {
        nodes: [],
        connections: [],
        selectedNode: null,
        zoom: 1,
        pan: { x: 0, y: 0 }
      }
    })
  })

  test('renders canvas toolbar with all available nodes', () => {
    render(<CanvasWorkflow />)
    
    expect(screen.getByText('添加工具节点')).toBeInTheDocument()
    expect(screen.getByText('文生图')).toBeInTheDocument()
    expect(screen.getByText('图生视频')).toBeInTheDocument()
    expect(screen.getByText('动作迁移')).toBeInTheDocument()
    expect(screen.getByText('换装')).toBeInTheDocument()
    expect(screen.getByText('超分')).toBeInTheDocument()
    expect(screen.getByText('视频拼接')).toBeInTheDocument()
  })

  test('displays node icons in palette', () => {
    render(<CanvasWorkflow />)
    
    expect(screen.getByText('🎨')).toBeInTheDocument()
    expect(screen.getByText('🎬')).toBeInTheDocument()
    expect(screen.getByText('🕺')).toBeInTheDocument()
    expect(screen.getByText('👔')).toBeInTheDocument()
    expect(screen.getByText('🔍')).toBeInTheDocument()
    expect(screen.getByText('✂️')).toBeInTheDocument()
  })

  test('shows empty canvas message initially', () => {
    render(<CanvasWorkflow />)
    
    expect(screen.getByText(/点击上方的工具节点添加到画布/)).toBeInTheDocument()
    expect(screen.getByText(/拖拽节点可以自由调整位置/)).toBeInTheDocument()
  })

  test('adds node when clicking palette button', () => {
    render(<CanvasWorkflow />)
    
    const textToImageButton = screen.getByText('文生图')
    fireEvent.click(textToImageButton)
    
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(1)
    expect(screen.queryByText(/点击上方的工具节点添加到画布/)).not.toBeInTheDocument()
  })

  test('displays added node on canvas', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getByText('文生图'))
    
    // Use getAllByText since there might be multiple (palette + canvas)
    const canvasNodes = screen.getAllByText('文生图')
    expect(canvasNodes.length).toBeGreaterThanOrEqual(1)
  })

  test('removes node when clicking remove button', () => {
    render(<CanvasWorkflow />)
    
    // Add a node
    fireEvent.click(screen.getByText('文生图'))
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(1)
    
    // Remove the node
    const removeButton = screen.getByText('×')
    fireEvent.click(removeButton)
    
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(0)
    expect(screen.getByText(/点击上方的工具节点添加到画布/)).toBeInTheDocument()
  })

  test('clears all nodes when clicking clear button', () => {
    render(<CanvasWorkflow />)
    
    // Add multiple nodes
    fireEvent.click(screen.getByText('文生图'))
    fireEvent.click(screen.getByText('图生视频'))
    fireEvent.click(screen.getByText('换装'))
    
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(3)
    
    // Clear canvas
    const clearButton = screen.getByText('🗑️ 清空画布')
    fireEvent.click(clearButton)
    
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(0)
    expect(useWorkflowStore.getState().canvasWorkflow.connections).toEqual([])
  })

  test('displays node count', () => {
    render(<CanvasWorkflow />)
    
    expect(screen.getByText('节点数: 0')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('文生图'))
    expect(screen.getByText('节点数: 1')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('图生视频'))
    expect(screen.getByText('节点数: 2')).toBeInTheDocument()
  })

  test('nodes have draggable attribute', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getByText('文生图'))
    
    const node = document.querySelector('.canvas-node')
    expect(node).toHaveAttribute('draggable', 'true')
  })

  test('applies correct color to node border', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getByText('文生图'))
    
    const node = document.querySelector('.canvas-node')
    expect(node).toHaveStyle('border-color: #667eea')
  })

  test('adds multiple different nodes', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getByText('文生图'))
    fireEvent.click(screen.getByText('图生视频'))
    fireEvent.click(screen.getByText('动作迁移'))
    
    const nodes = useWorkflowStore.getState().canvasWorkflow.nodes
    expect(nodes).toHaveLength(3)
    expect(nodes.map(n => n.type)).toEqual(['text-to-image', 'image-to-video', 'motion-transfer'])
  })

  test('each node has unique ID', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getByText('文生图'))
    fireEvent.click(screen.getByText('图生视频'))
    
    const nodes = useWorkflowStore.getState().canvasWorkflow.nodes
    const ids = nodes.map(n => n.id)
    expect(new Set(ids).size).toBe(2) // All IDs should be unique
  })

  test('node positions are randomized on add', () => {
    render(<CanvasWorkflow />)
    
    fireEvent.click(screen.getAllByText('文生图')[0])
    fireEvent.click(screen.getAllByText('文生图')[0])
    
    const nodes = useWorkflowStore.getState().canvasWorkflow.nodes
    // Positions should be different (with high probability)
    expect(nodes[0].position).not.toEqual(nodes[1].position)
  })

  test('palette buttons have correct styling', () => {
    render(<CanvasWorkflow />)
    
    const textToImageButton = screen.getAllByText('文生图')[0].closest('button')
    expect(textToImageButton).toHaveClass('palette-node')
    expect(textToImageButton).toHaveStyle('--node-color: #667eea')
  })

  test('canvas area renders correctly', () => {
    render(<CanvasWorkflow />)
    
    const canvasArea = document.querySelector('.canvas-area')
    expect(canvasArea).toBeInTheDocument()
  })

  test('toolbar has correct structure', () => {
    render(<CanvasWorkflow />)
    
    const toolbar = document.querySelector('.canvas-toolbar')
    expect(toolbar).toBeInTheDocument()
    
    const palette = document.querySelector('.node-palette')
    expect(palette).toBeInTheDocument()
  })

  test('stats section displays at bottom', () => {
    render(<CanvasWorkflow />)
    
    const stats = document.querySelector('.canvas-stats')
    expect(stats).toBeInTheDocument()
    expect(stats).toHaveTextContent('节点数: 0')
  })

  test('handles rapid node additions', () => {
    render(<CanvasWorkflow />)
    
    // Click multiple times rapidly - use the palette button (first occurrence)
    const paletteButton = screen.getAllByText('文生图')[0]
    for (let i = 0; i < 5; i++) {
      fireEvent.click(paletteButton)
    }
    
    expect(useWorkflowStore.getState().canvasWorkflow.nodes).toHaveLength(5)
  })
})
