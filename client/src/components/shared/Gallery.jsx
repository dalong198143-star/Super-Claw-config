import React, { useState, useEffect } from 'react'

const samples = [
  {
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    title: 'AI漫剧 · 急诊室的故事',
    tool: 'comic-drama',
  },
  {
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    title: 'AI 生成 · 动漫视频示例',
    tool: 'anime-video',
  },
  {
    type: 'image',
    url: 'https://s3.siliconflow.cn/temporary/outputs/demo-ai-art-1.png',
    title: 'AI 生成 · 动漫风格示例',
    tool: 'text-to-image',
  },
  {
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    title: 'AI 生成 · 图生视频示例',
    tool: 'image-to-video',
  },
]

function Gallery({ onSelectTool }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('creation_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved).slice(0, 8))
      } catch {}
    }
  }, [])

  const allItems = [...samples, ...history]

  const getToolName = (toolId) => {
    const toolMap = {
      'text-to-image': '文生图',
      'comic-drama': 'AI漫剧',
      'anime-video': '动漫视频',
      'image-to-video': '图生视频',
    }
    return toolMap[toolId] || toolId
  }

  return (
    <div className="tool-panel">
      <div className="tool-header">
        <h2>创作画廊</h2>
        <span className="tool-step">{history.length} 个作品</span>
      </div>

      <div className="tool-body">
        {allItems.length === 0 ? (
          <div className="gallery-empty">
            <p>还没有作品，选择一个工具开始创作吧！</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {allItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="gallery-card"
                onClick={() => item.tool && onSelectTool(item.tool)}
              >
                <div className="gallery-media">
                  {item.type === 'video' || item.resultType === 'video' ? (
                    <video src={item.url || item.resultUrl} muted loop
                      onMouseEnter={e => e.target.play()}
                      onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
                    />
                  ) : (
                    <img src={item.url || item.resultUrl} alt={item.title || item.prompt || '作品'} />
                  )}
                </div>
                <div className="gallery-info">
                  <span className="gallery-title">{item.title || item.prompt || '未命名作品'}</span>
                  <span className="gallery-tool">{getToolName(item.tool)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Gallery
