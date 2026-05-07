import React from 'react'

function WorkflowSteps({ workflowStep, onStepChange }) {
  const steps = [
    { id: 1, label: '输入' },
    { id: 2, label: '选择工具' },
    { id: 3, label: '生成' }
  ]

  return (
    <div className="workflow-steps">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button 
            className={`step ${workflowStep === step.id ? 'active current' : workflowStep > step.id ? 'active' : ''}`}
            onClick={() => onStepChange(step.id)}
            disabled={workflowStep < step.id - 1}
          >
            <span className="step-number">{step.id}</span>
            <span className="step-label">{step.label}</span>
          </button>
          {index < steps.length - 1 && <div className="step-arrow">→</div>}
        </React.Fragment>
      ))}
    </div>
  )
}

export default WorkflowSteps