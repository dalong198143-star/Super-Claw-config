import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 工作流模式枚举
export const WORKFLOW_MODES = {
  LINEAR: 'linear',      // 新手引导模式
  CANVAS: 'canvas',      // 专家自由模式
  SMART: 'smart'         // 智能推荐模式
}

// 创建工作流状态存储
const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // 当前工作流模式
      currentMode: WORKFLOW_MODES.LINEAR,
      
      // 新手引导模式状态
      linearWorkflow: {
        currentStep: 1,
        totalSteps: 4,
        completedSteps: [],
        stepData: {} // 存储每个步骤的数据
      },
      
      // 专家自由模式状态
      canvasWorkflow: {
        nodes: [],       // 节点列表
        connections: [], // 连线列表
        selectedNode: null,
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      
      // 智能推荐模式状态
      smartWorkflow: {
        requirement: '',
        recommendations: [],
        analyzing: false
      },
      
      // Actions
      
      // 切换工作流模式
      setMode: (mode) => {
        if (Object.values(WORKFLOW_MODES).includes(mode)) {
          set({ currentMode: mode })
        }
      },
      
      // 新手引导模式Actions
      nextStep: () => {
        const { linearWorkflow } = get()
        if (linearWorkflow.currentStep < linearWorkflow.totalSteps) {
          set((state) => ({
            linearWorkflow: {
              ...state.linearWorkflow,
              currentStep: state.linearWorkflow.currentStep + 1,
              completedSteps: [
                ...new Set([...state.linearWorkflow.completedSteps, state.linearWorkflow.currentStep])
              ]
            }
          }))
        }
      },
      
      prevStep: () => {
        const { linearWorkflow } = get()
        if (linearWorkflow.currentStep > 1) {
          set((state) => ({
            linearWorkflow: {
              ...state.linearWorkflow,
              currentStep: state.linearWorkflow.currentStep - 1
            }
          }))
        }
      },
      
      resetLinearWorkflow: () => {
        set({
          linearWorkflow: {
            currentStep: 1,
            totalSteps: 4,
            completedSteps: [],
            stepData: {}
          }
        })
      },
      
      updateStepData: (step, data) => {
        set((state) => ({
          linearWorkflow: {
            ...state.linearWorkflow,
            stepData: {
              ...state.linearWorkflow.stepData,
              [step]: data
            }
          }
        }))
      },
      
      // 专家自由模式Actions
      addNode: (node) => {
        set((state) => ({
          canvasWorkflow: {
            ...state.canvasWorkflow,
            nodes: [...state.canvasWorkflow.nodes, {
              id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...node
            }]
          }
        }))
      },
      
      removeNode: (nodeId) => {
        set((state) => ({
          canvasWorkflow: {
            ...state.canvasWorkflow,
            nodes: state.canvasWorkflow.nodes.filter(n => n.id !== nodeId),
            connections: state.canvasWorkflow.connections.filter(
              c => c.source !== nodeId && c.target !== nodeId
            )
          }
        }))
      },
      
      updateNodePosition: (nodeId, position) => {
        set((state) => ({
          canvasWorkflow: {
            ...state.canvasWorkflow,
            nodes: state.canvasWorkflow.nodes.map(n =>
              n.id === nodeId ? { ...n, position } : n
            )
          }
        }))
      },
      
      addConnection: (connection) => {
        set((state) => ({
          canvasWorkflow: {
            ...state.canvasWorkflow,
            connections: [...state.canvasWorkflow.connections, {
              id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...connection
            }]
          }
        }))
      },
      
      removeConnection: (connectionId) => {
        set((state) => ({
          canvasWorkflow: {
            ...state.canvasWorkflow,
            connections: state.canvasWorkflow.connections.filter(c => c.id !== connectionId)
          }
        }))
      },
      
      clearCanvas: () => {
        set({
          canvasWorkflow: {
            nodes: [],
            connections: [],
            selectedNode: null,
            zoom: 1,
            pan: { x: 0, y: 0 }
          }
        })
      },
      
      // 智能推荐模式Actions
      setRequirement: (requirement) => {
        set((state) => ({
          smartWorkflow: {
            ...state.smartWorkflow,
            requirement
          }
        }))
      },
      
      setRecommendations: (recommendations) => {
        set((state) => ({
          smartWorkflow: {
            ...state.smartWorkflow,
            recommendations
          }
        }))
      },
      
      setAnalyzing: (analyzing) => {
        set((state) => ({
          smartWorkflow: {
            ...state.smartWorkflow,
            analyzing
          }
        }))
      },
      
      clearSmartWorkflow: () => {
        set({
          smartWorkflow: {
            requirement: '',
            recommendations: [],
            analyzing: false
          }
        })
      }
    }),
    {
      name: 'workflow-preferences', // localStorage key
      partialize: (state) => ({
        currentMode: state.currentMode // 只持久化当前模式
      })
    }
  )
)

export { useWorkflowStore }
export default useWorkflowStore
