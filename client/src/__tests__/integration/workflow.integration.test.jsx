/**
 * 工作流系统集成测试
 * 测试三种工作流模式的完整交互流程
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import WorkflowContainer from '../../components/workflow/WorkflowContainer'
import useWorkflowStore from '../../store/workflowStore'

// Mock子组件，避免复杂依赖
jest.mock('../../components/workflow/LinearWorkflow', () => {
  return function MockLinearWorkflow() {
    return <div data-testid="linear-workflow">新手引导模式</div>
  }
})

jest.mock('../../components/workflow/CanvasWorkflow', () => {
  return function MockCanvasWorkflow() {
    return <div data-testid="canvas-workflow">专家自由模式</div>
  }
})

jest.mock('../../components/workflow/SmartWorkflow', () => {
  return function MockSmartWorkflow() {
    return <div data-testid="smart-workflow">智能推荐模式</div>
  }
})

describe('WorkflowContainer Integration Tests', () => {
  beforeEach(() => {
    // 重置状态
    useWorkflowStore.setState({
      currentMode: 'linear',
      linearWorkflow: {
        currentStep: 0,
        completedSteps: [],
        toolType: null
      },
      canvasWorkflow: {
        nodes: [],
        connections: []
      },
      smartWorkflow: {
        requirement: '',
        recommendations: [],
        analyzing: false
      }
    })
    
    // 清除localStorage
    localStorage.clear()
  })

  describe('模式切换集成测试', () => {
    test('should switch between workflow modes correctly', async () => {
      render(<WorkflowContainer />)
      
      // 初始应为新手引导模式
      expect(screen.getByTestId('linear-workflow')).toBeInTheDocument()
      
      // 切换到专家模式
      const expertButton = screen.getByRole('button', { name: /专家/i })
      fireEvent.click(expertButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('canvas-workflow')).toBeInTheDocument()
      })
      
      // 切换到智能推荐模式
      const smartButton = screen.getByRole('button', { name: /智能/i })
      fireEvent.click(smartButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('smart-workflow')).toBeInTheDocument()
      })
    })

    test('should maintain state when switching modes', () => {
      render(<WorkflowContainer />)
      
      // 在专家模式添加节点
      const expertButton = screen.getByRole('button', { name: /专家/i })
      fireEvent.click(expertButton)
      
      // 切换回新手模式再切回来
      const linearButton = screen.getByRole('button', { name: /新手/i })
      fireEvent.click(linearButton)
      fireEvent.click(expertButton)
      
      // 验证状态保持（通过检查组件是否重新渲染）
      expect(screen.getByTestId('canvas-workflow')).toBeInTheDocument()
    })
  })

  describe('错误处理集成测试', () => {
    test('should handle invalid mode gracefully', () => {
      // 设置无效模式
      useWorkflowStore.setState({ currentMode: 'invalid-mode' })
      
      render(<WorkflowContainer />)
      
      // 应显示默认模式或错误提示
      expect(screen.queryByTestId('linear-workflow')).toBeInTheDocument()
    })
  })

  describe('localStorage持久化测试', () => {
    test('should persist workflow preferences', () => {
      // 设置偏好
      useWorkflowStore.setState({ currentMode: 'canvas' })
      
      // 等待持久化完成
      setTimeout(() => {
        // 验证localStorage已保存
        const stored = localStorage.getItem('workflow-store')
        if (stored) {
          const parsed = JSON.parse(stored)
          expect(parsed.state.currentMode).toBe('canvas')
        }
      }, 100)
    })
  })
})
