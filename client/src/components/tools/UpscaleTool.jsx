import React from 'react'

const upscaleModes = [
  { id: 'denoise', name: '去噪', description: '去除图像噪点' },
  { id: 'sharpen', name: '增强', description: '提升清晰度' },
  { id: 'style', name: '风格转换', description: '转换图像风格' },
]

const upscaleScales = [
  { id: 2, name: '2x', description: '2倍放大' },
  { id: 4, name: '4x', description: '4倍放大' },
]

const upscaleStyles = [
  { id: 'natural', name: '自然', description: '保持原样' },
  { id: 'anime', name: '动漫', description: '动漫风格' },
  { id: 'oil', name: '油画', description: '油画效果' },
  { id: 'watercolor', name: '水彩', description: '水彩效果' },
]

function UpscaleTool({ 
  upscaleFile, 
  upscalePreview,
  upscaleMode, 
  onModeChange,
  upscaleScale, 
  onScaleChange,
  upscaleStyle, 
  onStyleChange,
  onImageUpload,
  onRemoveImage,
  onNextStep,
  hasInput
}) {
  return (
    <div className="workflow-content">
      <div className="step-indicator">
        <span className="current-step">步骤1/3</span>
        <span className="step-title">输入素材</span>
      </div>
      <div className="upscale-settings">
        <div className="upscale-setting">
          <label>🖼️ 上传图片</label>
          <div className="upload-area">
            {upscalePreview ? (
              <div className="uploaded-preview">
                <img src={upscalePreview} alt="Upscale" />
                <button className="remove-upload" onClick={onRemoveImage}>✕</button>
              </div>
            ) : (
              <label className="upload-label">
                <input type="file" accept="image/jpeg,image/png" onChange={onImageUpload} className="upload-input" />
                <span className="upload-icon">🖼️</span>
                <span>上传图片</span>
                <span className="upload-hint">JPG / PNG，最大20MB</span>
              </label>
            )}
          </div>
        </div>
        <div className="upscale-setting">
          <label>✨ 处理模式</label>
          <div className="mode-grid">
            {upscaleModes.map(mode => (
              <button 
                key={mode.id}
                className={`mode-btn ${upscaleMode === mode.id ? 'selected' : ''}`}
                onClick={() => onModeChange(mode.id)}
              >
                <span className="mode-name">{mode.name}</span>
                <span className="mode-desc">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="upscale-setting">
          <label>🔍 放大倍数</label>
          <div className="scale-grid">
            {upscaleScales.map(scale => (
              <button 
                key={scale.id}
                className={`scale-btn ${upscaleScale === scale.id ? 'selected' : ''}`}
                onClick={() => onScaleChange(scale.id)}
              >
                <span className="scale-name">{scale.name}</span>
                <span className="scale-desc">{scale.description}</span>
              </button>
            ))}
          </div>
        </div>
        {upscaleMode === 'style' && (
          <div className="upscale-setting">
            <label>🎨 目标风格</label>
            <div className="style-grid">
              {upscaleStyles.map(style => (
                <button 
                  key={style.id}
                  className={`style-btn ${upscaleStyle === style.id ? 'selected' : ''}`}
                  onClick={() => onStyleChange(style.id)}
                >
                  <span className="style-name">{style.name}</span>
                  <span className="style-desc">{style.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="step-actions">
        <span className="step-hint">
          {upscalePreview ? '✓ 已准备好' : '请上传图片'}
        </span>
        <button className="next-btn" onClick={onNextStep} disabled={!upscalePreview}>
          进入步骤2 →
        </button>
      </div>
    </div>
  )
}

export default UpscaleTool