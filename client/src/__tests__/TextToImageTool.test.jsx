import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextToImageTool from '../components/tools/TextToImageTool'

const createMockProps = (overrides = {}) => ({
  currentStep: 1,
  prompt: '',
  setPrompt: jest.fn(),
  negativePrompt: '',
  setNegativePrompt: jest.fn(),
  optimizingPrompt: false,
  onOptimizePrompt: jest.fn(),
  selectedStyle: 'realistic',
  setSelectedStyle: jest.fn(),
  styles: [
    { id: 'realistic', name: '写实风格', description: '逼真的照片效果' },
    { id: 'anime', name: '动漫风格', description: '日式动画风格' },
    { id: 'watercolor', name: '水彩风格', description: '水彩画效果' },
    { id: 'oil', name: '油画风格', description: '经典油画效果' },
    { id: 'digital', name: '数字绘画', description: '现代数字艺术' },
    { id: 'minimalist', name: '极简风格', description: '简约抽象' },
    { id: 'fantasy', name: '奇幻风格', description: '魔幻梦幻效果' },
    { id: 'cyberpunk', name: '赛博朋克', description: '未来科技感' },
  ],
  params: { width: 512, height: 512, steps: 30, guidance: 7.5, seed: -1 },
  setParam: jest.fn(),
  isGenerating: false,
  progress: 0,
  generatedImage: null,
  error: null,
  generate: jest.fn(),
  reset: jest.fn(),
  download: jest.fn(),
  ...overrides,
})

describe('TextToImageTool — Step 1: 提示词输入', () => {
  test('renders prompt textarea and negative prompt input', () => {
    render(<TextToImageTool {...createMockProps()} />)
    expect(screen.getByPlaceholderText(/描述你想要生成的图像/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/不想出现的内容/)).toBeInTheDocument()
  })

  test('calls setPrompt when typing in textarea', () => {
    const setPrompt = jest.fn()
    render(<TextToImageTool {...createMockProps({ setPrompt })} />)
    fireEvent.change(screen.getByPlaceholderText(/描述你想要生成的图像/), {
      target: { value: '测试提示词' },
    })
    expect(setPrompt).toHaveBeenCalledWith('测试提示词')
  })

  test('calls setNegativePrompt when typing negative input', () => {
    const setNegativePrompt = jest.fn()
    render(<TextToImageTool {...createMockProps({ setNegativePrompt })} />)
    fireEvent.change(screen.getByPlaceholderText(/不想出现的内容/), {
      target: { value: 'blurry' },
    })
    expect(setNegativePrompt).toHaveBeenCalledWith('blurry')
  })

  test('AI optimize button disabled when prompt is empty', () => {
    render(<TextToImageTool {...createMockProps({ prompt: '' })} />)
    expect(screen.getByText('AI 优化提示词')).toBeDisabled()
  })

  test('AI optimize button enabled when prompt has content', () => {
    render(<TextToImageTool {...createMockProps({ prompt: '测试' })} />)
    expect(screen.getByText('AI 优化提示词')).not.toBeDisabled()
  })

  test('calls onOptimizePrompt when AI button clicked', () => {
    const onOptimizePrompt = jest.fn()
    render(<TextToImageTool {...createMockProps({ prompt: '测试', onOptimizePrompt })} />)
    fireEvent.click(screen.getByText('AI 优化提示词'))
    expect(onOptimizePrompt).toHaveBeenCalled()
  })

  test('shows optimizing state', () => {
    render(<TextToImageTool {...createMockProps({ prompt: '测试', optimizingPrompt: true })} />)
    expect(screen.getByText('⏳ 优化中...')).toBeInTheDocument()
  })

  test('shows ready hint when prompt entered', () => {
    render(<TextToImageTool {...createMockProps({ prompt: '测试' })} />)
    expect(screen.getByText('✓ 已输入')).toBeInTheDocument()
  })

  test('shows warning hint when prompt is empty', () => {
    render(<TextToImageTool {...createMockProps({ prompt: '' })} />)
    expect(screen.getByText('⚠ 请输入提示词')).toBeInTheDocument()
  })
})

describe('TextToImageTool — Step 2: 选择风格', () => {
  test('renders all 8 style cards', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 2 })} />)
    expect(screen.getByText('写实风格')).toBeInTheDocument()
    expect(screen.getByText('动漫风格')).toBeInTheDocument()
    expect(screen.getByText('赛博朋克')).toBeInTheDocument()
  })

  test('calls setSelectedStyle when clicking a style card', () => {
    const setSelectedStyle = jest.fn()
    render(<TextToImageTool {...createMockProps({ currentStep: 2, setSelectedStyle })} />)
    fireEvent.click(screen.getByText('动漫风格'))
    expect(setSelectedStyle).toHaveBeenCalledWith('anime')
  })

  test('selected style has check mark', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 2, selectedStyle: 'anime' })} />)
    // 动漫风格卡片应该有 ✓
    const cards = document.querySelectorAll('.style-card')
    const animeCard = Array.from(cards).find(c => c.textContent.includes('动漫风格'))
    expect(animeCard.querySelector('.style-card-check').textContent).toBe('✓')
  })
})

describe('TextToImageTool — Step 3: 配置参数', () => {
  test('renders parameter controls', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 3 })} />)
    expect(screen.getByText('参数配置')).toBeInTheDocument()
    // 应该有 range inputs
    const ranges = document.querySelectorAll('input[type="range"]')
    expect(ranges.length).toBe(4)
  })

  test('shows seed input and random button', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 3 })} />)
    expect(screen.getByText('随机')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('留空为随机')).toBeInTheDocument()
  })

  test('random button sets a new seed', () => {
    const setParam = jest.fn()
    render(<TextToImageTool {...createMockProps({ currentStep: 3, setParam })} />)
    fireEvent.click(screen.getByText('随机'))
    expect(setParam).toHaveBeenCalledWith('seed', expect.any(Number))
  })
})

describe('TextToImageTool — Step 4: 生成结果', () => {
  test('shows generate button when no result yet', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 4, prompt: '测试提示词' })} />)
    expect(screen.getByText('开始生成')).toBeInTheDocument()
    expect(screen.getByText(/flux-schnell/)).toBeInTheDocument()
  })

  test('calls generate when button clicked', () => {
    const generate = jest.fn()
    render(<TextToImageTool {...createMockProps({ currentStep: 4, prompt: '测试', generate })} />)
    fireEvent.click(screen.getByText('开始生成'))
    expect(generate).toHaveBeenCalled()
  })

  test('shows progress when generating', () => {
    render(<TextToImageTool {...createMockProps({ currentStep: 4, isGenerating: true, progress: 60 })} />)
    expect(screen.getByText('生成中... 60%')).toBeInTheDocument()
  })

  test('shows result image and action buttons when generated', () => {
    render(<TextToImageTool {...createMockProps({
      currentStep: 4,
      generatedImage: { url: 'https://example.com/img.jpg', predictionId: 'abc' },
    })} />)
    expect(screen.getByText('重新生成')).toBeInTheDocument()
    expect(screen.getByText('下载图片')).toBeInTheDocument()
    expect(document.querySelector('.result-image')).toBeInTheDocument()
  })

  test('calls reset when re-generate clicked', () => {
    const reset = jest.fn()
    render(<TextToImageTool {...createMockProps({
      currentStep: 4,
      generatedImage: { url: 'https://example.com/img.jpg', predictionId: 'abc' },
      reset,
    })} />)
    fireEvent.click(screen.getByText('重新生成'))
    expect(reset).toHaveBeenCalled()
  })

  test('calls download when download button clicked', () => {
    const download = jest.fn()
    render(<TextToImageTool {...createMockProps({
      currentStep: 4,
      generatedImage: { url: 'https://example.com/img.jpg', predictionId: 'abc' },
      download,
    })} />)
    fireEvent.click(screen.getByText('下载图片'))
    expect(download).toHaveBeenCalled()
  })

  test('shows error message and retry button on error', () => {
    const generate = jest.fn()
    render(<TextToImageTool {...createMockProps({
      currentStep: 4,
      prompt: '测试',
      error: '生成超时',
      generate,
    })} />)
    expect(screen.getByText(/生成失败/)).toBeInTheDocument()
    expect(screen.getByText('重试')).toBeInTheDocument()
  })

  test('renders null for invalid step', () => {
    const { container } = render(<TextToImageTool {...createMockProps({ currentStep: 99 })} />)
    expect(container.innerHTML).toBe('')
  })
})
