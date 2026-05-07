import React, { useState, useEffect } from 'react'
import UserSwitcher from './UserSwitcher'

function Header({ user, aiMode, onUserChange }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <header className="header">
      <h1>学习变现平台</h1>
      <span className="version">v1.10.0</span>
      <div className="header-right">
        <div className={`ai-mode ${aiMode}`}>
          AI: {aiMode === 'checking' ? '检测中' : aiMode === 'local' ? '本地Ollama' : '云端'}
        </div>
        {user && <div className="balance">余额: {user.balance} 元</div>}
        <button 
          className="theme-toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        {user && <UserSwitcher currentUser={user} onUserChange={onUserChange} />}
      </div>
    </header>
  )
}

export default Header