import React from 'react';
import './TextToImageTool.css';

function TextToImageTool({
  currentStep,
  prompt, setPrompt,
  negativePrompt, setNegativePrompt,
  optimizingPrompt, onOptimizePrompt,
  selectedStyle, setSelectedStyle,
  styles,
  params, setParam,
  isGenerating, progress,
  generatedImage, error,
  generate, reset, download,
}) {
  // Step 1: 输入提示词
  if (currentStep === 1) {
    return (
      <div className="workflow-content">
        <div className="step-section">
          <label className="step-label">正向提示词</label>
          <textarea
            placeholder="描述你想要生成的图像，例如：一只小猫在花园里玩耍..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="prompt-input"
            rows={4}
          />
          <div className="prompt-actions">
            <button
              className="optimize-btn"
              onClick={onOptimizePrompt}
              disabled={optimizingPrompt || !prompt.trim()}
              title="使用 DeepSeek AI 将中文描述优化为高质量英文绘画提示词"
            >
              {optimizingPrompt ? '⏳ 优化中...' : 'AI 优化提示词'}
            </button>
            <span className="step-hint">
              {prompt.trim() ? '✓ 已输入' : '⚠ 请输入提示词'}
            </span>
          </div>
        </div>

        <div className="step-section">
          <label className="step-label">负向提示词（可选）</label>
          <input
            type="text"
            placeholder="不想出现的内容，如：blurry, low quality, distorted..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="negative-input"
          />
        </div>
      </div>
    );
  }

  // Step 2: 选择风格
  if (currentStep === 2) {
    return (
      <div className="workflow-content">
        <div className="step-section">
          <label className="step-label">选择风格</label>
          <div className="style-grid">
            {styles.map(style => (
              <div
                key={style.id}
                className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="style-card-check">
                  {selectedStyle === style.id ? '✓' : ''}
                </div>
                <div className="style-card-name">{style.name}</div>
                <div className="style-card-desc">{style.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 配置参数
  if (currentStep === 3) {
    return (
      <div className="workflow-content">
        <div className="step-section">
          <label className="step-label">参数配置</label>

          <div className="param-group">
            <div className="param-row">
              <span>图片宽度</span>
              <input
                type="range"
                min="256"
                max="1024"
                step="64"
                value={params.width}
                onChange={(e) => setParam('width', parseInt(e.target.value))}
              />
              <span className="param-value">{params.width}px</span>
            </div>

            <div className="param-row">
              <span>图片高度</span>
              <input
                type="range"
                min="256"
                max="1024"
                step="64"
                value={params.height}
                onChange={(e) => setParam('height', parseInt(e.target.value))}
              />
              <span className="param-value">{params.height}px</span>
            </div>

            <div className="param-row">
              <span>推理步数</span>
              <input
                type="range"
                min="20"
                max="50"
                step="5"
                value={params.steps}
                onChange={(e) => setParam('steps', parseInt(e.target.value))}
              />
              <span className="param-value">{params.steps}步</span>
            </div>

            <div className="param-row">
              <span>引导系数</span>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={params.guidance}
                onChange={(e) => setParam('guidance', parseFloat(e.target.value))}
              />
              <span className="param-value">{params.guidance}</span>
            </div>

            <div className="param-row seed-row">
              <span>随机种子</span>
              <input
                type="number"
                placeholder="留空为随机"
                value={params.seed === -1 ? '' : params.seed}
                onChange={(e) => setParam('seed', e.target.value ? parseInt(e.target.value) : -1)}
                className="seed-input"
              />
              <button
                className="random-seed-btn"
                onClick={() => setParam('seed', Math.floor(Math.random() * 99999999))}
              >
                随机
              </button>
            </div>
          </div>

          <div className="param-hint">
            更高步数和引导系数可提升质量，但生成时间更长。推荐 512×512 / 30步 / 7.5
          </div>
        </div>
      </div>
    );
  }

  // Step 4: 生成结果
  if (currentStep === 4) {
    return (
      <div className="workflow-content">
        <div className="step-section">
          <label className="step-label">图像生成</label>

          {!generatedImage && !isGenerating && !error && (
            <div className="generate-panel">
              <div className="generate-summary">
                <p>提示词: {prompt.substring(0, 100)}{prompt.length > 100 ? '...' : ''}</p>
                <p>风格: {styles.find(s => s.id === selectedStyle)?.name || selectedStyle}</p>
                <p>尺寸: {params.width}×{params.height} | 步数: {params.steps} | 引导: {params.guidance}</p>
              </div>
              <button className="generate-btn" onClick={generate}>
                开始生成
              </button>
              <div className="generate-model">模型: flux-schnell (Replicate)</div>
            </div>
          )}

          {isGenerating && (
            <div className="generating-panel">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">
                {progress < 100 ? `生成中... ${progress}%` : '处理中...'}
              </div>
            </div>
          )}

          {generatedImage && (
            <div className="result-panel">
              <div className="result-image-wrapper">
                <img src={generatedImage.url} alt="生成结果" className="result-image" />
              </div>
              <div className="result-actions">
                <button className="regenerate-btn" onClick={reset}>重新生成</button>
                <button className="download-btn" onClick={download}>下载图片</button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-panel">
              <p className="error-message">生成失败: {error}</p>
              <button className="retry-btn" onClick={generate}>重试</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default TextToImageTool;
