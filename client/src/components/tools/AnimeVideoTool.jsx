import React, { useState } from 'react'
import { imageTemplates, videoMotionTemplates } from '../../data/promptTemplates'
import './TextToImageTool.css'

function AnimeVideoTool({
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
  const [generatedImage, setGeneratedImage] = useState(null)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)

  // Step 1: 输入提示词和选择风格
  if (step === 1) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>🎬 AI动漫视频生成</h2>
          <span className="tool-step">步骤 1/4 · 创意构思</span>
        </div>

        <div className="tool-body">
          <div className="step-section">
            <label className="step-label">视频描述（提示词）</label>
            <textarea
              placeholder="详细描述你想要的动漫场景，例如：一个穿着粉色裙子的魔法少女在樱花树下施展魔法..."
              value={params.prompt}
              onChange={(e) => onParamChange('prompt', e.target.value)}
              rows={4}
              className="negative-input"
            />
          </div>

          <div className="step-section">
            <label className="step-label">负面提示词（可选）</label>
            <input
              type="text"
              placeholder="不希望出现的内容，如：low quality, blurry, deformed..."
              value={params.negativePrompt || ''}
              onChange={(e) => onParamChange('negativePrompt', e.target.value)}
              className="negative-input"
            />
          </div>

          <div className="step-section">
            <label className="step-label">动漫风格模板</label>
            <div className="style-grid">
              {[
                { id: 'anime-ghibli', name: '🎨 吉卜力风', desc: '宫崎骏风格，温暖治愈' },
                { id: 'anime-modern', name: '✨ 现代日漫', desc: '精致线条，鲜艳色彩' },
                { id: 'anime-retro', name: '🌸 复古动漫', desc: '90年代经典风格' },
                { id: 'anime-chibi', name: '🎭 Q版萌系', desc: '可爱大头娃娃' },
                { id: 'anime-cyberpunk', name: '🌃 赛博朋克', desc: '未来科技风' },
                { id: 'anime-fantasy', name: '🏰 奇幻冒险', desc: '魔法世界风格' },
              ].map(opt => (
                <div
                  key={opt.id}
                  className={`style-card ${params.style === opt.id ? 'selected' : ''}`}
                  onClick={() => onParamChange('style', opt.id)}
                >
                  <div className="style-card-check">{params.style === opt.id ? '✓' : ''}</div>
                  <div className="style-card-name">{opt.name}</div>
                  <div className="style-card-desc">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="tool-actions">
            <button 
              className="btn-primary btn-large" 
              onClick={() => setStep(2)}
              disabled={!params.prompt || params.prompt.trim().length < 5}
            >
              下一步：配置参数 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: 配置视频参数
  if (step === 2) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>🎬 AI动漫视频生成</h2>
          <span className="tool-step">步骤 2/4 · 参数配置</span>
        </div>

        <div className="tool-body">
          <div className="workflow-content">
            <div className="step-section">
              <label className="step-label">视频时长</label>
              <div className="style-grid">
                {[
                  { id: '3s', name: '3 秒', desc: '短视频片段' },
                  { id: '5s', name: '5 秒', desc: '标准时长' },
                  { id: '8s', name: '8 秒', desc: '完整场景' },
                  { id: '10s', name: '10 秒', desc: '长镜头' },
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
              <label className="step-label">帧率 (FPS)</label>
              <div className="style-grid">
                {[
                  { id: '12', name: '12 FPS', desc: '传统动画感' },
                  { id: '24', name: '24 FPS', desc: '电影标准' },
                  { id: '30', name: '30 FPS', desc: '流畅播放' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    className={`style-card ${params.fps === opt.id ? 'selected' : ''}`}
                    onClick={() => onParamChange('fps', opt.id)}
                  >
                    <div className="style-card-check">{params.fps === opt.id ? '✓' : ''}</div>
                    <div className="style-card-name">{opt.name}</div>
                    <div className="style-card-desc">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-section">
              <label className="step-label">运动强度</label>
              <div className="style-grid">
                {[
                  { id: 'low', name: '🌊 轻微', desc: '柔和缓慢' },
                  { id: 'medium', name: '💫 中等', desc: '自然流畅' },
                  { id: 'high', name: '🔥 强烈', desc: '动感十足' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    className={`style-card ${params.motionIntensity === opt.id ? 'selected' : ''}`}
                    onClick={() => onParamChange('motionIntensity', opt.id)}
                  >
                    <div className="style-card-check">{params.motionIntensity === opt.id ? '✓' : ''}</div>
                    <div className="style-card-name">{opt.name}</div>
                    <div className="style-card-desc">{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-section">
              <label className="step-label">镜头运动</label>
              <div className="style-grid">
                {[
                  { id: 'static', name: '📷 固定镜头', desc: '无摄像机移动' },
                  { id: 'zoom-in', name: '🔍 推近', desc: '缓慢推进' },
                  { id: 'zoom-out', name: '🔭 拉远', desc: '逐渐远离' },
                  { id: 'pan-left', name: '⬅️ 左移', desc: '水平左移' },
                  { id: 'pan-right', name: '➡️ 右移', desc: '水平右移' },
                  { id: 'orbit', name: '🔄 环绕', desc: '环绕主体' },
                ].map(opt => (
                  <div
                    key={opt.id}
                    className={`style-card ${params.cameraMovement === opt.id ? 'selected' : ''}`}
                    onClick={() => onParamChange('cameraMovement', opt.id)}
                  >
                    <div className="style-card-check">{params.cameraMovement === opt.id ? '✓' : ''}</div>
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
                    onClick={() => onParamChange('motionPrompt', t.prompt)}
                    title={t.prompt}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="step-section">
              <label className="step-label">自定义运动描述（可选）</label>
              <input
                type="text"
                placeholder="描述画面中的动态效果，如：樱花飘落、人物转身、魔法光效..."
                value={params.motionPrompt || ''}
                onChange={(e) => onParamChange('motionPrompt', e.target.value)}
                className="negative-input"
              />
            </div>

            <div className="step-section">
              <label className="step-label">种子值（可选，留空随机）</label>
              <input
                type="number"
                placeholder="输入数字以复现相同结果"
                value={params.seed || ''}
                onChange={(e) => onParamChange('seed', e.target.value)}
                className="negative-input"
              />
            </div>
          </div>

          <div className="tool-actions">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              ← 返回上一步
            </button>
            <button className="btn-primary btn-large" onClick={() => setStep(3)}>
              下一步：生成图片 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: 生成首帧图片
  if (step === 3) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>🎬 AI动漫视频生成</h2>
          <span className="tool-step">步骤 3/4 · 生成首帧</span>
        </div>

        <div className="tool-body">
          {!generatedImage && !imageGenerating && (
            <div className="generate-section">
              <div className="preview-info">
                <h3>即将生成首帧图片</h3>
                <p>基于您的提示词和参数设置，AI将先生成一张高质量的动漫风格图片作为视频的首帧。</p>
                <ul className="param-list">
                  <li><strong>提示词：</strong>{params.prompt}</li>
                  <li><strong>风格：</strong>{params.style}</li>
                  <li><strong>分辨率：</strong>{params.resolution}</li>
                </ul>
              </div>
              <button 
                className="btn-primary btn-large" 
                onClick={async () => {
                  setImageGenerating(true)
                  setImageProgress(0)
                  // 模拟图片生成过程
                  for (let i = 0; i <= 100; i += 5) {
                    await new Promise(r => setTimeout(r, 100))
                    setImageProgress(i)
                  }
                  // 这里应该调用真实的API，现在使用占位图
                  setGeneratedImage(`https://picsum.photos/seed/${Date.now()}/1024/768`)
                  setImageGenerating(false)
                }}
              >
                🎨 生成首帧图片
              </button>
            </div>
          )}

          {imageGenerating && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${imageProgress}%` }} />
              </div>
              <span className="progress-text">{imageProgress}%</span>
              <p className="progress-hint">AI 正在绘制首帧图片...</p>
            </div>
          )}

          {generatedImage && !imageGenerating && (
            <div className="result-section">
              <div className="preview-box">
                <img src={generatedImage} alt="首帧预览" className="preview-image" />
              </div>
              <div className="result-actions">
                <button className="btn-secondary" onClick={() => setGeneratedImage(null)}>
                  🔄 重新生成
                </button>
                <button className="btn-primary btn-large" onClick={() => setStep(4)}>
                  🎬 生成视频 →
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

  // Step 4: 生成视频并展示结果
  if (step === 4) {
    return (
      <div className="tool-panel">
        <div className="tool-header">
          <h2>🎬 AI动漫视频生成</h2>
          <span className="tool-step">步骤 4/4 · 视频生成</span>
        </div>

        <div className="tool-body">
          <div className="preview-box mini">
            <img src={generatedImage} alt="首帧" className="preview-image-small" />
            <span className="preview-label">首帧参考</span>
          </div>

          {!isGenerating && !result && !error && (
            <div className="generate-section">
              <div className="preview-info">
                <h3>准备生成视频</h3>
                <p>AI将基于首帧图片和运动参数，生成一段{params.duration}的动漫视频。</p>
                <ul className="param-list">
                  <li><strong>时长：</strong>{params.duration}</li>
                  <li><strong>帧率：</strong>{params.fps} FPS</li>
                  <li><strong>运动强度：</strong>{params.motionIntensity}</li>
                  <li><strong>镜头：</strong>{params.cameraMovement}</li>
                  {params.motionPrompt && <li><strong>运动描述：</strong>{params.motionPrompt}</li>}
                </ul>
              </div>
              <button className="btn-primary btn-large" onClick={onGenerate}>
                🚀 开始生成视频
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{progress}%</span>
              <p className="progress-hint">AI 正在生成视频，这可能需要几分钟...</p>
              <div className="progress-steps">
                <div className={`progress-step ${progress >= 20 ? 'completed' : ''}`}>✓ 分析首帧</div>
                <div className={`progress-step ${progress >= 50 ? 'completed' : ''}`}>✓ 生成关键帧</div>
                <div className={`progress-step ${progress >= 80 ? 'completed' : ''}`}>✓ 插值补帧</div>
                <div className={`progress-step ${progress >= 100 ? 'completed' : ''}`}>✓ 渲染输出</div>
              </div>
            </div>
          )}

          {result && !isGenerating && (
            <div className="result-section">
              <video
                className="result-video"
                src={result.url}
                controls
                autoPlay
                loop
                muted
              />
              <div className="result-info">
                <h3>✅ 视频生成成功！</h3>
                <p>时长：{params.duration} | 分辨率：{params.resolution} | 帧率：{params.fps} FPS</p>
              </div>
              <div className="result-actions">
                <button className="btn-primary" onClick={() => onDownload(result.url)}>
                  📥 下载视频
                </button>
                <button className="btn-secondary" onClick={() => { onReset(); setStep(1); setGeneratedImage(null); }}>
                  🔄 重新创作
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <p className="error-text">❌ {error}</p>
              <div className="result-actions">
                <button className="btn-secondary" onClick={onGenerate}>重试</button>
                <button className="btn-back" onClick={() => setStep(3)}>返回修改</button>
              </div>
            </div>
          )}
        </div>

        <div className="tool-footer">
          {!isGenerating && <button className="btn-back" onClick={() => setStep(3)}>← 返回</button>}
        </div>
      </div>
    )
  }

  return null
}

export default AnimeVideoTool
