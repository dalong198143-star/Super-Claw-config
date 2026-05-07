import React from 'react'
import { useWorkflow, WORKFLOW_MODES } from '../../hooks/useWorkflow'
import './WorkflowModeSwitcher.css'

function WorkflowModeSwitcher() {
  const { currentMode, setMode } = useWorkflow()
  
  const modes = [
    {
      id: WORKFLOW_MODES.LINEAR,
      name: '新手引导',
      icon: '📚',
      description: '4步流程指引',
      color: '#667eea'
    },
    {
      id: WORKFLOW_MODES.CANVAS,
      name: '专家自由',
      icon: '🎨',
      description: '拖拽节点到画布',
      color: '#ed64a6'
    },
    {
      id: WORKFLOW_MODES.SMART,
      name: '智能推荐',
      icon: '🤖',
      description: 'AI分析推荐工作流',
      color: '#38a169'
    }
  ]

  return (
    <div className="workflow-mode-switcher">
      <div className="mode-switch-header">
        <h3>🎯 工作流模式</h3>
        <div className="mode-indicator" style={{ backgroundColor: modes.find(m => m.id === currentMode)?.color }}></div>
      </div>
      <div className="mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => setMode(mode.id)}
            style={{
              '--mode-color': mode.color,
              '--mode-color-bg': `${mode.color}15`
            }}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.name}</span>
            <span className="mode-desc">{mode.description}</span>
            {currentMode === mode.id && <span className="active-indicator"></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default WorkflowModeSwitcher