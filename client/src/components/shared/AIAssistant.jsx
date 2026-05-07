import React, { useState } from 'react'

const PROVIDER_LABELS = {
  deepseek: 'DeepSeek-Chat',
  ollama: 'Ollama 本地',
  cloud: '云端辅助',
}

function AIAssistant({ aiProvider, availableModels, selectedModel, onModelChange, aiResponse, loading, onAskAI, onCopyResponse, onOptimizePrompt, onFillPrompt }) {
  const [aiMessage, setAiMessage] = useState('')

  const handleSubmit = () => {
    if (aiMessage.trim()) {
      onAskAI(aiMessage)
    }
  }

  const providerLabel = PROVIDER_LABELS[aiProvider] || 'AI 助手'

  return (
    <div className="ai-assistant">
      <h3>AI 小助手</h3>
      <div className="ai-provider-badge" title={`当前 AI: ${providerLabel}`}>
        {providerLabel}
      </div>
      {aiProvider === 'ollama' && availableModels.length > 0 && (
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="model-select"
        >
          {availableModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      )}
      {loading ? (
        <p className="ai-thinking">AI 正在思考...</p>
      ) : (
        <div className="ai-response-container">
          <div className="ai-response">
            {aiResponse || 'AI 提示：我来帮您完成这个任务！'}
          </div>
          {aiResponse && (
            <div className="ai-response-actions">
              <button className="copy-btn" onClick={() => onCopyResponse(aiResponse)}>
                一键复制
              </button>
              <button className="optimize-btn" onClick={() => onOptimizePrompt(aiResponse)}>
                提取并优化提示词
              </button>
              <button className="fill-btn" onClick={() => onFillPrompt(aiResponse)}>
                直接填充
              </button>
            </div>
          )}
        </div>
      )}
      <textarea
        placeholder="问AI问题..."
        value={aiMessage}
        onChange={(e) => setAiMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button onClick={handleSubmit}>问AI</button>
    </div>
  )
}

export default AIAssistant
