import React from 'react'

const videoResolutions = [
  { id: '2160p', name: '4K', description: '3840 × 2160' },
  { id: '1080p', name: '1080p', description: '1920 × 1080' },
  { id: '720p', name: '720p', description: '1280 × 720' },
  { id: '480p', name: '480p', description: '854 × 480' },
]

const videoAspectRatios = [
  { id: '16:9', name: '宽屏', description: '16:9' },
  { id: '9:16', name: '竖屏', description: '9:16' },
  { id: '1:1', name: '正方形', description: '1:1' },
  { id: '4:3', name: '标准', description: '4:3' },
]

function ImageToVideoTool({ 
  uploadedImage, 
  originalImageSize, 
  lockOriginalRatio, 
  onLockRatioChange,
  videoFitMode, 
  onFitModeChange,
  videoResolution, 
  onResolutionChange,
  videoAspectRatio, 
  onAspectRatioChange,
  onImageUpload,
  onRemoveImage,
  onNextStep
}) {
  return (
    <div className="workflow-content">
      <div className="step-indicator">
        <span className="current-step">步骤1/3</span>
        <span className="step-title">输入素材</span>
      </div>
      <div className="input-section">
        <label>📷 上传图片（图生视频）</label>
        <div className="upload-area">
          {uploadedImage ? (
            <div className="uploaded-preview">
              <img src={uploadedImage} alt="Uploaded" />
              <button className="remove-upload" onClick={onRemoveImage}>✕</button>
            </div>
          ) : (
            <label className="upload-label">
              <input type="file" accept="image/*" onChange={onImageUpload} className="upload-input" />
              <span className="upload-icon">📷</span>
              <span>点击或拖拽上传图片</span>
            </label>
          )}
        </div>
      </div>
      <div className="video-settings">
        {uploadedImage && originalImageSize && (
          <div className="original-image-info">
            <div className="info-header">
              <span className="info-icon">🖼️</span>
              <span className="info-title">原始图像信息</span>
            </div>
            <div className="info-details">
              <span>📐 尺寸: {originalImageSize.width} × {originalImageSize.height}</span>
              <span>📐 比例: {originalImageSize.ratio}</span>
            </div>
            <label className="lock-ratio-toggle">
              <input 
                type="checkbox" 
                checked={lockOriginalRatio} 
                onChange={(e) => onLockRatioChange(e.target.checked)}
              />
              <span>🔒 保持原始图像比例</span>
            </label>
            <p className="lock-hint">开启后，视频生成时将严格保持原始图像的比例、构图和视觉完整性</p>
          </div>
        )}
        <div className="video-setting">
          <label>📐 视频适配模式</label>
          <div className="fit-mode-grid">
            <button 
              className={`fit-mode-btn ${videoFitMode === 'contain' ? 'selected' : ''}`}
              onClick={() => onFitModeChange('contain')}
            >
              <span className="fit-icon">📐</span>
              <span className="fit-name">保持比例</span>
              <span className="fit-desc">完整显示，可能有黑边</span>
            </button>
            <button 
              className={`fit-mode-btn ${videoFitMode === 'cover' ? 'selected' : ''}`}
              onClick={() => onFitModeChange('cover')}
            >
              <span className="fit-icon">🎯</span>
              <span className="fit-name">填充裁剪</span>
              <span className="fit-desc">填满画面，可能裁剪边缘</span>
            </button>
            <button 
              className={`fit-mode-btn ${videoFitMode === 'stretch' ? 'selected' : ''}`}
              onClick={() => onFitModeChange('stretch')}
              disabled={lockOriginalRatio}
            >
              <span className="fit-icon">↔️</span>
              <span className="fit-name">拉伸</span>
              <span className="fit-desc">拉伸适应画面（已禁用）</span>
            </button>
          </div>
          {lockOriginalRatio && videoFitMode === 'stretch' && (
            <p className="warning-text">⚠️ 保持比例模式下不允许拉伸</p>
          )}
        </div>
        <div className="video-setting">
          <label>📺 视频清晰度</label>
          <div className="resolution-grid">
            {videoResolutions.map(res => (
              <button 
                key={res.id}
                className={`resolution-btn ${videoResolution === res.id ? 'selected' : ''}`}
                onClick={() => onResolutionChange(res.id)}
              >
                <span className="res-name">{res.name}</span>
                <span className="res-desc">{res.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="video-setting">
          <label>📐 画面比例</label>
          <div className="ratio-grid">
            {videoAspectRatios.map(ratio => (
              <button 
                key={ratio.id}
                className={`ratio-btn ${videoAspectRatio === ratio.id ? 'selected' : ''} ${lockOriginalRatio ? 'locked' : ''}`}
                onClick={() => {
                  if (!lockOriginalRatio) {
                    onAspectRatioChange(ratio.id)
                  }
                }}
                disabled={lockOriginalRatio}
              >
                <span className="ratio-name">{ratio.name}</span>
                <span className="ratio-desc">{ratio.description}</span>
              </button>
            ))}
          </div>
          {lockOriginalRatio && (
            <p className="lock-hint">🔒 已锁定为原始图像比例（{originalImageSize?.ratio || '-'}）</p>
          )}
        </div>
      </div>
      <div className="step-actions">
        <span className="step-hint">
          {uploadedImage ? '✓ 已准备好' : '请上传图片'}
        </span>
        <button className="next-btn" onClick={onNextStep} disabled={!uploadedImage}>
          进入步骤2 →
        </button>
      </div>
    </div>
  )
}

export default ImageToVideoTool