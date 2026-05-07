import React, { useState, useEffect } from 'react'

function CreationHistory({ userId, onLoadCreation }) {
  const [history, setHistory] = useState([])
  const [filterTool, setFilterTool] = useState('all')
  const [filterDate, setFilterDate] = useState('all')

  // 加载历史记录
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`creation_history_${userId}`)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    }
  }, [userId])

  // 保存新记录
  const addToHistory = (creation) => {
    const newRecord = {
      id: Date.now(),
      ...creation,
      timestamp: new Date().toISOString(),
      userId
    }
    
    const updated = [newRecord, ...history].slice(0, 50) // 最多保留50条
    setHistory(updated)
    localStorage.setItem(`creation_history_${userId}`, JSON.stringify(updated))
  }

  // 删除记录
  const deleteRecord = (id) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem(`creation_history_${userId}`, JSON.stringify(updated))
  }

  // 筛选逻辑
  const filteredHistory = history.filter(item => {
    if (filterTool !== 'all' && item.tool !== filterTool) return false
    if (filterDate !== 'all') {
      const itemDate = new Date(item.timestamp).toDateString()
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      
      if (filterDate === 'today' && itemDate !== today) return false
      if (filterDate === 'yesterday' && itemDate !== yesterday) return false
      if (filterDate === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 86400000)
        if (new Date(item.timestamp) < weekAgo) return false
      }
    }
    return true
  })

  // 工具名称映射
  const toolNames = {
    'text-to-image': '文生图',
    'image-to-video': '图生视频',
    'motion-transfer': '动作迁移',
    'outfit': '换装',
    'upscale': '重绘洗图',
    'video-join': '视频拼接'
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="creation-history">
      <div className="history-header">
        <h3>📚 创作历史</h3>
        <div className="history-filters">
          <select 
            value={filterTool} 
            onChange={(e) => setFilterTool(e.target.value)}
            className="filter-select"
          >
            <option value="all">全部工具</option>
            <option value="text-to-image">文生图</option>
            <option value="image-to-video">图生视频</option>
            <option value="motion-transfer">动作迁移</option>
            <option value="outfit">换装</option>
            <option value="upscale">重绘洗图</option>
            <option value="video-join">视频拼接</option>
          </select>
          
          <select 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            className="filter-select"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="yesterday">昨天</option>
            <option value="week">最近7天</option>
          </select>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-history">
          <p>暂无创作记录</p>
          <p className="hint">开始使用AI工具进行创作吧！</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map(item => (
            <div key={item.id} className="history-item">
              <div className="history-preview">
                {item.resultType === 'image' ? (
                  <img src={item.resultUrl} alt="创作结果" />
                ) : item.resultType === 'video' ? (
                  <video src={item.resultUrl} controls />
                ) : (
                  <div className="placeholder">📄</div>
                )}
              </div>
              
              <div className="history-info">
                <div className="history-meta">
                  <span className="tool-badge">{toolNames[item.tool] || item.tool}</span>
                  <span className="time">{formatTime(item.timestamp)}</span>
                </div>
                
                {item.prompt && (
                  <p className="history-prompt" title={item.prompt}>
                    {item.prompt.substring(0, 50)}{item.prompt.length > 50 ? '...' : ''}
                  </p>
                )}
                
                <div className="history-actions">
                  <button 
                    className="load-btn"
                    onClick={() => onLoadCreation && onLoadCreation(item)}
                  >
                    重新加载
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteRecord(item.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CreationHistory
