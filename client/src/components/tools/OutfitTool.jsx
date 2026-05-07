import React from 'react'

function OutfitTool({ 
  outfitPersonFile, 
  outfitPersonPreview, 
  outfitClothFile, 
  outfitClothPreview,
  outfitEdgeSmooth, 
  onEdgeSmoothChange,
  outfitBlend, 
  onBlendChange,
  onPersonUpload,
  onClothUpload,
  onRemovePerson,
  onRemoveCloth,
  onNextStep,
  hasInput
}) {
  return (
    <div className="workflow-content">
      <div className="step-indicator">
        <span className="current-step">步骤1/3</span>
        <span className="step-title">输入素材</span>
      </div>
      <div className="outfit-settings">
        <div className="outfit-setting">
          <label>🧑 人物图片</label>
          <div className="upload-area">
            {outfitPersonPreview ? (
              <div className="uploaded-preview">
                <img src={outfitPersonPreview} alt="Person" />
                <button className="remove-upload" onClick={onRemovePerson}>✕</button>
              </div>
            ) : (
              <label className="upload-label">
                <input type="file" accept="image/jpeg,image/png" onChange={onPersonUpload} className="upload-input" />
                <span className="upload-icon">🧑</span>
                <span>上传人物图片</span>
                <span className="upload-hint">JPG / PNG，最大20MB</span>
              </label>
            )}
          </div>
        </div>
        <div className="outfit-setting">
          <label>👗 服装图片</label>
          <div className="upload-area">
            {outfitClothPreview ? (
              <div className="uploaded-preview">
                <img src={outfitClothPreview} alt="Cloth" />
                <button className="remove-upload" onClick={onRemoveCloth}>✕</button>
              </div>
            ) : (
              <label className="upload-label">
                <input type="file" accept="image/jpeg,image/png" onChange={onClothUpload} className="upload-input" />
                <span className="upload-icon">👗</span>
                <span>上传服装图片</span>
                <span className="upload-hint">JPG / PNG，最大20MB</span>
              </label>
            )}
          </div>
        </div>
        <div className="outfit-setting">
          <label>✨ 边缘平滑度: {outfitEdgeSmooth}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={outfitEdgeSmooth} 
            onChange={(e) => onEdgeSmoothChange(Number(e.target.value))}
            className="edge-smooth-slider"
          />
          <span className="slider-hint">调整服装边缘的平滑程度</span>
        </div>
        <div className="outfit-setting">
          <label>🎨 融合程度: {outfitBlend}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={outfitBlend} 
            onChange={(e) => onBlendChange(Number(e.target.value))}
            className="blend-slider"
          />
          <span className="slider-hint">调整服装与人物的融合度</span>
        </div>
      </div>
      <div className="step-actions">
        <span className="step-hint">
          {outfitPersonPreview && outfitClothPreview ? '✓ 已准备好' : '请上传人物和服装图片'}
        </span>
        <button className="next-btn" onClick={onNextStep} disabled={!outfitPersonPreview || !outfitClothPreview}>
          进入步骤2 →
        </button>
      </div>
    </div>
  )
}

export default OutfitTool