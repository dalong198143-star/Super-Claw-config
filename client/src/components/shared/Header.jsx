import React, { useState, useEffect } from 'react'

function Header({ aiProvider }) {
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

  const aiLabel = aiProvider === 'checking' ? '检测中'
    : aiProvider === 'deepseek' ? 'DeepSeek'
    : aiProvider === 'ollama' ? 'Ollama'
    : '云端'

  return (
    <header className="header">
      <h1>AI漫剧创作平台</h1>
      <span className="version">v2.8.0</span>
      <div className="header-right">
        <div className={`ai-mode ${aiProvider}`}>AI: {aiLabel}</div>
        <button
          className="theme-toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? '浅色' : '深色'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}

export default Header
