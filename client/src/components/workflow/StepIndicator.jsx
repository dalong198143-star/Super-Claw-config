import React from 'react'
import './StepIndicator.css'

function StepIndicator({ steps, currentStep, completedSteps = [] }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = completedSteps.includes(stepNumber)
        const isCurrent = currentStep === stepNumber
        const isPending = !isCompleted && !isCurrent
        
        return (
          <React.Fragment key={index}>
            <div 
              className={`step-item ${
                isCompleted ? 'completed' : 
                isCurrent ? 'current' : 
                'pending'
              }`}
            >
              <div className="step-number">
                {isCompleted ? '✓' : stepNumber}
              </div>
              <div className="step-label">{step}</div>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`step-connector ${
                  isCompleted ? 'completed' : 'pending'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default StepIndicator