import React from 'react'

const tools = [
  { id: 'home', icon: '🏠', name: '首页', desc: '创作画廊', status: 'ready' },
  { id: 'comic-drama', icon: '🎭', name: 'AI漫剧', desc: '剧本→视频', status: 'ready' },
  { id: 'text-to-image', icon: '🖼️', name: '文生图', desc: '文字→图片', status: 'ready' },
  { id: 'image-to-video', icon: '🎥', name: '图生视频', desc: '图片→视频', status: 'ready' },
  { id: 'anime-video', icon: '🎬', name: '动漫视频', desc: '提示词→视频', status: 'ready' },
]

function ToolSelector({ selectedTool, onSelectTool }) {
  return (
    <div className="tool-grid">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-card ${selectedTool === tool.id ? 'selected' : ''}`}
          onClick={() => onSelectTool(tool.id)}
        >
          <span className="tool-icon">{tool.icon}</span>
          <span className="tool-name">
            {tool.name}
            {tool.status === 'dev' && (
              <span className="tool-badge-dev">开发中</span>
            )}
          </span>
          <span className="tool-desc">{tool.desc}</span>
        </button>
      ))}
    </div>
  )
}

export default ToolSelector
