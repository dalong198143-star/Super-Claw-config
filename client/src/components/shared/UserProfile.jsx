import React from 'react'

function UserProfile({ user }) {
  if (!user) return null

  return (
    <div className="user-profile">
      <div className="user-avatar">
        <span className="avatar-icon">👤</span>
      </div>
      <div className="user-info">
        <span className="user-name">{user.name || '用户'}</span>
        <span className="user-balance">余额: {user.balance} 元</span>
      </div>
    </div>
  )
}

export default UserProfile