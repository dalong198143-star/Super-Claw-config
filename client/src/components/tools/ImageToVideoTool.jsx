import React, { useState } from 'react'
import { videoMotionTemplates } from '../../data/promptTemplates'

function ImageToVideoTool({
  image,
  onImageUpload,
  onRemoveImage,
  onGenerate,
  isGenerating,
  progress,
  result,
  error,
  onDownload,
  onReset,
  params,
  onParamChange,
}) {
  const [step, setStep] = useState(1)

  // Step 1: 上传图片
  if (step === 1) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>图生视频</h2>
          <span className="tool-step">步骤 1/3 · 上传图片</span>
        </div>

        <div className="tool-body">
          {image ? (
            <div className="preview-box">
              <img src={image} alt="预览" className="preview-image" />
              <button className="btn-remove" onClick={() => { onRemoveImage(); }}>✕ 移除</button>
            </div>
          ) : (
            <label className="upload-box">
              <input type="file" accept="image/*" onChange={onImageUpload} hidden />
              <span className="upload-icon">📷</span>
              <span className="upload-text">点击上传图片</span>
              <span className="upload-hint">支持 JPG / PNG / WebP，最大 5MB</span>
            </label>
          )}

          {image && (
            <div className="tool-actions">
              <button className="btn-primary" onClick={() => setStep(2)}>
                下一步：配置参数 →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 2: 配置参数 + 生成视频
  if (step === 2) {
    const hasStarted = isGenerating || progress > 0 || result || error

    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>图生视频</h2>
          <span className="tool-step">步骤 2/3 · 配置 & 生成</span>
        </div>

        <div className="tool-body">
          <div className="preview-box mini">
            <img src={image} alt="源图" className="preview-image-small" />
            <span className="preview-label">源图</span>
          </div>

          {!hasStarted && (
            <div className="workflow-content">
              <div className="step-section">
                <label className="step-label">视频时长</label>
                <div className="style-grid">
                  {[
                    { id: '2s', name: '2 秒', desc: '快速生成' },
                    { id: '5s', name: '5 秒', desc: '标准时长' },
                    { id: '8s', name: '8 秒', desc: '更长故事' },
                  ].map(opt => (
                    <div
                      key={opt.id}
                      className={`style-card ${params.duration === opt.id ? 'selected' : ''}`}
                      onClick={() => onParamChange('duration', opt.id)}
                    >
                      <div className="style-card-check">{params.duration === opt.id ? '✓' : ''}</div>
                      <div className="style-card-name">{opt.name}</div>
                      <div className="style-card-desc">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <label className="step-label">分辨率</label>
                <div className="style-grid">
                  {[
                    { id: '720p', name: '720P', desc: '1280×720 高清' },
                    { id: '1080p', name: '1080P', desc: '1920×1080 全高清' },
                  ].map(opt => (
                    <div
                      key={opt.id}
                      className={`style-card ${params.resolution === opt.id ? 'selected' : ''}`}
                      onClick={() => onParamChange('resolution', opt.id)}
                    >
                      <div className="style-card-check">{params.resolution === opt.id ? '✓' : ''}</div>
                      <div className="style-card-name">{opt.name}</div>
                      <div className="style-card-desc">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <label className="step-label">运动模板（点击填充）</label>
                <div className="template-chips">
                  {videoMotionTemplates.map(t => (
                    <button
                      key={t.label}
                      className="template-chip"
                      onClick={() => onParamChange('prompt', t.prompt)}
                      title={t.prompt}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <label className="step-label">运动描述（可选）</label>
                <input
                  type="text"
                  placeholder="描述图片中该如何运动，如：花瓣随风飘落、人物转头微笑..."
                  value={params.prompt}
                  onChange={(e) => onParamChange('prompt', e.target.value)}
                  className="negative-input"
                />
              </div>

              <div className="tool-actions">
                <button className="btn-primary btn-large" onClick={onGenerate}>
                  🎬 开始生成视频
                </button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{progress}%</span>
              <p className="progress-hint">AI 正在生成视频，请稍候...</p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="generate-section">
              <p className="generate-hint">✅ 视频生成完成！</p>
              <button className="btn-primary btn-large" onClick={() => setStep(3)}>
                👀 查看视频 →
              </button>
            </div>
          )}

          {error && (
            <div className="error-section">
              <p className="error-text">❌ {error}</p>
              <button className="btn-secondary" onClick={onGenerate}>重试</button>
            </div>
          )}
        </div>

        <div className="tool-footer">
          {!isGenerating && (
            <button className="btn-back" onClick={() => setStep(1)}>← 返回</button>
          )}
        </div>
      </div>
    )
  }

  // Step 3: 结果预览
  if (step === 3) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>图生视频</h2>
          <span className="tool-step">步骤 3/3 · 预览保存</span>
        </div>

        <div className="tool-body">
          {result && (
            <div className="result-section">
              <video
                className="result-video"
                src={result.url}
                controls
                autoPlay
                loop
                muted
              />
              <div className="result-actions">
                <button className="btn-primary" onClick={() => onDownload(result.url)}>
                  📥 下载视频
                </button>
                <button className="btn-secondary" onClick={() => { onReset(); setStep(1); }}>
                  🔄 重新生成
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(2)}>← 返回</button>
        </div>
      </div>
    )
  }

  return null
}

export default ImageToVideoTool
