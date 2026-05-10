import React, { useState, useEffect } from 'react'

const HISTORY_KEY = 'creation_history'

const toolNames = {
  'comic-drama': 'AI漫剧',
  'anime-video': '动漫视频',
  'text-to-image': '文生图',
  'image-to-video': '图生视频',
  'motion-transfer': '动作迁移',
  'video-join': '视频拼接',
}

function CreationHistory({ onLoadCreation }) {
  const [history, setHistory] = useState([])
  const [filterTool, setFilterTool] = useState('all')

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const deleteRecord = (id) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  const filtered = history.filter(item => {
    if (filterTool !== 'all' && item.tool !== filterTool) return false
    return true
  })

  const formatTime = (ts) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="creation-history">
      <div className="history-header">
        <h3>📋 创作历史</h3>
        <select value={filterTool} onChange={(e) => setFilterTool(e.target.value)} className="filter-select">
          <option value="all">全部</option>
          <option value="text-to-image">文生图</option>
          <option value="image-to-video">图生视频</option>
          <option value="motion-transfer">动作迁移</option>
          <option value="video-join">视频拼接</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-history">暂无创作记录</p>
      ) : (
        <div className="history-list">
          {filtered.map(item => (
            <div key={item.id} className="history-item" onClick={() => onLoadCreation?.(item)}>
              <span className="tool-badge">{toolNames[item.tool] || item.tool}</span>
              <span className="time">{formatTime(item.timestamp)}</span>
              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteRecord(item.id) }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CreationHistory
