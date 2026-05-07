import React from 'react'
import { useWorkflow } from '../../hooks/useWorkflow'
import './SmartWorkflow.css'

// 预设的工作流模板（扩展版）
const WORKFLOW_TEMPLATES = [
  {
    id: 1,
    title: '产品展示视频',
    description: '从产品图片生成动态展示视频',
    icon: '📦',
    steps: ['上传产品图', '重绘优化', '图生视频', '导出成品'],
    tools: ['text-to-image', 'upscale', 'image-to-video'],
    color: '#667eea',
    keywords: ['产品', '商品', '展示', '营销', '宣传', '电商']
  },
  {
    id: 2,
    title: '人物换装秀',
    description: '为人物照片更换不同服装',
    icon: '👔',
    steps: ['上传人物照', '选择服装', '调整参数', '生成换装'],
    tools: ['outfit'],
    color: '#f56565',
    keywords: ['换装', '服装', '衣服', '穿搭', '时尚', '造型']
  },
  {
    id: 3,
    title: '动作模仿视频',
    description: '让人物模仿指定动作',
    icon: '🕺',
    steps: ['上传人物图', '上传动作视频', '配置参数', '生成结果'],
    tools: ['motion-transfer'],
    color: '#ed64a6',
    keywords: ['动作', '模仿', '舞蹈', '运动', '姿态', '动画']
  },
  {
    id: 4,
    title: '高清修复流程',
    description: '提升图片清晰度和细节',
    icon: '🔍',
    steps: ['上传图片', '选择模式', '设置倍率', '超分完成'],
    tools: ['upscale'],
    color: '#ed8936',
    keywords: ['高清', '清晰', '修复', '放大', '增强', '画质', '模糊']
  },
  {
    id: 5,
    title: '视频剪辑拼接',
    description: '将多个视频片段拼接成一个',
    icon: '✂️',
    steps: ['上传视频', '调整顺序', '添加特效', '导出视频'],
    tools: ['video-join'],
    color: '#48bb78',
    keywords: ['视频', '剪辑', '拼接', '合并', '片段', '合成']
  },
  {
    id: 6,
    title: 'AI绘画创作',
    description: '从文字描述生成精美画作',
    icon: '🎨',
    steps: ['输入描述', '选择风格', '调整参数', '生成作品'],
    tools: ['text-to-image'],
    color: '#9f7aea',
    keywords: ['绘画', '插画', '艺术', '创作', '画', '风格', '写实', '动漫']
  }
]

function SmartWorkflow() {
  const { 
    smartWorkflow, 
    setRequirement, 
    setRecommendations, 
    setAnalyzing 
  } = useWorkflow()
  
  const { requirement, recommendations, analyzing } = smartWorkflow
  
  // 分析用户需求（简化版关键词匹配）
  const analyzeRequirement = () => {
    if (!requirement.trim()) {
      alert('请输入您的需求描述')
      return
    }
    
    setAnalyzing(true)
    
    // 模拟AI分析延迟
    setTimeout(() => {
      const matchedTemplates = matchTemplates(requirement)
      setRecommendations(matchedTemplates)
      setAnalyzing(false)
    }, 1000)
  }
  
  // 智能关键词匹配算法（增强版）
  const matchTemplates = (text) => {
    const lowerText = text.toLowerCase()
    
    // 计算每个模板的匹配分数
    const scoredTemplates = WORKFLOW_TEMPLATES.map(template => {
      let score = 0
      
      // 关键词匹配（每个关键词匹配得1分）
      template.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += 1
        }
      })
      
      // 标题匹配（标题中的词匹配得2分）
      const titleWords = template.title.split(/[\s,，]+/)
      titleWords.forEach(word => {
        if (word.length > 1 && lowerText.includes(word.toLowerCase())) {
          score += 2
        }
      })
      
      // 描述匹配（描述中的词匹配得1.5分）
      const descWords = template.description.split(/[\s,，]+/)
      descWords.forEach(word => {
        if (word.length > 2 && lowerText.includes(word.toLowerCase())) {
          score += 1.5
        }
      })
      
      return { ...template, score }
    })
    
    // 按分数排序
    const sorted = scoredTemplates.sort((a, b) => b.score - a.score)
    
    // 返回有分数的模板（至少匹配一个关键词）
    const matched = sorted.filter(t => t.score > 0)
    
    // 如果没有匹配到，返回所有模板（按默认顺序）
    if (matched.length === 0) {
      return WORKFLOW_TEMPLATES
    }
    
    return matched
  }
  
  // 应用推荐的工作流
  const applyWorkflow = (template) => {
    // 保存模板到localStorage
    saveTemplateToHistory(template)
    
    alert(`✅ 已应用工作流: ${template.title}\n\n步骤: ${template.steps.join(' → ')}`)
    // TODO: 实际应用中应该切换到对应的工具和参数
  }
  
  // 保存模板使用历史
  const saveTemplateToHistory = (template) => {
    try {
      const historyKey = 'workflow_template_history'
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
      
      // 添加使用时间戳
      const record = {
        templateId: template.id,
        title: template.title,
        usedAt: new Date().toISOString()
      }
      
      // 最多保留20条记录
      const updated = [record, ...existing].slice(0, 20)
      localStorage.setItem(historyKey, JSON.stringify(updated))
    } catch (error) {
      console.error('保存模板历史失败:', error)
    }
  }
  
  return (
    <div className="smart-workflow">
      {/* 需求输入区 */}
      <div className="requirement-section">
        <h3>🎯 描述您的创作需求</h3>
        <p className="section-hint">告诉AI您想创作什么，我们会为您推荐最佳工作流</p>
        
        <textarea
          className="requirement-input"
          placeholder="例如：我想制作一个产品展示视频，需要高清画质..."
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          rows={4}
        />
        
        <button 
          className="btn-analyze"
          onClick={analyzeRequirement}
          disabled={analyzing || !requirement.trim()}
        >
          {analyzing ? '🤖 AI分析中...' : '🤖 AI分析'}
        </button>
      </div>
      
      {/* 推荐列表 */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4>💡 为您推荐的工作流方案</h4>
          
          <div className="recommendation-list">
            {recommendations.map(template => (
              <div 
                key={template.id} 
                className="recommendation-card"
                style={{ '--template-color': template.color }}
              >
                <div className="card-header">
                  <span className="template-icon">{template.icon}</span>
                  <h5>{template.title}</h5>
                </div>
                
                <p className="template-description">{template.description}</p>
                
                <div className="workflow-preview">
                  <div className="preview-label">工作流程:</div>
                  <div className="preview-steps">
                    {template.steps.map((step, index) => (
                      <React.Fragment key={index}>
                        <span className="step-item">{step}</span>
                        {index < template.steps.length - 1 && (
                          <span className="step-arrow">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="btn-apply"
                  onClick={() => applyWorkflow(template)}
                >
                  应用此方案
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 空状态提示 */}
      {recommendations.length === 0 && !analyzing && (
        <div className="empty-recommendations">
          <p>💭 输入您的需求，点击"AI分析"获取推荐方案</p>
        </div>
      )}
    </div>
  )
}

export default SmartWorkflow