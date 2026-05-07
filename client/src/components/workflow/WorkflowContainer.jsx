import React from 'react'
import { useWorkflow, WORKFLOW_MODES } from '../../hooks/useWorkflow'
import WorkflowModeSwitcher from './WorkflowModeSwitcher'
import LinearWorkflow from './LinearWorkflow'
import CanvasWorkflow from './CanvasWorkflow'
import SmartWorkflow from './SmartWorkflow'
import './WorkflowContainer.css'

function WorkflowContainer({ selectedTool, toolComponent }) {
  const { currentMode } = useWorkflow()
  
  // 根据当前模式渲染对应的工作流
  const renderWorkflow = () => {
    switch (currentMode) {
      case WORKFLOW_MODES.LINEAR:
        return (
          <LinearWorkflow 
            selectedTool={selectedTool}
            toolComponent={toolComponent}
          />
        )
      
      case WORKFLOW_MODES.CANVAS:
        return <CanvasWorkflow />
      
      case WORKFLOW_MODES.SMART:
        return <SmartWorkflow />
      
      default:
        return <LinearWorkflow selectedTool={selectedTool} toolComponent={toolComponent} />
    }
  }
  
  return (
    <div className="workflow-container">
      <WorkflowModeSwitcher />
      
      <div className="workflow-content">
        {renderWorkflow()}
      </div>
    </div>
  )
}

export default WorkflowContainer