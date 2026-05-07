import React from 'react'

function SubmitForm({ task, onSubmit, submitSuccess }) {
  if (!task) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <div className="submit-form">
      <h3>📝 提交任务</h3>
      {submitSuccess ? (
        <div className="submit-success">
          <span className="success-icon">🎉</span>
          <p>提交成功！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>任务名称</label>
            <input 
              type="text" 
              name="title" 
              defaultValue={task.title}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>完成内容</label>
            <textarea 
              name="content" 
              placeholder="描述您完成任务的过程和结果..."
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <label>附件</label>
            <input type="file" name="attachment" className="form-file" />
          </div>
          <button type="submit" className="submit-btn">提交任务</button>
        </form>
      )}
    </div>
  )
}

export default SubmitForm