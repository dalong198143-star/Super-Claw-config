import React from 'react'

const tools = [
  { id: 'text-to-image', icon: '🖼️', name: '文生图', desc: '文字生成图片' },
  { id: 'image-to-video', icon: '🎬', name: '图生视频', desc: '图片生成视频' },
  { id: 'image-to-image', icon: '🔄', name: '图生图', desc: '图片变换风格' },
  { id: 'video-to-image', icon: '📹', name: '视频生图', desc: '视频提取图片' },
  { id: 'motion-transfer', icon: '🕺', name: '动作迁移', desc: '10秒快速/20秒高精度' },
  { id: 'outfit', icon: '👗', name: '换装', desc: '智能换装/边缘优化' },
  { id: 'upscale', icon: '🔧', name: '重绘洗图', desc: '去噪/增强/风格' },
  { id: 'video-join', icon: '🎬', name: '视频拼接', desc: '多段拼接成长视频' }
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
          <span className="tool-name">{tool.name}</span>
          <span className="tool-desc">{tool.desc}</span>
        </button>
      ))}
    </div>
  )
}

export default ToolSelector