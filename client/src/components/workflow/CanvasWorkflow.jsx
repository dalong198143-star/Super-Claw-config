import React, { useState, useRef } from 'react'
import { useWorkflow } from '../../hooks/useWorkflow'
import './CanvasWorkflow.css'

// 可用的工具节点类型
const AVAILABLE_NODES = [
  { type: 'text-to-image', name: '文生图', icon: '🎨', color: '#667eea' },
  { type: 'image-to-video', name: '图生视频', icon: '🎬', color: '#9f7aea' },
  { type: 'motion-transfer', name: '动作迁移', icon: '🕺', color: '#ed64a6' },
  { type: 'outfit', name: '换装', icon: '👔', color: '#f56565' },
  { type: 'upscale', name: '超分', icon: '🔍', color: '#ed8936' },
  { type: 'video-join', name: '视频拼接', icon: '✂️', color: '#48bb78' }
]

function CanvasWorkflow() {
  const { canvasWorkflow, addNode, removeNode, updateNodePosition, clearCanvas, addConnection, removeConnection } = useWorkflow()
  const [draggedNode, setDraggedNode] = useState(null)
  const [connectingMode, setConnectingMode] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)
  const canvasRef = useRef(null)
  
  // 添加新节点到画布
  const handleAddNode = (nodeType) => {
    const template = AVAILABLE_NODES.find(n => n.type === nodeType)
    addNode({
      type: nodeType,
      name: template.name,
      icon: template.icon,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
    })
  }
  
  // 处理节点拖拽
  const handleNodeDragStart = (e, nodeId) => {
    if (connectingMode) return // 连线模式下不允许拖拽
    setDraggedNode(nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleNodeDragEnd = (e, nodeId) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 50 // 节点宽度的一半
    const y = e.clientY - rect.top - 30  // 节点高度的一半
    
    updateNodePosition(nodeId, { x, y })
    setDraggedNode(null)
  }
  
  // 开始连线
  const handleStartConnection = (nodeId) => {
    if (!connectingMode) {
      setConnectingMode(true)
      setConnectionStart(nodeId)
    } else {
      // 完成连线
      if (connectionStart && connectionStart !== nodeId) {
        addConnection({
          source: connectionStart,
          target: nodeId
        })
      }
      setConnectingMode(false)
      setConnectionStart(null)
    }
  }
  
  // 删除连线
  const handleRemoveConnection = (connectionId) => {
    removeConnection(connectionId)
  }
  
  // 计算连线坐标
  const getConnectionPath = (connection) => {
    const sourceNode = canvasWorkflow.nodes.find(n => n.id === connection.source)
    const targetNode = canvasWorkflow.nodes.find(n => n.id === connection.target)
    
    if (!sourceNode || !targetNode) return null
    
    // 节点中心点
    const startX = sourceNode.position.x + 50
    const startY = sourceNode.position.y + 30
    const endX = targetNode.position.x + 50
    const endY = targetNode.position.y + 30
    
    // 贝塞尔曲线控制点
    const controlX = (startX + endX) / 2
    const controlY = startY
    
    return `M ${startX} ${startY} C ${controlX} ${controlY}, ${controlX} ${endY}, ${endX} ${endY}`
  }
  
  return (
    <div className="canvas-workflow">
      {/* 工具栏 */}
      <div className="canvas-toolbar">
        <h4>添加工具节点</h4>
        <div className="node-palette">
          {AVAILABLE_NODES.map(node => (
            <button
              key={node.type}
              className="palette-node"
              onClick={() => handleAddNode(node.type)}
              style={{ '--node-color': node.color }}
            >
              <span className="node-icon">{node.icon}</span>
              <span className="node-name">{node.name}</span>
            </button>
          ))}
        </div>
        
        <div className="toolbar-actions">
          <button 
            className={`btn-connection-mode ${connectingMode ? 'active' : ''}`}
            onClick={() => {
              if (connectingMode) {
                setConnectingMode(false)
                setConnectionStart(null)
              } else {
                setConnectingMode(true)
              }
            }}
          >
            {connectingMode ? '❌ 取消连线' : '🔗 连线模式'}
          </button>
          
          <button className="btn-clear-canvas" onClick={clearCanvas}>
            🗑️ 清空画布
          </button>
        </div>
      </div>
      
      {/* 画布区域 */}
      <div className="canvas-area" ref={canvasRef}>
        {/* SVG连线层 */}
        <svg className="connections-layer">
          {canvasWorkflow.connections.map(conn => {
            const path = getConnectionPath(conn)
            if (!path) return null
            
            return (
              <g key={conn.id}>
                <path
                  d={path}
                  className="connection-line"
                  markerEnd="url(#arrowhead)"
                />
                <circle
                  cx={(canvasWorkflow.nodes.find(n => n.id === conn.source)?.position.x + 50 + canvasWorkflow.nodes.find(n => n.id === conn.target)?.position.x + 50) / 2}
                  cy={(canvasWorkflow.nodes.find(n => n.id === conn.source)?.position.y + 30 + canvasWorkflow.nodes.find(n => n.id === conn.target)?.position.y + 30) / 2}
                  r="8"
                  className="connection-delete-btn"
                  onClick={() => handleRemoveConnection(conn.id)}
                />
                <text
                  x={(canvasWorkflow.nodes.find(n => n.id === conn.source)?.position.x + 50 + canvasWorkflow.nodes.find(n => n.id === conn.target)?.position.x + 50) / 2}
                  y={(canvasWorkflow.nodes.find(n => n.id === conn.source)?.position.y + 30 + canvasWorkflow.nodes.find(n => n.id === conn.target)?.position.y + 30) / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="connection-delete-icon"
                >
                  ×
                </text>
              </g>
            )
          })}
          
          {/* 箭头标记定义 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#667eea" />
            </marker>
          </defs>
        </svg>
        
        {/* 节点层 */}
        {canvasWorkflow.nodes.length === 0 ? (
          <div className="empty-canvas">
            <p>🎨 点击上方的工具节点添加到画布</p>
            <p className="hint">拖拽节点可以自由调整位置</p>
            <p className="hint">使用"连线模式"连接节点</p>
          </div>
        ) : (
          canvasWorkflow.nodes.map(node => (
            <div
              key={node.id}
              className={`canvas-node ${connectingMode && connectionStart === node.id ? 'connecting' : ''}`}
              draggable={!connectingMode}
              onDragStart={(e) => handleNodeDragStart(e, node.id)}
              onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
              onClick={() => connectingMode && handleStartConnection(node.id)}
              style={{
                left: node.position.x,
                top: node.position.y,
                borderColor: AVAILABLE_NODES.find(n => n.type === node.type)?.color || '#667eea'
              }}
            >
              <div className="node-header">
                <span className="node-icon">{node.icon}</span>
                <span className="node-title">{node.name}</span>
                <button 
                  className="node-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNode(node.id)
                  }}
                >
                  ×
                </button>
              </div>
              {connectingMode && (
                <div className="node-connect-indicator">
                  {connectionStart === node.id ? '🔗 起点' : '点击连接'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 节点统计 */}
      <div className="canvas-stats">
        <span>节点数: {canvasWorkflow.nodes.length}</span>
        <span>连线数: {canvasWorkflow.connections.length}</span>
        {connectingMode && <span className="connecting-hint">💡 点击两个节点创建连线</span>}
      </div>
    </div>
  )
}

export default CanvasWorkflow