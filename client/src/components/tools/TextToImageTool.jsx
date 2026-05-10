import React from 'react';
import './TextToImageTool.css';
import { imageTemplates } from '../../data/promptTemplates';

function TextToImageTool({
  currentStep, setCurrentStep,
  prompt, setPrompt,
  negativePrompt, setNegativePrompt,
  optimizingPrompt, onOptimizePrompt,
  selectedStyle, setSelectedStyle,
  styles,
  params, setParam,
  isGenerating, progress,
  generatedImage, error,
  generate, reset, download,
  onChainToVideo,
}) {
  const totalSteps = 4;

  // Step 1: 输入提示词
  if (currentStep === 1) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>文生图</h2>
          <span className="tool-step">步骤 1/{totalSteps} · 描述画面</span>
        </div>
        <div className="tool-body">
          <div className="workflow-content">
            <div className="step-section">
              <label className="step-label">快速模板（点击填充）</label>
              <div className="template-chips">
                {imageTemplates.map(t => (
                  <button
                    key={t.label}
                    className="template-chip"
                    onClick={() => setPrompt(t.prompt)}
                    title={t.prompt}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

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
                  title="使用 AI 将中文描述优化为高质量英文绘画提示词"
                >
                  {optimizingPrompt ? '⏳ 优化中...' : '✨ AI 优化提示词'}
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
        </div>
        <div className="tool-footer">
          <button className="btn-primary" onClick={() => setCurrentStep(2)} disabled={!prompt.trim()}>
            下一步：选择风格 →
          </button>
        </div>
      </div>
    );
  }

  // Step 2: 选择风格
  if (currentStep === 2) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>文生图</h2>
          <span className="tool-step">步骤 2/{totalSteps} · 选择风格</span>
        </div>
        <div className="tool-body">
          <div className="workflow-content">
            <div className="step-section">
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
        </div>
        <div className="tool-footer">
          <button className="btn-back" onClick={() => setCurrentStep(1)}>← 返回</button>
          <button className="btn-primary" onClick={() => setCurrentStep(3)}>
            下一步：配置参数 →
          </button>
        </div>
      </div>
    );
  }

  const sizePresets = [
    { label: '512×512', width: 512, height: 512, desc: '方形' },
    { label: '768×768', width: 768, height: 768, desc: '高清方' },
    { label: '1024×1024', width: 1024, height: 1024, desc: '超清方' },
    { label: '512×768', width: 512, height: 768, desc: '竖版' },
    { label: '768×512', width: 768, height: 512, desc: '横版' },
    { label: '1024×576', width: 1024, height: 576, desc: '16:9' },
  ];

  const stepPresets = [
    { label: '20步', value: 20, desc: '快速' },
    { label: '30步', value: 30, desc: '标准' },
    { label: '40步', value: 40, desc: '高质量' },
    { label: '50步', value: 50, desc: '极致' },
  ];

  const guidancePresets = [
    { label: '5', value: 5, desc: '创意' },
    { label: '7.5', value: 7.5, desc: '标准' },
    { label: '10', value: 10, desc: '精细' },
    { label: '15', value: 15, desc: '严格' },
  ];

  const selSize = `${params.width}×${params.height}`;

  // Step 3: 配置参数
  if (currentStep === 3) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>文生图</h2>
          <span className="tool-step">步骤 3/{totalSteps} · 参数配置</span>
        </div>
        <div className="tool-body">
          <div className="workflow-content">
            <div className="step-section">
              <div className="param-group">
                <label className="step-label">图片尺寸</label>
                <div className="preset-chips">
                  {sizePresets.map(p => (
                    <button
                      key={p.label}
                      className={`preset-chip ${selSize === p.label ? 'active' : ''}`}
                      onClick={() => { setParam('width', p.width); setParam('height', p.height); }}
                    >
                      <span className="preset-label">{p.label}</span>
                      <span className="preset-desc">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="param-group">
                <label className="step-label">推理步数</label>
                <div className="preset-chips">
                  {stepPresets.map(p => (
                    <button
                      key={p.label}
                      className={`preset-chip ${params.steps === p.value ? 'active' : ''}`}
                      onClick={() => setParam('steps', p.value)}
                    >
                      <span className="preset-label">{p.label}</span>
                      <span className="preset-desc">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="param-group">
                <label className="step-label">引导系数（越大越贴近提示词）</label>
                <div className="preset-chips">
                  {guidancePresets.map(p => (
                    <button
                      key={p.label}
                      className={`preset-chip ${params.guidance === p.value ? 'active' : ''}`}
                      onClick={() => setParam('guidance', p.value)}
                    >
                      <span className="preset-label">{p.label}</span>
                      <span className="preset-desc">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="param-group">
                <label className="step-label">随机种子</label>
                <div className="seed-row">
                  <input type="number" placeholder="留空为随机"
                    value={params.seed === -1 ? '' : params.seed}
                    onChange={(e) => setParam('seed', e.target.value ? parseInt(e.target.value) : -1)}
                    className="seed-input" />
                  <button className="random-seed-btn"
                    onClick={() => setParam('seed', Math.floor(Math.random() * 99999999))}>
                    随机
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tool-footer">
          <button className="btn-back" onClick={() => setCurrentStep(2)}>← 返回</button>
          <button className="btn-primary" onClick={() => setCurrentStep(4)}>
            下一步：开始生成 →
          </button>
        </div>
      </div>
    );
  }

  // Step 4: 生成结果
  if (currentStep === 4) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>文生图</h2>
          <span className="tool-step">步骤 4/{totalSteps} · 生成图像</span>
        </div>
        <div className="tool-body">
          <div className="workflow-content">
            <div className="step-section">
              {!generatedImage && !isGenerating && !error && (
                <div className="generate-panel">
                  <div className="generate-summary">
                    <p>提示词: {prompt.substring(0, 100)}{prompt.length > 100 ? '...' : ''}</p>
                    <p>风格: {styles.find(s => s.id === selectedStyle)?.name || selectedStyle}</p>
                    <p>尺寸: {params.width}×{params.height} | 步数: {params.steps} | 引导: {params.guidance}</p>
                  </div>
                  <button className="btn-primary btn-large" onClick={generate}>
                    🎨 开始生成
                  </button>
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
                  <img src={generatedImage.url} alt="生成结果" className="result-image" />
                  <div className="result-actions">
                    <button className="btn-primary" onClick={() => onChainToVideo?.(generatedImage.url)}>
                      🎬 生成视频 →
                    </button>
                    <button className="btn-primary" onClick={download} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      📥 下载图片
                    </button>
                    <button className="btn-secondary" onClick={reset}>🔄 重新生成</button>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-panel">
                  <p className="error-message">生成失败: {error}</p>
                  <button className="btn-secondary" onClick={generate}>重试</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="tool-footer">
          <button className="btn-back" onClick={!isGenerating ? () => setCurrentStep(3) : undefined} disabled={isGenerating}>← 返回</button>
          {generatedImage && (
            <span className="step-hint">✅ 生成完成，可下载或重新生成</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default TextToImageTool;
