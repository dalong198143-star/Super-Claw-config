import useWorkflowStore, { WORKFLOW_MODES } from '../store/workflowStore'

/**
 * 工作流管理Hook
 * 提供统一的工作流操作接口
 */
export const useWorkflow = () => {
  const store = useWorkflowStore()
  
  return {
    // 状态
    currentMode: store.currentMode,
    linearWorkflow: store.linearWorkflow,
    canvasWorkflow: store.canvasWorkflow,
    smartWorkflow: store.smartWorkflow,
    
    // 模式切换
    setMode: store.setMode,
    
    // 新手引导模式方法
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    resetLinearWorkflow: store.resetLinearWorkflow,
    updateStepData: store.updateStepData,
    
    // 专家自由模式方法
    addNode: store.addNode,
    removeNode: store.removeNode,
    updateNodePosition: store.updateNodePosition,
    addConnection: store.addConnection,
    removeConnection: store.removeConnection,
    clearCanvas: store.clearCanvas,
    
    // 智能推荐模式方法
    setRequirement: store.setRequirement,
    setRecommendations: store.setRecommendations,
    setAnalyzing: store.setAnalyzing,
    clearSmartWorkflow: store.clearSmartWorkflow,
    
    // 工具函数
    isLinearMode: () => store.currentMode === WORKFLOW_MODES.LINEAR,
    isCanvasMode: () => store.currentMode === WORKFLOW_MODES.CANVAS,
    isSmartMode: () => store.currentMode === WORKFLOW_MODES.SMART
  }
}

export { WORKFLOW_MODES }
export default useWorkflow