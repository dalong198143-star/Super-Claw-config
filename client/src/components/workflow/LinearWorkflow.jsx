import React from 'react'
import { useWorkflow } from '../../hooks/useWorkflow'
import StepIndicator from './StepIndicator'
import './LinearWorkflow.css'

const WORKFLOW_STEPS = {
  'text-to-image': ['输入提示词', '选择风格', '配置参数', '生成图片'],
  'image-to-video': ['上传图片', '设置参数', '生成视频', '预览保存'],
  'motion-transfer': ['上传人物图', '上传动作视频', '配置参数', '生成结果'],
  'outfit': ['上传人物图', '选择服装', '调整参数', '生成换装'],
  'upscale': ['上传图片', '选择模式', '设置倍率', '超分完成'],
  'video-join': ['上传视频', '调整顺序', '添加特效', '导出视频']
}

function LinearWorkflow({ selectedTool, toolComponent }) {
  const { 
    linearWorkflow, 
    nextStep, 
    prevStep, 
    resetLinearWorkflow,
    updateStepData 
  } = useWorkflow()
  
  const { currentStep, totalSteps, completedSteps } = linearWorkflow
  const steps = WORKFLOW_STEPS[selectedTool] || WORKFLOW_STEPS['text-to-image']
  
  const handleNext = () => {
    updateStepData(currentStep, { completed: true })
    nextStep()
  }

  return (
    <div className="linear-workflow">
      <StepIndicator 
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
      
      <div className="step-content">
        <div className="step-header">
          <h3>步骤 {currentStep}: {steps[currentStep - 1]}</h3>
          <span className="step-progress">{currentStep} / {totalSteps}</span>
        </div>
        
        <div className="step-body">
          {toolComponent}
        </div>
        
        <div className="step-footer">
          <button 
            className="btn-prev"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← 上一步
          </button>
          
          <button 
            className="btn-reset"
            onClick={resetLinearWorkflow}
          >
            🔄 重新开始
          </button>
          
          <button 
            className="btn-next"
            onClick={handleNext}
            disabled={currentStep === totalSteps}
          >
            {currentStep === totalSteps ? '✓ 完成' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinearWorkflow