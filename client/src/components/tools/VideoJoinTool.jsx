import React from 'react'

function VideoJoinTool({ 
  videoClips, 
  onVideoUpload,
  onRemoveClip,
  onMoveClip,
  onNextStep
}) {
  return (
    <div className="workflow-content">
      <div className="step-indicator">
        <span className="current-step">步骤1/3</span>
        <span className="step-title">输入素材</span>
      </div>
      <div className="video-join-settings">
        <div className="video-join-setting">
          <label>🎬 上传视频片段</label>
          <div className="upload-area">
            <label className="upload-label">
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onVideoUpload} className="upload-input" multiple />
              <span className="upload-icon">🎬</span>
              <span>上传视频片段</span>
              <span className="upload-hint">MP4 / WebM / MOV，每个最大100MB</span>
            </label>
          </div>
        </div>
        {videoClips.length > 0 && (
          <div className="video-clips-list">
            <h4>已上传片段 ({videoClips.length})</h4>
            {videoClips.map((clip, index) => (
              <div key={clip.id} className="clip-item">
                <span className="clip-index">{index + 1}</span>
                <div className="clip-info">
                  <span className="clip-name">{clip.name}</span>
                  <span className="clip-size">{clip.size}</span>
                </div>
                <div className="clip-actions">
                  <button 
                    className="move-btn" 
                    onClick={() => onMoveClip(clip.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button 
                    className="move-btn" 
                    onClick={() => onMoveClip(clip.id, 'down')}
                    disabled={index === videoClips.length - 1}
                  >
                    ↓
                  </button>
                  <button className="remove-btn" onClick={() => onRemoveClip(clip.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="step-actions">
        <span className="step-hint">
          {videoClips.length >= 2 ? '✓ 已准备好' : `请上传至少2个视频片段（已上传${videoClips.length}个）`}
        </span>
        <button className="next-btn" onClick={onNextStep} disabled={videoClips.length < 2}>
          进入步骤2 →
        </button>
      </div>
    </div>
  )
}

export default VideoJoinTool