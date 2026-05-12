import React, { useState, useEffect } from 'react'
import './ComicDramaTool.css'
import config from '../../config'

// 示例分镜数据结构（保留作为参考）
/*
const sampleStoryboard = {
  episode_id: 1,
  title: "急诊室的故事",
  scenes: [
    {
      scene_id: "S001",
      description: "在医院的走廊里，阳光透过窗户洒在疲惫的医生身上",
      characters: ["主角-李明", "配角-张医生"],
      duration: 5,
      shots: [
        {
          shot_id: 1,
          duration: 3,
          camera: "medium_shot",
          character: "主角-李明",
          prompt: "A handsome Chinese doctor Li Ming, ~30 yo, stethoscope, looking exhausted in a hospital corridor, dramatic lighting, 8K, cinematic. --ar 16:9",
          dialogue: "这已经是今天第几台手术了？我感到好累。"
        },
        {
          shot_id: 2,
          duration: 2,
          camera: "close_up",
          character: "主角-李明",
          prompt: "Close-up of Li Ming's tired face, sweat on forehead, emotional expression, soft lighting. --ar 16:9",
          dialogue: ""
        }
      ]
    },
    {
      scene_id: "S002",
      description: "急诊室内，医护人员忙碌地抢救病人",
      characters: ["主角-李明", "护士-小王"],
      duration: 8,
      shots: [
        {
          shot_id: 1,
          duration: 4,
          camera: "long_shot",
          character: "多人",
          prompt: "Busy emergency room, doctors and nurses working around a patient, medical equipment, intense atmosphere, cinematic composition. --ar 16:9",
          dialogue: "准备除颤器！血压下降！"
        }
      ]
    }
  ]
}
*/

function ComicDramaTool({
  onDownload,
  onReset,
}) {
  const [step, setStep] = useState(1)
  const [scriptText, setScriptText] = useState('')
  const [storyboard, setStoryboard] = useState(null)
  const [characters, setCharacters] = useState([])
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false)
  const [currentSceneIndex] = useState(0)
  const [generatedAssets, setGeneratedAssets] = useState({})
  
  // 批量生成状态
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchError, setBatchError] = useState(null)
  
  // 智能分集状态
  const [episodes, setEpisodes] = useState([])
  const [analyzingEpisodes, setAnalyzingEpisodes] = useState(false)
  const [episodeOptions, setEpisodeOptions] = useState({
    targetDurationPerEpisode: 300, // 每集5分钟
    maxEpisodes: 20,
    style: 'modern_anime',
  })
  const [selectedEpisodes, setSelectedEpisodes] = useState([]) // 用户选择要生成的集数
  
  // 成本预估状态
  const [costEstimate, setCostEstimate] = useState(null)
  const [showCostPreview, setShowCostPreview] = useState(false)
  
  // 断点续传状态
  const [projectId] = useState(() => {
    return 'comic-drama-' + Date.now()
  })
  const [autoSaveEnabled] = useState(true)
  
  // 快速模式开关（3步简化流程）
  const [quickMode, setQuickMode] = useState(false)

  // 视频合成状态
  const [videoSynthesizing, setVideoSynthesizing] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoError, setVideoError] = useState(null)
  const [videoResult, setVideoResult] = useState(null)

  // ============================================================
  // 断点续传辅助函数
  // ============================================================

  /**
   * 保存进度到localStorage
   */
  const saveProgress = (stepName, data) => {
    if (!autoSaveEnabled) return
    
    try {
      const key = `${projectId}-${stepName}`
      localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data
      }))
      console.log(`[AutoSave] 已保存 ${stepName}`)
    } catch (error) {
      console.error('[AutoSave] 保存失败:', error)
    }
  }

  /**
   * 从localStorage恢复进度
   */
  const restoreProgress = (stepName) => {
    try {
      const key = `${projectId}-${stepName}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const { timestamp, data } = JSON.parse(saved)
        // eslint-disable-next-line react-hooks/purity
        const age = Date.now() - timestamp
        const hours = Math.floor(age / (1000 * 60 * 60))
        
        if (hours < 24) { // 只恢复24小时内的数据
          console.log(`[AutoRestore] 恢复 ${stepName} (${hours}小时前)`)
          return data
        } else {
          console.log(`[AutoRestore] 数据过期，清除 ${stepName}`)
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('[AutoRestore] 恢复失败:', error)
    }
    return null
  }

  /**
   * 清除所有进度
   */
  const clearAllProgress = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(projectId)) {
          localStorage.removeItem(key)
        }
      })
      console.log('[AutoClear] 已清除所有进度')
    } catch (error) {
      console.error('[AutoClear] 清除失败:', error)
    }
  }

  /**
   * 自动重试函数（最多3次）
   */
  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error // 最后一次失败，抛出错误
        }
        
        const delay = baseDelay * Math.pow(2, i) // 指数退避
        console.warn(`[Retry] 第${i + 1}次失败，${delay}ms后重试...`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 快速模式：自动执行前置步骤
  useEffect(() => {
    if (step === 4 && quickMode && !storyboard && !batchGenerating) {
      const autoGenerate = async () => {
        setBatchGenerating(true)
        try {
          console.log('[QuickMode] 开始自动分集...')
          const episodeResponse = await retryWithBackoff(async () => {
            const res = await fetch(`${config.API_BASE_URL}/api/comic-drama/analyze-episodes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                script: scriptText,
                options: { targetDurationPerEpisode: 300, maxEpisodes: 5, style: 'modern_anime' }
              }),
            })
            if (!res.ok) throw new Error('分集失败')
            return await res.json()
          }, 3, 2000)

          console.log('[QuickMode] 分集完成:', episodeResponse.episodes.length, '集')
          setEpisodes(episodeResponse.episodes)
          setSelectedEpisodes(episodeResponse.episodes.map(ep => ep.episode_number))

          console.log('[QuickMode] 开始生成分镜...')
          const storyboardResponse = await retryWithBackoff(async () => {
            const res = await fetch(`${config.API_BASE_URL}/api/comic-drama/generate-episodes-storyboard`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                script: scriptText,
                episodes: [episodeResponse.episodes[0]],
                options: { style: 'modern_anime' }
              }),
            })
            if (!res.ok) throw new Error('分镜生成失败')
            return await res.json()
          }, 3, 2000)

          if (storyboardResponse.results && storyboardResponse.results[0].success) {
            setStoryboard(storyboardResponse.results[0].storyboard)
            console.log('[QuickMode] 分镜生成完成')
            const uniqueChars = new Set()
            storyboardResponse.results[0].storyboard.scenes.forEach(scene => {
              scene.characters.forEach(char => uniqueChars.add(char))
            })
            setCharacters(Array.from(uniqueChars).map(name => ({
              name, refImage: null, loraModel: null,
            })))
          }

          setBatchGenerating(false)
        } catch (error) {
          console.error('[QuickMode] 自动化流程失败:', error)
          setBatchError(`快速模式失败: ${error.message}`)
          setBatchGenerating(false)
        }
      }
      autoGenerate()
    }
  }, [step, quickMode, storyboard, batchGenerating, scriptText])

  // Step 1: 导入剧本
  if (step === 1) {
    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 1/6 · 导入剧本</span>
        </div>

        <div className="tool-body">
          {/* 快速模式切换 */}
          <div className="mode-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={quickMode}
                onChange={(e) => setQuickMode(e.target.checked)}
              />
              <span className="toggle-text">
                🚀 快速模式（3步简化流程）
              </span>
            </label>
            <p className="toggle-hint">
              {quickMode 
                ? '开启后：输入剧本 → 一键生成视频（自动处理分集/分镜/角色/TTS）'
                : '标准模式：6步详细流程，每步可手动调整'}
            </p>
          </div>

          <div className="step-section">
            <label className="step-label">粘贴剧本或小说片段</label>
            <textarea
              placeholder="在此粘贴你的剧本、小说章节或故事描述...&#10;&#10;例如：&#10;深夜，急诊室里灯火通明。已经连续工作十个小时的李明医生疲惫地靠在走廊的墙上..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={12}
              className="script-input"
            />
          </div>

          <div className="step-section">
            <label className="step-label">或上传文件（支持 TXT/PDF/Word）</label>
            <div className="upload-area">
              <input type="file" accept=".txt,.pdf,.doc,.docx" className="file-input" />
              <p className="upload-hint">拖拽文件到此处，或点击选择文件</p>
            </div>
          </div>

          {/* 断点续传提示 */}
          {(() => {
            const savedScript = restoreProgress('step1-script')
            if (savedScript && !scriptText) {
              return (
                <div className="resume-prompt">
                  <p>💾 检测到未完成的创作（{new Date(savedScript.timestamp).toLocaleString()}）</p>
                  <button 
                    className="btn-secondary btn-small"
                    onClick={() => {
                      setScriptText(savedScript.data.scriptText)
                      alert('✅ 已恢复之前的剧本')
                    }}
                  >
                    恢复进度
                  </button>
                  <button 
                    className="btn-link btn-small"
                    onClick={() => {
                      clearAllProgress()
                      alert('✅ 已清除所有进度')
                    }}
                  >
                    清除
                  </button>
                </div>
              )
            }
            return null
          })()}

          <div className="tool-actions">
            {!showCostPreview ? (
              <button 
                className="btn-secondary"
                onClick={async () => {
                  // 估算分集分析成本
                  const estimatedEpisodes = Math.ceil(scriptText.length / 5000)
                  const splitCost = (scriptText.length / 4 * 0.000001 + estimatedEpisodes * 200 * 0.000002).toFixed(4)
                  
                  // 估算后续步骤成本
                  const estimatedShots = Math.ceil(scriptText.length / 150)
                  const storyboardCost = (estimatedEpisodes * 0.05).toFixed(2)
                  const imageCost = (estimatedShots * 0.01).toFixed(2)
                  const ttsCost = (scriptText.length * 0.00016).toFixed(2)
                  const totalCost = (parseFloat(splitCost) * 7 + parseFloat(storyboardCost) + parseFloat(imageCost) + parseFloat(ttsCost)).toFixed(2)
                  
                  setCostEstimate({
                    splitAnalysis: (parseFloat(splitCost) * 7).toFixed(2),
                    storyboard: storyboardCost,
                    images: imageCost,
                    tts: ttsCost,
                    total: totalCost,
                    estimatedEpisodes,
                    estimatedShots,
                  })
                  setShowCostPreview(true)
                  
                  // 自动保存剧本
                  saveProgress('step1-script', { scriptText })
                }}
                disabled={!scriptText || scriptText.trim().length < 20}
              >
                💰 查看成本预估
              </button>
            ) : (
              <div className="cost-preview-panel">
                <h4>💰 预计总成本</h4>
                <div className="cost-breakdown">
                  <div className="cost-item">
                    <span>📚 分集分析 ({costEstimate.estimatedEpisodes}集)</span>
                    <span>¥{costEstimate.splitAnalysis}</span>
                  </div>
                  <div className="cost-item">
                    <span>🎬 分镜生成</span>
                    <span>¥{costEstimate.storyboard}</span>
                  </div>
                  <div className="cost-item">
                    <span>🖼️ 图像生成 ({costEstimate.estimatedShots}镜头)</span>
                    <span>¥{costEstimate.images}</span>
                  </div>
                  <div className="cost-item">
                    <span>🎙️ TTS配音</span>
                    <span>¥{costEstimate.tts}</span>
                  </div>
                  <hr/>
                  <div className="cost-item total">
                    <strong>总计</strong>
                    <strong>¥{costEstimate.total}</strong>
                  </div>
                </div>
                <div className="cost-actions">
                  <button 
                    className="btn-secondary btn-small"
                    onClick={() => setShowCostPreview(false)}
                  >
                    返回
                  </button>
                  <button 
                    className="btn-primary btn-large"
                    onClick={async () => {
                      // 保存进度
                      saveProgress('step1-script', { scriptText, quickMode })
                      
                      if (quickMode) {
                        // 快速模式：直接进入批量生成（跳过中间步骤）
                        setStep(4)
                      } else {
                        // 标准模式：进入智能分集
                        setStep(1.5)
                      }
                    }}
                  >
                    {quickMode ? '🚀 一键生成视频' : '确认并继续 →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Step 1.5: 智能分集分析
  if (step === 1.5) {
    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 1.5/6 · 智能分集</span>
        </div>

        <div className="tool-body">
          {!analyzingEpisodes && episodes.length === 0 && (
            <div className="episode-split-config">
              <h3>⚙️ 分集配置</h3>
              
              <div className="config-section">
                <label className="config-label">每集目标时长（秒）</label>
                <input
                  type="number"
                  value={episodeOptions.targetDurationPerEpisode}
                  onChange={(e) => setEpisodeOptions(prev => ({
                    ...prev,
                    targetDurationPerEpisode: parseInt(e.target.value) || 300
                  }))}
                  min="60"
                  max="1800"
                  className="config-input"
                />
                <p className="config-hint">建议：短剧180秒，标准300秒，长篇600秒</p>
              </div>

              <div className="config-section">
                <label className="config-label">最大分集数</label>
                <input
                  type="number"
                  value={episodeOptions.maxEpisodes}
                  onChange={(e) => setEpisodeOptions(prev => ({
                    ...prev,
                    maxEpisodes: parseInt(e.target.value) || 20
                  }))}
                  min="1"
                  max="50"
                  className="config-input"
                />
                <p className="config-hint">剧本长度：{scriptText.length}字符，预估约{Math.ceil(scriptText.length / 5000)}集</p>
              </div>

              <div className="config-section">
                <label className="config-label">动漫风格</label>
                <select
                  value={episodeOptions.style}
                  onChange={(e) => setEpisodeOptions(prev => ({ ...prev, style: e.target.value }))}
                  className="config-select"
                >
                  <option value="modern_anime">现代日漫</option>
                  <option value="ghibli">吉卜力风</option>
                  <option value="retro">复古风格</option>
                  <option value="cyberpunk">赛博朋克</option>
                  <option value="q_version">Q版可爱</option>
                  <option value="fantasy">奇幻风格</option>
                </select>
              </div>

              <div className="tool-actions">
                <button 
                  className="btn-primary btn-large"
                  onClick={async () => {
                    setAnalyzingEpisodes(true)
                    
                    try {
                      // 使用自动重试机制（最多3次，指数退避）
                      const data = await retryWithBackoff(async () => {
                        const response = await fetch(`${config.API_BASE_URL}/api/comic-drama/analyze-episodes`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            script: scriptText,
                            options: episodeOptions,
                          }),
                        })

                        if (!response.ok) {
                          const error = await response.json()
                          throw new Error(error.error || '分集分析失败')
                        }

                        return await response.json()
                      }, 3, 2000) // 最多3次重试，基础延迟2秒
                      
                      setEpisodes(data.episodes)
                      
                      // 默认全选所有集数
                      setSelectedEpisodes(data.episodes.map(ep => ep.episode_number))
                      
                      // 自动保存分集结果
                      saveProgress('step1.5-episodes', {
                        episodes: data.episodes,
                        selectedEpisodes: data.episodes.map(ep => ep.episode_number),
                        episodeOptions,
                      })
                      
                      alert(`✅ 分集完成！共${data.episodes.length}集，总时长${Math.round(data.totalDuration / 60)}分钟`)
                    } catch (error) {
                      console.error('分集分析错误:', error)
                      alert(`❌ 分集失败: ${error.message}\n\n提示：您可以稍后重试，或使用规则分集模式（无需LLM）`)
                    } finally {
                      setAnalyzingEpisodes(false)
                    }
                  }}
                  disabled={analyzingEpisodes}
                >
                  {analyzingEpisodes ? '🔄 分析中...' : '🚀 开始智能分集'}
                </button>
              </div>
            </div>
          )}

          {episodes.length > 0 && (
            <div className="episode-plan-preview">
              <h3>📋 分集方案预览</h3>
              
              <div className="episode-summary">
                <div className="summary-stat">
                  <span className="stat-value">{episodes.length}</span>
                  <span className="stat-label">总集数</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">{Math.round(episodes.reduce((sum, ep) => sum + ep.estimated_duration, 0) / 60)}</span>
                  <span className="stat-label">总时长(分钟)</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">{episodes.reduce((sum, ep) => sum + ep.estimated_shots, 0)}</span>
                  <span className="stat-label">总镜头数</span>
                </div>
              </div>

              <div className="episode-list">
                {episodes.map(ep => (
                  <div key={ep.episode_number} className="episode-card">
                    <div className="episode-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEpisodes.includes(ep.episode_number)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEpisodes(prev => [...prev, ep.episode_number])
                          } else {
                            setSelectedEpisodes(prev => prev.filter(n => n !== ep.episode_number))
                          }
                        }}
                      />
                    </div>
                    
                    <div className="episode-content">
                      <div className="episode-header">
                        <h4>第{ep.episode_number}集: {ep.title}</h4>
                        <span className={`climax-badge ${ep.climax_level}`}>
                          {ep.climax_level === 'high' ? '🔥 高潮' : ep.climax_level === 'medium' ? '⚡ 中等' : '💤 平缓'}
                        </span>
                      </div>
                      
                      <p className="episode-summary-text">{ep.summary}</p>
                      
                      <div className="episode-meta">
                        <span>⏱️ {ep.estimated_duration}秒</span>
                        <span>🎬 {ep.estimated_shots}镜头</span>
                        <span>👥 {ep.key_characters?.length || 0}角色</span>
                      </div>
                      
                      <div className="episode-hook">
                        <strong>悬念:</strong> {ep.hook}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="tool-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setEpisodes([])
                    setSelectedEpisodes([])
                  }}
                >
                  🔄 重新分集
                </button>
                <button 
                  className="btn-primary btn-large"
                  onClick={() => {
                    if (selectedEpisodes.length === 0) {
                      alert('请至少选择一集')
                      return
                    }
                    setStep(2)
                  }}
                  disabled={selectedEpisodes.length === 0}
                >
                  下一步：生成分镜 →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(1)}>← 返回</button>
        </div>
      </div>
    )
  }

  // Step 2: AI分析并生成分镜脚本
  if (step === 2) {
    const selectedEpisodeList = episodes.filter(ep => selectedEpisodes.includes(ep.episode_number))
    
    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 2/6 · 生成分镜</span>
        </div>

        <div className="tool-body">
          {!storyboard && !generatingStoryboard && (
            <div className="generate-section">
              <div className="preview-info">
                <h3>即将AI分析剧本</h3>
                <p>系统将为您选择的{selectedEpisodeList.length}集生成分镜脚本。</p>
                <ul className="param-list">
                  <li><strong>选中集数：</strong>{selectedEpisodeList.length} 集</li>
                  <li><strong>总镜头数：</strong>约 {selectedEpisodeList.reduce((sum, ep) => sum + ep.estimated_shots, 0)} 个</li>
                  <li><strong>处理时间：</strong>约 {selectedEpisodeList.length * 15}-30 秒</li>
                </ul>
              </div>
              <button 
                className="btn-primary btn-large" 
                onClick={async () => {
                  setGeneratingStoryboard(true)
                  
                  try {
                    // 调用批量分镜生成API
                    const response = await fetch(`${config.API_BASE_URL}/api/comic-drama/generate-episodes-storyboard`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        script: scriptText,
                        episodes: selectedEpisodeList,
                        options: { style: episodeOptions.style }
                      }),
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || '分镜生成失败')
                    }

                    const data = await response.json()
                    
                    // 使用第一集的分镜作为当前显示（后续可扩展为多集管理）
                    if (data.results && data.results.length > 0 && data.results[0].success) {
                      setStoryboard(data.results[0].storyboard)
                      
                      // 提取角色列表
                      const uniqueChars = new Set()
                      data.results[0].storyboard.scenes.forEach(scene => {
                        scene.characters.forEach(char => uniqueChars.add(char))
                      })
                      setCharacters(Array.from(uniqueChars).map(name => ({
                        name,
                        refImage: null,
                        loraModel: null,
                      })))
                      
                      alert(`✅ 分镜生成成功！共${data.successCount}集`)
                    } else {
                      throw new Error('分镜生成失败')
                    }
                  } catch (error) {
                    console.error('分镜生成错误:', error)
                    alert(`❌ 分镜生成失败: ${error.message}`)
                  } finally {
                    setGeneratingStoryboard(false)
                  }
                }}
                disabled={generatingStoryboard}
              >
                {generatingStoryboard ? '⏳ 生成中...' : '🚀 开始生成分镜'}
              </button>
            </div>
          )}

          {generatingStoryboard && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }} />
              </div>
              <span className="progress-text">60%</span>
              <p className="progress-hint">AI正在分析剧本结构...</p>
              <div className="progress-steps vertical">
                <div className="progress-step completed">✓ 文本预处理</div>
                <div className="progress-step completed">✓ 场景分割</div>
                <div className="progress-step active">⟳ 角色识别</div>
                <div className="progress-step">○ 生成分镜JSON</div>
                <div className="progress-step">○ 优化提示词</div>
              </div>
            </div>
          )}

          {storyboard && !generatingStoryboard && (
            <div className="storyboard-preview">
              <h3>✅ 分镜脚本生成成功</h3>
              <div className="storyboard-stats">
                <div className="stat-card">
                  <span className="stat-value">{storyboard.scenes.length}</span>
                  <span className="stat-label">场景数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{characters.length}</span>
                  <span className="stat-label">角色数</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">
                    {storyboard.scenes.reduce((sum, s) => sum + s.shots.length, 0)}
                  </span>
                  <span className="stat-label">镜头数</span>
                </div>
              </div>
              
              <div className="storyboard-tree">
                {storyboard.scenes.map((scene, _idx) => (
                  <div key={scene.scene_id} className="scene-node">
                    <div className="scene-header">
                      <span className="scene-id">{scene.scene_id}</span>
                      <span className="scene-desc">{scene.description.substring(0, 50)}...</span>
                      <span className="scene-shots">{scene.shots.length} 镜头</span>
                    </div>
                    <div className="shot-list">
                      {scene.shots.map(shot => (
                        <div key={shot.shot_id} className="shot-item">
                          <span className="shot-camera">{shot.camera}</span>
                          <span className="shot-dialogue">{shot.dialogue || '(无台词)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="tool-actions">
                <button className="btn-secondary" onClick={() => setStoryboard(null)}>
                  🔄 重新生成
                </button>
                <button className="btn-primary btn-large" onClick={() => setStep(3)}>
                  下一步：配置角色 →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(1.5)}>← 返回</button>
        </div>
      </div>
    )
  }

  // Step 3: 角色一致性配置
  if (step === 3) {
    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 3/6 · 角色配置</span>
        </div>

        <div className="tool-body">
          <div className="character-grid">
            {characters.map((char, idx) => (
              <div key={idx} className="character-card">
                <div className="character-avatar">
                  {char.image ? (
                    <img src={char.image} alt={char.name} />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </div>
                <div className="character-info">
                  <h4>{char.name}</h4>
                  <div className="character-controls">
                    <label className="upload-btn-small">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              const newChars = [...characters]
                              newChars[idx].image = ev.target.result
                              setCharacters(newChars)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      上传参考图
                    </label>
                    <select 
                      className="lora-select"
                      value={char.lora_model || ''}
                      onChange={(e) => {
                        const newChars = [...characters]
                        newChars[idx].lora_model = e.target.value
                        setCharacters(newChars)
                      }}
                    >
                      <option value="">选择LoRA模型</option>
                      <option value="anime-style-v1">动漫风格 v1</option>
                      <option value="realistic-portrait">写实人像</option>
                      <option value="chibi-character">Q版角色</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="consistency-options">
            <h3>一致性控制方案</h3>
            <div className="option-cards">
              <div className="option-card selected">
                <h4>🛡️ 三保险方案（推荐）</h4>
                <p>LoRA + IP-Adapter + ControlNet</p>
                <small>最稳定，适合长篇漫剧</small>
              </div>
              <div className="option-card">
                <h4>⚡ 快速方案</h4>
                <p>IP-Adapter + 高级提示词</p>
                <small>速度快，适合短篇</small>
              </div>
              <div className="option-card">
                <h4>🎨 基础方案</h4>
                <p>仅使用详细提示词</p>
                <small>最简单，效果一般</small>
              </div>
            </div>
          </div>

          <div className="tool-actions">
            <button className="btn-secondary" onClick={() => setStep(2)}>
              ← 返回上一步
            </button>
            <button className="btn-primary btn-large" onClick={() => setStep(4)}>
              下一步：生成资产 →
            </button>
          </div>
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(2)}>← 返回</button>
        </div>
      </div>
    )
  }

  // ============================================================
  // 批量图像生成功能
  // ============================================================
  
  /**
   * 批量生成所有镜头的图像
   */
  const handleBatchGenerate = async () => {
    if (!storyboard) return
    
    setBatchGenerating(true)
    setBatchProgress(0)
    setBatchError(null)

    try {
      // 收集所有镜头
      const allShots = []
      storyboard.scenes.forEach(scene => {
        scene.shots.forEach(shot => {
          allShots.push({
            shot_id: `${scene.scene_id}_${shot.shot_id}`,
            prompt: shot.prompt,
          })
        })
      })

      console.log(`开始批量生成 ${allShots.length} 张图像...`)

      // 调用后端API
      const response = await fetch(`${config.API_BASE_URL}/api/comic-drama/batch-generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shots: allShots,
          options: {
            width: 512,
            height: 512,
            steps: 30,
            guidance: 7.5,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '批量生成失败')
      }

      const result = await response.json()
      console.log('批量生成完成:', result)

      // 更新生成的资产
      const newAssets = {}
      result.results.forEach(item => {
        if (item.success) {
          newAssets[item.shotId] = {
            imageUrl: item.url,
            seed: item.seed,
            generatedAt: item.timestamp,
          }
        }
      })

      setGeneratedAssets(prev => ({ ...prev, ...newAssets }))
      setBatchProgress(100)

      // 显示错误信息（如果有）
      if (result.errors && result.errors.length > 0) {
        console.warn('部分镜头生成失败:', result.errors)
        setBatchError(`${result.failCount} 个镜头生成失败，请重试`)
      }
    } catch (error) {
      console.error('批量生成错误:', error)
      setBatchError(error.message)
    } finally {
      setBatchGenerating(false)
    }
  }

  /**
   * 生成单个镜头的图像
   */
  const handleGenerateSingleShot = async (sceneId, shot) => {
    const assetKey = `${sceneId}_${shot.shot_id}`
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/comic-drama/batch-generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shots: [{
            shot_id: assetKey,
            prompt: shot.prompt,
          }],
          options: {
            width: 512,
            height: 512,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '生成失败')
      }

      const result = await response.json()
      
      if (result.results && result.results[0] && result.results[0].success) {
        setGeneratedAssets(prev => ({
          ...prev,
          [assetKey]: {
            imageUrl: result.results[0].url,
            seed: result.results[0].seed,
            generatedAt: result.results[0].timestamp,
          },
        }))
      }
    } catch (error) {
      console.error('单镜头生成失败:', error)
      alert(`生成失败: ${error.message}`)
    }
  }

  if (step === 4) {
    const totalShots = storyboard ? storyboard.scenes.reduce((sum, s) => sum + s.shots.length, 0) : 0
    const completedShots = Object.keys(generatedAssets).length

    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 4/6 · 批量生成</span>
        </div>

        <div className="tool-body">
          <div className="generation-progress">
            <div className="progress-header">
              <h3>生成进度</h3>
              <span className="progress-ratio">{completedShots} / {totalShots} 镜头</span>
            </div>
            <div className="progress-bar large">
              <div 
                className="progress-fill" 
                style={{ width: `${(completedShots / totalShots) * 100}%` }} 
              />
            </div>
          </div>

          <div className="scene-carousel">
            {storyboard.scenes.map((scene, sceneIdx) => (
              <div 
                key={scene.scene_id} 
                className={`scene-panel ${sceneIdx === currentSceneIndex ? 'active' : ''}`}
              >
                <div className="scene-title">
                  {scene.scene_id} - {scene.description.substring(0, 40)}...
                </div>
                <div className="shots-grid">
                  {scene.shots.map((shot, _shotIdx) => {
                    const assetKey = `${scene.scene_id}_${shot.shot_id}`
                    const isGenerated = generatedAssets[assetKey]
                    
                    return (
                      <div key={shot.shot_id} className="shot-card">
                        <div className="shot-preview">
                          {isGenerated ? (
                            <img src={isGenerated.imageUrl} alt={`Shot ${shot.shot_id}`} />
                          ) : (
                            <div className="shot-placeholder">
                              <span className="shot-number">#{shot.shot_id}</span>
                              <span className="shot-camera-tag">{shot.camera}</span>
                            </div>
                          )}
                        </div>
                        <div className="shot-info">
                          <p className="shot-prompt-preview">{shot.prompt.substring(0, 60)}...</p>
                          {!isGenerated && (
                            <button 
                              className="btn-generate-shot"
                              onClick={() => handleGenerateSingleShot(scene.scene_id, shot)}
                              disabled={batchGenerating}
                            >
                              🖼️ 生成图像
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="batch-controls">
            {batchError && (
              <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem' }}>
                ⚠️ {batchError}
              </div>
            )}
            
            <button 
              className="btn-primary"
              onClick={handleBatchGenerate}
              disabled={completedShots === totalShots || batchGenerating}
            >
              {batchGenerating ? `生成中 ${batchProgress}%` : '🚀 批量生成全部'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setStep(5)}
              disabled={completedShots < totalShots}
            >
              下一步：合成视频 →
            </button>
          </div>
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(3)}>← 返回</button>
        </div>
      </div>
    )
  }

  /**
   * Step 5: 视频合成 - 调用后端FFmpeg管线
   */
  const handleVideoSynthesis = async () => {
    const assetKeys = Object.keys(generatedAssets)
    if (assetKeys.length === 0) {
      setVideoError('请先在步骤4中生成至少一张图像')
      return
    }

    setVideoSynthesizing(true)
    setVideoProgress(0)
    setVideoError(null)

    try {
      // 构建 shotKey → duration 查找表
      const shotDurationMap = {}
      storyboard.scenes.forEach(scene => {
        scene.shots.forEach(shot => {
          shotDurationMap[`${scene.scene_id}_${shot.shot_id}`] = shot.duration || 3
        })
      })

      const images = assetKeys.map(key => ({
        shotId: key,
        url: generatedAssets[key].imageUrl,
        duration: shotDurationMap[key] || 3,
      }))

      // 从分镜中提取台词和字幕（含时间码）
      const dialogues = []
      const subtitles = []
      let currentTime = 0

      storyboard.scenes.forEach(scene => {
        scene.shots.forEach(shot => {
          const shotKey = `${scene.scene_id}_${shot.shot_id}`
          const shotDuration = shot.duration || 3

          if (shot.dialogue) {
            dialogues.push({
              shotId: shotKey,
              text: shot.dialogue,
              character: shot.character || 'narrator',
            })
          }

          subtitles.push({
            shotId: shotKey,
            startTime: currentTime,
            endTime: currentTime + shotDuration,
            text: shot.dialogue || '',
            character: shot.character || '',
          })

          currentTime += shotDuration
        })
      })

      setVideoProgress(10)

      const response = await fetch(`${config.API_BASE_URL}/api/comic-drama/synthesize-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          dialogues,
          subtitles,
          options: {
            fps: 24,
            duration: 3,
            resolution: '1280x720',
            ttsEngine: 'azure',
          },
        }),
      })

      setVideoProgress(50)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '视频合成失败')
      }

      setVideoProgress(80)

      const data = await response.json()

      if (data.success) {
        const videoUrl = data.videoUrl.startsWith('http')
          ? data.videoUrl
          : `${config.API_BASE_URL}${data.videoUrl}`

        setVideoResult({ url: videoUrl })
        setVideoProgress(100)
      } else {
        throw new Error(data.error || '视频合成失败')
      }
    } catch (err) {
      console.error('视频合成失败:', err)
      setVideoError(err.message)
    } finally {
      setVideoSynthesizing(false)
    }
  }

  // Step 5: 音画同步与最终合成
  if (step === 5) {
    // 如果已经生成结果，直接进入 Step 6
    if (videoResult && !videoSynthesizing) {
      setStep(6)
      return null
    }

    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 5/6 · 最终合成</span>
        </div>

        <div className="tool-body">
          {!videoSynthesizing && !videoResult && (
            <div className="synthesis-panel">
              <h3>准备合成最终视频</h3>
              <div className="synthesis-checklist">
                <div className="check-item checked">
                  ✓ 分镜脚本 ({storyboard.scenes.length} 场景)
                </div>
                <div className="check-item checked">
                  ✓ 角色配置 ({characters.length} 角色)
                </div>
                <div className={`check-item ${Object.keys(generatedAssets).length > 0 ? 'checked' : 'pending'}`}>
                  {Object.keys(generatedAssets).length > 0 ? '✓' : '○'} 图像资产 ({Object.keys(generatedAssets).length} 镜头)
                </div>
                <div className="check-item pending">
                  ○ 音频生成 (TTS配音 + BGM)
                </div>
                <div className="check-item pending">
                  ○ 字幕生成 (SRT格式)
                </div>
                <div className="check-item pending">
                  ○ 视频合成 (FFmpeg渲染)
                </div>
              </div>

              <div className="audio-options">
                <h4>音频配置</h4>
                <div className="option-row">
                  <label>配音引擎：</label>
                  <select>
                    <option>Azure TTS (中文)</option>
                    <option>ElevenLabs (多语言)</option>
                    <option>本地Coqui TTS</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>背景音乐：</label>
                  <select>
                    <option>无背景音乐</option>
                    <option>上传自定义BGM</option>
                    <option>自动生成 (AI作曲)</option>
                  </select>
                </div>
              </div>

              <button
                className="btn-primary btn-large"
                onClick={handleVideoSynthesis}
                disabled={Object.keys(generatedAssets).length === 0}
              >
                🎬 开始最终合成
              </button>
              {Object.keys(generatedAssets).length === 0 && (
                <p style={{ color: '#f59e0b', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  ⚠️ 请先返回步骤4生成图像
                </p>
              )}
            </div>
          )}

          {videoSynthesizing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${videoProgress}%` }} />
              </div>
              <span className="progress-text">{videoProgress}%</span>
              <p className="progress-hint">正在合成最终视频...</p>
              <div className="progress-steps vertical">
                <div className={`progress-step ${videoProgress >= 20 ? 'completed' : ''}`}>✓ 生成TTS配音</div>
                <div className={`progress-step ${videoProgress >= 40 ? 'completed' : ''}`}>✓ 添加背景音乐</div>
                <div className={`progress-step ${videoProgress >= 60 ? 'completed' : ''}`}>✓ 生成字幕文件</div>
                <div className={`progress-step ${videoProgress >= 80 ? 'completed' : ''}`}>✓ FFmpeg视频合成</div>
                <div className={`progress-step ${videoProgress >= 100 ? 'completed' : ''}`}>✓ 渲染完成</div>
              </div>
            </div>
          )}

          {videoError && (
            <div className="error-section">
              <p className="error-text">❌ {videoError}</p>
              <button className="btn-secondary" onClick={handleVideoSynthesis}>重试</button>
            </div>
          )}
        </div>

        <div className="tool-footer">
          {!videoSynthesizing && <button className="btn-back" onClick={() => setStep(4)}>← 返回</button>}
        </div>
      </div>
    )
  }

  // Step 6: 结果展示与导出
  if (step === 6) {
    return (
      <div className="tool-panel comic-drama-panel">
        <div className="tool-header">
          <h2>🎭 AI漫剧制作</h2>
          <span className="tool-step">步骤 6/6 · 完成</span>
        </div>

        <div className="tool-body">
          {videoResult && (
            <div className="result-section">
              <video
                className="result-video large"
                src={videoResult.url}
                controls
                autoPlay
                loop
                muted
              />
              <div className="result-info">
                <h3>✅ 漫剧视频生成成功！</h3>
                <p>时长：{storyboard.scenes.reduce((sum, s) => sum + s.duration, 0)}秒 | 
                   场景：{storyboard.scenes.length} | 
                   镜头：{Object.keys(generatedAssets).length}</p>
              </div>
              <div className="result-actions">
                <button className="btn-primary" onClick={() => onDownload(videoResult.url)}>
                  📥 下载视频
                </button>
                <button className="btn-secondary" onClick={() => { onReset(); setStep(1); }}>
                  🔄 新建漫剧
                </button>
                <button className="btn-secondary" onClick={() => setStep(4)}>
                  ✏️ 修改分镜
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tool-footer">
          <button className="btn-back" onClick={() => setStep(5)}>← 返回</button>
        </div>
      </div>
    )
  }

  return null
}

export default ComicDramaTool
