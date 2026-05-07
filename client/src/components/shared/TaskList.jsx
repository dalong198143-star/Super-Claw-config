import React, { useState } from 'react'
import TaskCard from './TaskCard'

function TaskList({ tasks, onSelectTask, onSearch }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('difficulty_asc')

  const handleSearch = () => {
    onSearch(searchQuery, filterDifficulty, sortBy)
  }

  const handleReset = () => {
    setSearchQuery('')
    setFilterDifficulty('all')
    setSortBy('difficulty_asc')
    onSearch('', 'all', 'difficulty_asc')
  }

  const hasFilters = searchQuery || filterDifficulty !== 'all' || sortBy !== 'difficulty_asc'

  return (
    <div className="tasks-page">
      <h2>任务大厅</h2>
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="搜索任务..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            className="search-input"
          />
          <button className="search-btn" onClick={handleSearch}>搜索</button>
          {hasFilters && (
            <button className="reset-btn" onClick={handleReset}>重置</button>
          )}
        </div>
        <div className="filter-controls">
          <select 
            value={filterDifficulty} 
            onChange={(e) => {
              setFilterDifficulty(e.target.value)
              onSearch(searchQuery, e.target.value, sortBy)
            }}
            className="filter-select"
          >
            <option value="all">全部难度</option>
            <option value="1">1星</option>
            <option value="2">2星</option>
            <option value="3">3星</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => {
              setSortBy(e.target.value)
              onSearch(searchQuery, filterDifficulty, e.target.value)
            }}
            className="filter-select"
          >
            <option value="difficulty_asc">难度从低到高</option>
            <option value="difficulty_desc">难度从高到低</option>
            <option value="reward_asc">奖励从低到高</option>
            <option value="reward_desc">奖励从高到低</option>
          </select>
        </div>
      </div>
      <div className="tasks-grid">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
          ))
        ) : (
          <div className="no-tasks">
            <span className="no-tasks-icon">🔍</span>
            <p>没有找到匹配的任务</p>
            <button className="reset-btn" onClick={handleReset}>清除筛选</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskList