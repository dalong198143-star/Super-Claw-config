import React, { useState } from 'react'
import INTERNAL_USERS from '../../config/internalUsers'

function UserSwitcher({ currentUser, onUserChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleUserSelect = (user) => {
    onUserChange(user)
    setIsOpen(false)
    // 保存到 localStorage
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  return (
    <div className="user-switcher">
      <button 
        className="current-user-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="切换用户"
      >
        <span className="user-avatar">{currentUser.avatar}</span>
        <span className="user-name">{currentUser.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">选择用户</div>
          {INTERNAL_USERS.map(user => (
            <button
              key={user.id}
              className={`user-option ${currentUser.id === user.id ? 'active' : ''}`}
              onClick={() => handleUserSelect(user)}
            >
              <span className="user-avatar">{user.avatar}</span>
              <span className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </span>
              {currentUser.id === user.id && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserSwitcher
