import { useState, useEffect } from 'react'
import './App.css'
import config from './config'
import { useTextToImage } from './hooks/useTextToImage'
import Header from './components/shared/Header'
import ToolSelector from './components/shared/ToolSelector'
import CreationHistory from './components/shared/CreationHistory'
import TextToImageTool from './components/tools/TextToImageTool'
import Gallery from './components/shared/Gallery'
import ImageToVideoTool from './components/tools/ImageToVideoTool'

import AnimeVideoTool from './components/tools/AnimeVideoTool'
import ComicDramaTool from './components/tools/ComicDramaTool'

function App() {
  const [aiProvider, setAiProvider] = useState('checking')
  const [selectedTool, setSelectedTool] = useState('home')

  // 工具串联：文生图 → 图生视频
  const chainToImageToVideo = async (imageUrl) => {
    setImg2vidResult(null)
    setImg2vidError(null)
    setImg2vidProgress(0)
    setImg2vidGenerating(false)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const reader = new FileReader()
      reader.onloadend = () => {
        setImg2vidImage(reader.result)
        setSelectedTool('image-to-video')
      }
      reader.readAsDataURL(blob)
    } catch {
      // CORS 阻止时直接传 URL，后端会下载转换
      setImg2vidImage(imageUrl)
      setSelectedTool('image-to-video')
    }
  }

  // 文生图 hook
  const textToImage = useTextToImage()

  // 图生视频状态
  const [img2vidImage, setImg2vidImage] = useState(null)
  const [img2vidGenerating, setImg2vidGenerating] = useState(false)
  const [img2vidProgress, setImg2vidProgress] = useState(0)
  const [img2vidResult, setImg2vidResult] = useState(null)
  const [img2vidError, setImg2vidError] = useState(null)
  const [img2vidParams, setImg2vidParams] = useState({
    duration: '5s',
    resolution: '720p',
    prompt: '',
  })

  // 动漫视频生成状态
  const [animeVideoGenerating, setAnimeVideoGenerating] = useState(false)
  const [animeVideoProgress, setAnimeVideoProgress] = useState(0)
  const [animeVideoResult, setAnimeVideoResult] = useState(null)
  const [animeVideoError, setAnimeVideoError] = useState(null)
  const [animeVideoParams, setAnimeVideoParams] = useState({
    prompt: '',
    negativePrompt: '',
    style: 'anime-modern',
    duration: '5s',
    resolution: '720p',
    fps: '24',
    motionIntensity: 'medium',
    cameraMovement: 'static',
    motionPrompt: '',
    seed: '',
  })

  // 漫剧制作状态
  const [comicDramaGenerating, setComicDramaGenerating] = useState(false)
  const [comicDramaProgress, setComicDramaProgress] = useState(0)
  const [comicDramaResult, setComicDramaResult] = useState(null)
  const [comicDramaError, setComicDramaError] = useState(null)
  const [comicDramaParams] = useState({
    script: '',
    episodeId: 1,
    style: 'modern_anime',
  })
  const [, setComicDramaStoryboard] = useState(null)
  const [, setComicDramaCharacters] = useState(null)

  // 初始化 - 检测 AI 服务
  const detectAIProvider = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/deepseek/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
      })
      if (res.ok) { setAiProvider('deepseek'); return }
    } catch { /* deepseek 不可用 */ }
    setAiProvider('cloud')
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    detectAIProvider()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // ============================================================
  // 图生视频
  // ============================================================
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('请上传 JPG、PNG、GIF 或 WebP 图片')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setImg2vidImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const generateVideo = async () => {
    if (!img2vidImage) return
    setImg2vidGenerating(true)
    setImg2vidProgress(0)
    setImg2vidError(null)

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/siliconflow/image-to-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img2vidImage, ...img2vidParams }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建生成任务失败')

      // 轮询
      let attempts = 0
      while (attempts < 180) {
        await new Promise(r => setTimeout(r, 2000))
        const poll = await fetch(`${config.API_BASE_URL}/api/siliconflow/video-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: data.requestId }) })
        const result = await poll.json()

        if (result.status === 'succeeded') {
          setImg2vidResult(result)
          setImg2vidProgress(100)
          setImg2vidGenerating(false)
          addToHistory({ tool: 'image-to-video', resultType: 'video', resultUrl: result.url, prompt: '图生视频' })
          return
        }
        if (result.status === 'failed') {
          throw new Error(result.error || '生成失败')
        }
        setImg2vidProgress(result.progress || Math.min((attempts + 1) * 1.5, 90))
        attempts++
      }
      throw new Error('生成超时，请重试')
    } catch (e) {
      setImg2vidError(e.message)
      setImg2vidGenerating(false)
    }
  }

  const downloadVideo = async (url) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `视频-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const resetImageToVideo = () => {
    setImg2vidImage(null)
    setImg2vidResult(null)
    setImg2vidError(null)
    setImg2vidProgress(0)
    setImg2vidGenerating(false)
    setImg2vidParams({ duration: '5s', resolution: '720p', prompt: '' })
  }

  // ============================================================
  // 动漫视频生成
  // ============================================================
  const generateAnimeVideo = async () => {
    setAnimeVideoGenerating(true)
    setAnimeVideoProgress(0)
    setAnimeVideoError(null)

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/siliconflow/image-to-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: animeVideoParams.prompt,
          negativePrompt: animeVideoParams.negativePrompt,
          duration: animeVideoParams.duration,
          resolution: animeVideoParams.resolution,
          fps: animeVideoParams.fps,
          motionIntensity: animeVideoParams.motionIntensity,
          seed: animeVideoParams.seed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建生成任务失败')

      // 轮询
      let attempts = 0
      while (attempts < 180) {
        await new Promise(r => setTimeout(r, 2000))
        const poll = await fetch(`${config.API_BASE_URL}/api/siliconflow/video-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: data.requestId }),
        })
        const result = await poll.json()

        if (result.status === 'succeeded') {
          setAnimeVideoResult(result)
          setAnimeVideoProgress(100)
          setAnimeVideoGenerating(false)
          addToHistory({
            tool: 'anime-video',
            resultType: 'video',
            resultUrl: result.url,
            prompt: animeVideoParams.prompt,
          })
          return
        }
        if (result.status === 'failed') {
          throw new Error(result.error || '生成失败')
        }
        setAnimeVideoProgress(result.progress || Math.min((attempts + 1) * 1.5, 90))
        attempts++
      }
      throw new Error('生成超时，请重试')
    } catch (e) {
      setAnimeVideoError(e.message)
      setAnimeVideoGenerating(false)
    }
  }

  const downloadAnimeVideo = async (url) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `动漫视频-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const resetAnimeVideo = () => {
    setAnimeVideoResult(null)
    setAnimeVideoError(null)
    setAnimeVideoProgress(0)
    setAnimeVideoGenerating(false)
    setAnimeVideoParams({
      prompt: '',
      negativePrompt: '',
      style: 'anime-modern',
      duration: '5s',
      resolution: '720p',
      fps: '24',
      motionIntensity: 'medium',
      cameraMovement: 'static',
      motionPrompt: '',
      seed: '',
    })
  }

  // ============================================================
  // 漫剧制作
  // ============================================================
  const generateComicDrama = async () => {
    setComicDramaGenerating(true)
    setComicDramaProgress(0)
    setComicDramaError(null)

    try {
      // Step 1: 生成分镜脚本 (5%)
      setComicDramaProgress(5)
      
      const storyboardRes = await fetch(`${config.API_BASE_URL}/api/comic-drama/generate-storyboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: comicDramaParams.script,
          episodeId: comicDramaParams.episodeId || 1,
          style: comicDramaParams.style || 'modern_anime',
        }),
      })

      if (!storyboardRes.ok) {
        const error = await storyboardRes.json()
        throw new Error(error.error || '分镜生成失败')
      }

      const storyboardData = await storyboardRes.json()
      console.log('分镜脚本生成成功:', storyboardData)
      
      // Step 2: 处理角色配置 (10%)
      setComicDramaProgress(10)
      setComicDramaStoryboard(storyboardData.storyboard)
      setComicDramaCharacters(storyboardData.characters)

      // 注意：实际的视频生成需要后续步骤
      // 这里先保存分镜结果，等待用户确认角色配置后继续
      
      setComicDramaGenerating(false)
      setComicDramaProgress(100)
      
      addToHistory({ 
        tool: 'comic-drama', 
        resultType: 'storyboard', 
        resultUrl: null,
        prompt: comicDramaParams.script?.substring(0, 100) || 'AI漫剧制作',
        metadata: {
          scenes: storyboardData.storyboard.scenes?.length || 0,
          characters: storyboardData.characters?.length || 0,
        }
      })
    } catch (e) {
      console.error('漫剧生成错误:', e)
      setComicDramaError(e.message)
      setComicDramaGenerating(false)
      setComicDramaProgress(0)
    }
  }

  const downloadComicDrama = async (url) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `漫剧-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const resetComicDrama = () => {
    setComicDramaResult(null)
    setComicDramaError(null)
    setComicDramaProgress(0)
    setComicDramaGenerating(false)
  }

  // ============================================================
  // 创作历史
  // ============================================================
  const addToHistory = (item) => {
    const key = 'creation_history'
    const saved = localStorage.getItem(key)
    const history = saved ? JSON.parse(saved) : []
    const updated = [{ id: Date.now(), timestamp: new Date().toISOString(), ...item }, ...history].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(updated))
  }

  // ============================================================
  // 渲染当前工具
  // ============================================================
  const renderTool = () => {
    switch (selectedTool) {
      case 'home':
        return <Gallery onSelectTool={setSelectedTool} />
      case 'comic-drama':
        return (
          <ComicDramaTool
            onGenerate={generateComicDrama}
            isGenerating={comicDramaGenerating}
            progress={comicDramaProgress}
            result={comicDramaResult}
            error={comicDramaError}
            onDownload={downloadComicDrama}
            onReset={resetComicDrama}
          />
        )
      case 'anime-video':
        return (
          <AnimeVideoTool
            onGenerate={generateAnimeVideo}
            isGenerating={animeVideoGenerating}
            progress={animeVideoProgress}
            result={animeVideoResult}
            error={animeVideoError}
            onDownload={downloadAnimeVideo}
            onReset={resetAnimeVideo}
            params={animeVideoParams}
            onParamChange={(key, val) => setAnimeVideoParams(prev => ({ ...prev, [key]: val }))}
          />
        )
      case 'image-to-video':
        return (
          <ImageToVideoTool
            image={img2vidImage}
            onImageUpload={handleImageUpload}
            onRemoveImage={() => setImg2vidImage(null)}
            onGenerate={generateVideo}
            isGenerating={img2vidGenerating}
            progress={img2vidProgress}
            result={img2vidResult}
            error={img2vidError}
            onDownload={downloadVideo}
            onReset={resetImageToVideo}
            params={img2vidParams}
            onParamChange={(key, val) => setImg2vidParams(prev => ({ ...prev, [key]: val }))}
          />
        )
      case 'text-to-image':
        return <TextToImageTool {...textToImage} onChainToVideo={chainToImageToVideo} />
      default:
        return null
    }
  }

  return (
    <div className="app">
      <Header aiProvider={aiProvider} />

      <div className="main-content">
        <aside className="sidebar">
          <ToolSelector selectedTool={selectedTool} onSelectTool={setSelectedTool} />
          <div className="creation-history-section">
            <CreationHistory
              userId="local"
              onLoadCreation={(item) => {
                setSelectedTool(item.tool)
                if (item.tool === 'text-to-image' && item.prompt) {
                  textToImage.setPrompt(item.prompt)
                }
              }}
            />
          </div>
        </aside>

        <main className="workspace">
          {renderTool()}
        </main>
      </div>
    </div>
  )
}

export default App
