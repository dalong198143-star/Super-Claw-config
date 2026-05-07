import React from 'react'

function TaskCard({ task, onSelect }) {
  return (
    <div 
      key={task.id} 
      className="task-card" 
      onClick={() => onSelect(task)}
    >
      <div className="task-header">
        <span className="difficulty">{task.difficulty}星</span>
        <span className="reward">{task.reward}元</span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <button className="start-btn">开始任务</button>
    </div>
  )
}

export default TaskCard