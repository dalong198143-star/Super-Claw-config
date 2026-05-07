import React from 'react'

const motionModes = [
  { id: 'fast', name: '快速版', description: '10秒', duration: 10 },
  { id: 'precise', name: '高精度版', description: '20秒', duration: 20 },
]

const motionQualities = [
  { id: 'low', name: '流畅', description: '适合预览' },
  { id: 'medium', name: '标准', description: '日常使用' },
  { id: 'high', name: '高清', description: '最佳效果' },
]

const motionWidthOptions = [
  { id: 512, name: '512px' },
  { id: 720, name: '720px' },
  { id: 1080, name: '1080px' },
]

function MotionTransferTool({ 
  motionSourceFile, 
  motionSourcePreview, 
  motionTargetFile, 
  motionTargetPreview,
  motionMode, 
  onMotionModeChange,
  motionWidth, 
  onWidthChange,
  motionHeight, 
  onHeightChange,
  motionFps, 
  onFpsChange,
  motionQuality, 
  onQualityChange,
  onSourceUpload,
  onTargetUpload,
  onRemoveSource,
  onRemoveTarget,
  onNextStep,
  hasInput
}) {
  return (
    <div className="workflow-content">
      <div className="step-indicator">
        <span className="current-step">步骤1/3</span>
        <span className="step-title">输入素材</span>
      </div>
      <div className="motion-settings">
        <div className="motion-setting">
          <label>🕺 动作来源（源视频/图片）</label>
          <div className="upload-area">
            {motionSourcePreview ? (
              <div className="uploaded-preview">
                {motionSourceFile?.type?.startsWith('video') ? (
                  <video src={motionSourcePreview} className="preview-video" />
                ) : (
                  <img src={motionSourcePreview} alt="Source" />
                )}
                <button className="remove-upload" onClick={onRemoveSource}>✕</button>
              </div>
            ) : (
              <label className="upload-label">
                <input type="file" accept="image/jpeg,image/png,video/mp4" onChange={onSourceUpload} className="upload-input" />
                <span className="upload-icon">📹</span>
                <span>上传视频或图片</span>
                <span className="upload-hint">JPG / PNG / MP4，最大50MB</span>
              </label>
            )}
          </div>
        </div>
        <div className="motion-setting">
          <label>🎯 目标图片</label>
          <div className="upload-area">
            {motionTargetPreview ? (
              <div className="uploaded-preview">
                <img src={motionTargetPreview} alt="Target" />
                <button className="remove-upload" onClick={onRemoveTarget}>✕</button>
              </div>
            ) : (
              <label className="upload-label">
                <input type="file" accept="image/jpeg,image/png" onChange={onTargetUpload} className="upload-input" />
                <span className="upload-icon">🎯</span>
                <span>上传目标图片</span>
                <span className="upload-hint">JPG / PNG，最大20MB</span>
              </label>
            )}
          </div>
        </div>
        <div className="motion-setting">
          <label>⚡ 处理模式</label>
          <div className="mode-grid">
            {motionModes.map(mode => (
              <button 
                key={mode.id}
                className={`mode-btn ${motionMode === mode.id ? 'selected' : ''}`}
                onClick={() => onMotionModeChange(mode.id)}
              >
                <span className="mode-name">{mode.name}</span>
                <span className="mode-desc">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="motion-setting">
          <label>📐 输出尺寸</label>
          <div className="size-controls">
            <select 
              value={motionWidth} 
              onChange={(e) => onWidthChange(Number(e.target.value))}
              className="size-select"
            >
              {motionWidthOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <span className="size-separator">×</span>
            <input 
              type="number" 
              value={motionHeight} 
              onChange={(e) => onHeightChange(Number(e.target.value))}
              className="size-input"
              min="256"
              max="1080"
            />
            <span className="size-unit">px</span>
          </div>
        </div>
        <div className="motion-setting">
          <label>📊 帧率</label>
          <input 
            type="number" 
            value={motionFps} 
            onChange={(e) => onFpsChange(Number(e.target.value))}
            className="fps-input"
            min="10"
            max="60"
          />
          <span className="fps-unit">FPS</span>
        </div>
        <div className="motion-setting">
          <label>🎨 画质</label>
          <div className="quality-grid">
            {motionQualities.map(quality => (
              <button 
                key={quality.id}
                className={`quality-btn ${motionQuality === quality.id ? 'selected' : ''}`}
                onClick={() => onQualityChange(quality.id)}
              >
                <span className="quality-name">{quality.name}</span>
                <span className="quality-desc">{quality.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="step-actions">
        <span className="step-hint">
          {motionSourcePreview && motionTargetPreview ? '✓ 已准备好' : '请上传动作来源和目标图片'}
        </span>
        <button className="next-btn" onClick={onNextStep} disabled={!motionSourcePreview || !motionTargetPreview}>
          进入步骤2 →
        </button>
      </div>
    </div>
  )
}

export default MotionTransferTool