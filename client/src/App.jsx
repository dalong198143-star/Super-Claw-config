import { useState, useEffect } from 'react'
import './App.css'
import config from './config'
import INTERNAL_USERS from './config/internalUsers'
import { useTextToImage } from './hooks/useTextToImage'
// 导入组件
import Header from './components/shared/Header'
import AIAssistant from './components/shared/AIAssistant'
import ToolSelector from './components/shared/ToolSelector'
import UserSwitcher from './components/shared/UserSwitcher'
import CreationHistory from './components/shared/CreationHistory'
import WorkflowContainer from './components/workflow/WorkflowContainer'
import TextToImageTool from './components/tools/TextToImageTool'
import ImageToVideoTool from './components/tools/ImageToVideoTool'
import MotionTransferTool from './components/tools/MotionTransferTool'
import OutfitTool from './components/tools/OutfitTool'
import UpscaleTool from './components/tools/UpscaleTool'
import VideoJoinTool from './components/tools/VideoJoinTool'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : INTERNAL_USERS[0]
  })
  const [aiProvider, setAiProvider] = useState('checking')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])

  // 文生图 hook
  const textToImage = useTextToImage()

  // 工具状态
  const [selectedTool, setSelectedTool] = useState('text-to-image')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [videoGenerating, setVideoGenerating] = useState(false)
  const [videoResolution, setVideoResolution] = useState('1080p')
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9')
  const [lockOriginalRatio, setLockOriginalRatio] = useState(true)
  const [videoFitMode, setVideoFitMode] = useState('contain')
  const [originalImageSize, setOriginalImageSize] = useState(null)
  const [motionSourceFile, setMotionSourceFile] = useState(null)
  const [motionSourcePreview, setMotionSourcePreview] = useState(null)
  const [motionTargetFile, setMotionTargetFile] = useState(null)
  const [motionTargetPreview, setMotionTargetPreview] = useState(null)
  const [motionGenerating, setMotionGenerating] = useState(false)
  const [motionProgress, setMotionProgress] = useState(0)
  const [motionMode, setMotionMode] = useState('fast')
  const [motionWidth, setMotionWidth] = useState(512)
  const [motionHeight, setMotionHeight] = useState(512)
  const [motionFps, setMotionFps] = useState(30)
  const [motionQuality, setMotionQuality] = useState('high')
  const [generatedMotion, setGeneratedMotion] = useState(null)
  const [outfitPersonFile, setOutfitPersonFile] = useState(null)
  const [outfitPersonPreview, setOutfitPersonPreview] = useState(null)
  const [outfitClothFile, setOutfitClothFile] = useState(null)
  const [outfitClothPreview, setOutfitClothPreview] = useState(null)
  const [outfitGenerating, setOutfitGenerating] = useState(false)
  const [outfitProgress, setOutfitProgress] = useState(0)
  const [outfitEdgeSmooth, setOutfitEdgeSmooth] = useState(5)
  const [outfitBlend, setOutfitBlend] = useState(50)
  const [generatedOutfit, setGeneratedOutfit] = useState(null)
  const [upscaleFile, setUpscaleFile] = useState(null)
  const [upscalePreview, setUpscalePreview] = useState(null)
  const [upscaleGenerating, setUpscaleGenerating] = useState(false)
  const [upscaleProgress, setUpscaleProgress] = useState(0)
  const [upscaleMode, setUpscaleMode] = useState('denoise')
  const [upscaleScale, setUpscaleScale] = useState(2)
  const [upscaleStyle, setUpscaleStyle] = useState('natural')
  const [generatedUpscale, setGeneratedUpscale] = useState(null)
  const [videoClips, setVideoClips] = useState([])
  const [videoJoinGenerating, setVideoJoinGenerating] = useState(false)
  const [videoJoinProgress, setVideoJoinProgress] = useState(0)
  const [generatedVideoJoin, setGeneratedVideoJoin] = useState(null)

  // 初始化
  useEffect(() => {
    fetchUser()
    detectAIProvider()
  }, [])

  const fetchUser = async () => {
    // 内部使用模式：直接使用当前选中的用户信息，不从服务器获取
    // 如果需要从服务器同步余额等信息，可以保留原有逻辑
    setUser(user)
  }

  const handleUserChange = (newUser) => {
    setUser(newUser)
  }

  const detectAIProvider = async () => {
    // 优先级: DeepSeek → Ollama → Cloud
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/deepseek/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
      })
      if (res.ok) {
        setAiProvider('deepseek')
        return
      }
    } catch (e) {
      // DeepSeek 不可用，继续检测 Ollama
    }

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/ollama/tags`)
      if (res.ok) {
        const data = await res.json()
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models.map(m => m.name))
          setSelectedModel(data.models[0].name)
          setAiProvider('ollama')
        } else {
          setAiProvider('cloud')
        }
      } else {
        setAiProvider('cloud')
      }
    } catch (e) {
      setAiProvider('cloud')
    }
  }

  const callDeepSeek = async (messages) => {
    setLoading(true)
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/deepseek/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await res.json()
      if (data.reply) {
        setAiResponse(data.reply)
      } else {
        setAiResponse('AI 暂时无法响应，请稍后重试')
      }
    } catch (e) {
      setAiResponse('AI 助手暂不可用，请检查网络连接')
    }
    setLoading(false)
  }

  const askAI = (userMessage) => {
    if (aiProvider === 'deepseek') {
      callDeepSeek([{ role: 'user', content: userMessage }])
    } else {
      callOllama(userMessage)
    }
  }

  const callOllama = async (prompt) => {
    setLoading(true)
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/ollama/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || 'qwen2.5-coder:1.5b',
          prompt: prompt,
          stream: false
        })
      })
      const data = await res.json()
      setAiResponse(data.response)
    } catch (e) {
      setAiResponse('AI 提示：这个任务您可以这样做...（需要本地安装Ollama）')
    }
    setLoading(false)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板！')
    } catch (e) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('已复制到剪贴板！')
    }
  }

  const fillToImagePrompt = (text) => {
    textToImage.setPrompt(text)
    const imageGenerator = document.querySelector('.image-generator')
    if (imageGenerator) {
      imageGenerator.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const optimizeAndFillPrompt = (text) => {
    const optimizedPrompt = extractAndOptimizePrompt(text)
    textToImage.setPrompt(optimizedPrompt)
    const imageGenerator = document.querySelector('.image-generator')
    if (imageGenerator) {
      imageGenerator.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const extractAndOptimizePrompt = (text) => {
    const patterns = [
      /```([\s\S]*?)```/g,
      /`([^`]+)`/g,
      /(?:Photorealistic|Impressionist|Anime|Concept art|Digital painting)[\s\S]*?(?=\n\n|$)/gi,
      /(?:A beautiful|An epic|A serene|A magical|A dramatic)[\s\S]*?(?=\n\n|$)/gi,
      /(?:A [^,\n]+, [^,\n]+, [^,\n]+)/gi
    ]

    for (let pattern of patterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        let bestMatch = matches[0].replace(/^```|```$/g, '').trim()
        if (bestMatch.length > 20 && bestMatch.length < 1000) {
          return enhancePrompt(bestMatch)
        }
      }
    }

    const sentences = text.split(/[.!?。！？]+/)
    for (let sentence of sentences) {
      const keywords = ['风景', '画', '风景', 'landscape', 'painting', 'image', 'scene', 'sunset', 'forest', 'mountain', 'ocean', 'beach', 'city', 'sky']
      const hasKeyword = keywords.some(k => sentence.toLowerCase().includes(k))
      if (hasKeyword && sentence.length > 30 && sentence.length < 500) {
        return enhancePrompt(sentence.trim())
      }
    }

    return enhancePrompt(text)
  }

  const enhancePrompt = (prompt) => {
    let enhanced = prompt
    const commonEnhancements = [
      { test: /8K|UHD|ultra-detailed/i, add: '' },
      { test: /style of/i, add: '' },
      { test: /highly detailed|ultra detailed/i, add: '' },
      { test: /cinematic|epic|dramatic/i, add: '' }
    ]

    let needsEnhancements = true
    for (let e of commonEnhancements) {
      if (e.test.test(enhanced)) {
        needsEnhancements = false
        break
      }
    }

    if (needsEnhancements) {
      const enhancements = [
        'highly detailed',
        '8K UHD',
        'cinematic lighting',
        'epic scale'
      ]
      
      const randomEnhancements = []
      for (let i = 0; i < 2; i++) {
        const idx = Math.floor(Math.random() * enhancements.length)
        randomEnhancements.push(enhancements[idx])
      }
      
      enhanced += ', ' + randomEnhancements.join(', ')
    }

    if (!/--ar/.test(enhanced)) {
      enhanced += ' --ar 16:9'
    }

    return enhanced.trim()
  }

  const saveImage = (imageUrl) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `generated-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`🖼️ 图片已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: generated-image-${Date.now()}.jpg`)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG、PNG、GIF 或 WebP 图片！')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过 20MB！')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        const img = new Image()
        img.onload = () => {
          setOriginalImageSize({
            width: img.width,
            height: img.height,
            ratio: (img.width / img.height).toFixed(2)
          })
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMotionSourceUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'video/mp4']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG、PNG 图片或 MP4 视频文件！')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('文件大小不能超过 50MB！')
        return
      }
      setMotionSourceFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setMotionSourcePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMotionTargetUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG 或 PNG 图片！')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过 20MB！')
        return
      }
      setMotionTargetFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setMotionTargetPreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateMotion = async () => {
    if (!motionSourceFile && !motionTargetFile) return
    setMotionGenerating(true)
    setMotionProgress(0)
    const totalSteps = 100
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      setMotionProgress(Math.min(i, 100))
    }
    setGeneratedMotion({
      url: config.DEFAULT_VIDEO_URL,
      sourceFile: motionSourceFile?.name || 'demo.mp4',
      targetFile: motionTargetFile?.name || 'demo.png',
      mode: motionMode,
      settings: {
        width: motionWidth,
        height: motionHeight,
        fps: motionFps,
        quality: motionQuality
      }
    })
    setMotionGenerating(false)
    
    // 添加到创作历史
    addToHistory({
      tool: selectedTool,
      resultType: 'video',
      resultUrl: config.DEFAULT_VIDEO_URL,
      prompt: `动作迁移 - ${motionSourceFile?.name || ''} + ${motionTargetFile?.name || ''}`,
      settings: { mode: motionMode, width: motionWidth, height: motionHeight, fps: motionFps, quality: motionQuality }
    })
  }

  const saveMotion = (videoUrl) => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `motion-result-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`🎬 动作迁移结果已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: motion-result-${Date.now()}.mp4`)
  }

  const resetMotionWorkflow = () => {
    setMotionSourceFile(null)
    setMotionSourcePreview(null)
    setMotionTargetFile(null)
    setMotionTargetPreview(null)
    setMotionGenerating(false)
    setMotionProgress(0)
    setGeneratedMotion(null)
  }

  const handleOutfitPersonUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG 或 PNG 图片！')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过 20MB！')
        return
      }
      setOutfitPersonFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setOutfitPersonPreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOutfitClothUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG 或 PNG 图片！')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过 20MB！')
        return
      }
      setOutfitClothFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setOutfitClothPreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateOutfit = async () => {
    if (!outfitPersonFile && !outfitClothFile) return
    setOutfitGenerating(true)
    setOutfitProgress(0)
    const totalSteps = 100
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      setOutfitProgress(Math.min(i, 100))
    }
    setGeneratedOutfit({
      url: config.DEFAULT_VIDEO_URL.replace('.mp4', '.jpg'),
      personFile: outfitPersonFile?.name || 'person.jpg',
      clothFile: outfitClothFile?.name || 'cloth.png',
      settings: {
        edgeSmooth: outfitEdgeSmooth,
        blend: outfitBlend
      }
    })
    setOutfitGenerating(false)
    
    // 添加到创作历史
    addToHistory({
      tool: selectedTool,
      resultType: 'image',
      resultUrl: config.DEFAULT_VIDEO_URL.replace('.mp4', '.jpg'),
      prompt: `换装 - ${outfitPersonFile?.name || ''} + ${outfitClothFile?.name || ''}`,
      settings: { edgeSmooth: outfitEdgeSmooth, blend: outfitBlend }
    })
  }

  const saveOutfit = (imageUrl) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `outfit-result-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`👗 换装结果已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: outfit-result-${Date.now()}.jpg`)
  }

  const resetOutfitWorkflow = () => {
    setOutfitPersonFile(null)
    setOutfitPersonPreview(null)
    setOutfitClothFile(null)
    setOutfitClothPreview(null)
    setOutfitGenerating(false)
    setOutfitProgress(0)
    setGeneratedOutfit(null)
  }

  const handleUpscaleUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('请上传 JPG 或 PNG 图片！')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('文件大小不能超过 20MB！')
        return
      }
      setUpscaleFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUpscalePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateUpscale = async () => {
    if (!upscaleFile) return
    setUpscaleGenerating(true)
    setUpscaleProgress(0)
    const totalSteps = 100
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 40))
      setUpscaleProgress(Math.min(i, 100))
    }
    setGeneratedUpscale({
      url: config.DEFAULT_VIDEO_URL.replace('.mp4', '.jpg'),
      originalFile: upscaleFile?.name || 'original.jpg',
      mode: upscaleMode,
      scale: upscaleScale,
      style: upscaleStyle
    })
    setUpscaleGenerating(false)
    
    // 添加到创作历史
    addToHistory({
      tool: selectedTool,
      resultType: 'image',
      resultUrl: config.DEFAULT_VIDEO_URL.replace('.mp4', '.jpg'),
      prompt: `重绘洗图 - ${upscaleFile?.name || ''}`,
      settings: { mode: upscaleMode, scale: upscaleScale, style: upscaleStyle }
    })
  }

  const saveUpscale = (imageUrl) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `upscale-result-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`🖼️ 重绘结果已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: upscale-result-${Date.now()}.jpg`)
  }

  const resetUpscaleWorkflow = () => {
    setUpscaleFile(null)
    setUpscalePreview(null)
    setUpscaleGenerating(false)
    setUpscaleProgress(0)
    setGeneratedUpscale(null)
  }

  const handleVideoClipUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} 格式不支持，请上传 MP4、WebM 或 MOV 格式！`)
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        alert(`${file.name} 文件太大，请上传小于 100MB 的视频！`)
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const newClip = {
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          url: event.target.result,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          duration: null
        }
        setVideoClips(prev => [...prev, newClip])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeVideoClip = (clipId) => {
    setVideoClips(prev => prev.filter(clip => clip.id !== clipId))
  }

  const moveVideoClip = (clipId, direction) => {
    setVideoClips(prev => {
      const index = prev.findIndex(clip => clip.id === clipId)
      if (index === -1) return prev
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const newClips = [...prev]
      ;[newClips[index], newClips[newIndex]] = [newClips[newIndex], newClips[index]]
      return newClips
    })
  }

  const generateVideoJoin = async () => {
    if (videoClips.length < 2) {
      alert('请至少上传2个视频片段进行拼接！')
      return
    }
    setVideoJoinGenerating(true)
    setVideoJoinProgress(0)
    const totalSteps = 100
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      setVideoJoinProgress(Math.min(i, 100))
    }
    setGeneratedVideoJoin({
      url: config.DEFAULT_VIDEO_URL,
      clipCount: videoClips.length,
      clips: videoClips.map(c => c.name)
    })
    setVideoJoinGenerating(false)
    
    // 添加到创作历史
    addToHistory({
      tool: selectedTool,
      resultType: 'video',
      resultUrl: config.DEFAULT_VIDEO_URL,
      prompt: `视频拼接 - ${videoClips.length}个片段`,
      settings: { clipCount: videoClips.length, clips: videoClips.map(c => c.name) }
    })
  }

  const saveVideoJoin = () => {
    const link = document.createElement('a')
    link.href = generatedVideoJoin.url
    link.download = `joined-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`🎬 拼接视频已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: joined-video-${Date.now()}.mp4`)
  }

  const resetVideoJoinWorkflow = () => {
    setVideoClips([])
    setVideoJoinGenerating(false)
    setVideoJoinProgress(0)
    setGeneratedVideoJoin(null)
  }

  const generateVideo = async () => {
    if (!uploadedImage && !textToImage.prompt) return
    setVideoGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setGeneratedVideo({
      url: config.DEFAULT_VIDEO_URL,
      prompt: textToImage.prompt,
      status: 'completed'
    })
    setVideoGenerating(false)

    addToHistory({
      tool: selectedTool,
      resultType: 'video',
      resultUrl: config.DEFAULT_VIDEO_URL,
      prompt: textToImage.prompt,
      settings: { resolution: videoResolution, aspectRatio: videoAspectRatio }
    })
  }

  const saveVideo = (videoUrl) => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `generated-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    alert(`🎬 视频已保存！\n\n📁 默认保存位置：\n• Windows: 此电脑 → 下载\n• Mac: 访达 → 下载\n• 手机: 文件 → 下载\n\n文件名: generated-video-${Date.now()}.mp4`)
  }

  // 渲染当前选中的工具
  const renderCurrentTool = () => {
    switch (selectedTool) {
      case 'text-to-image':
        return <TextToImageTool {...textToImage} />
      case 'image-to-video':
        return (
          <ImageToVideoTool
            uploadedImage={uploadedImage}
            originalImageSize={originalImageSize}
            lockOriginalRatio={lockOriginalRatio}
            onLockRatioChange={setLockOriginalRatio}
            videoFitMode={videoFitMode}
            onFitModeChange={setVideoFitMode}
            videoResolution={videoResolution}
            onResolutionChange={setVideoResolution}
            videoAspectRatio={videoAspectRatio}
            onAspectRatioChange={setVideoAspectRatio}
            onImageUpload={handleImageUpload}
            onRemoveImage={() => { setUploadedImage(null); setOriginalImageSize(null) }}
            onGenerate={generateVideo}
            isGenerating={videoGenerating}
            generatedVideo={generatedVideo}
            onSave={saveVideo}
          />
        )
      case 'motion-transfer':
        return (
          <MotionTransferTool
            motionSourceFile={motionSourceFile}
            motionSourcePreview={motionSourcePreview}
            motionTargetFile={motionTargetFile}
            motionTargetPreview={motionTargetPreview}
            motionMode={motionMode}
            onMotionModeChange={setMotionMode}
            motionWidth={motionWidth}
            onWidthChange={setMotionWidth}
            motionHeight={motionHeight}
            onHeightChange={setMotionHeight}
            motionFps={motionFps}
            onFpsChange={setMotionFps}
            motionQuality={motionQuality}
            onQualityChange={setMotionQuality}
            onSourceUpload={handleMotionSourceUpload}
            onTargetUpload={handleMotionTargetUpload}
            onRemoveSource={() => { setMotionSourceFile(null); setMotionSourcePreview(null) }}
            onRemoveTarget={() => { setMotionTargetFile(null); setMotionTargetPreview(null) }}
            onGenerate={generateMotion}
            isGenerating={motionGenerating}
            progress={motionProgress}
            generatedMotion={generatedMotion}
            onSave={saveMotion}
            onReset={resetMotionWorkflow}
          />
        )
      case 'outfit':
        return (
          <OutfitTool
            outfitPersonFile={outfitPersonFile}
            outfitPersonPreview={outfitPersonPreview}
            outfitClothFile={outfitClothFile}
            outfitClothPreview={outfitClothPreview}
            outfitEdgeSmooth={outfitEdgeSmooth}
            onEdgeSmoothChange={setOutfitEdgeSmooth}
            outfitBlend={outfitBlend}
            onBlendChange={setOutfitBlend}
            onPersonUpload={handleOutfitPersonUpload}
            onClothUpload={handleOutfitClothUpload}
            onRemovePerson={() => { setOutfitPersonFile(null); setOutfitPersonPreview(null) }}
            onRemoveCloth={() => { setOutfitClothFile(null); setOutfitClothPreview(null) }}
            onGenerate={generateOutfit}
            isGenerating={outfitGenerating}
            progress={outfitProgress}
            generatedOutfit={generatedOutfit}
            onSave={saveOutfit}
            onReset={resetOutfitWorkflow}
          />
        )
      case 'upscale':
        return (
          <UpscaleTool
            upscaleFile={upscaleFile}
            upscalePreview={upscalePreview}
            upscaleMode={upscaleMode}
            onModeChange={setUpscaleMode}
            upscaleScale={upscaleScale}
            onScaleChange={setUpscaleScale}
            upscaleStyle={upscaleStyle}
            onStyleChange={setUpscaleStyle}
            onImageUpload={handleUpscaleUpload}
            onRemoveImage={() => { setUpscaleFile(null); setUpscalePreview(null) }}
            onGenerate={generateUpscale}
            isGenerating={upscaleGenerating}
            progress={upscaleProgress}
            generatedUpscale={generatedUpscale}
            onSave={saveUpscale}
            onReset={resetUpscaleWorkflow}
          />
        )
      case 'video-join':
        return (
          <VideoJoinTool
            videoClips={videoClips}
            onVideoUpload={handleVideoClipUpload}
            onRemoveClip={removeVideoClip}
            onMoveClip={moveVideoClip}
            onGenerate={generateVideoJoin}
            isGenerating={videoJoinGenerating}
            progress={videoJoinProgress}
            generatedVideoJoin={generatedVideoJoin}
            onSave={saveVideoJoin}
            onReset={resetVideoJoinWorkflow}
          />
        )
      default:
        return null
    }
  }

  // 添加创作到历史记录
  const addToHistory = (creation) => {
    if (!user) return
    
    const historyKey = `creation_history_${user.id}`
    const saved = localStorage.getItem(historyKey)
    const history = saved ? JSON.parse(saved) : []
    
    const newRecord = {
      id: Date.now(),
      ...creation,
      timestamp: new Date().toISOString(),
      userId: user.id
    }
    
    const updated = [newRecord, ...history].slice(0, 50) // 最多保留50条
    localStorage.setItem(historyKey, JSON.stringify(updated))
  }

  return (
    <div className="app">
      <Header user={user} aiMode={aiProvider} />
      
      <div className="main-content">
        <aside className="sidebar">
          <ToolSelector selectedTool={selectedTool} onSelectTool={setSelectedTool} />
          
          <div className="ai-assistant-section">
            <AIAssistant
              aiProvider={aiProvider}
              availableModels={availableModels}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              aiResponse={aiResponse}
              loading={loading}
              onAskAI={askAI}
              onCopyResponse={copyToClipboard}
              onOptimizePrompt={optimizeAndFillPrompt}
              onFillPrompt={fillToImagePrompt}
            />
          </div>
          
          <div className="creation-history-section">
            <CreationHistory 
              userId={user?.id}
              onLoadCreation={(item) => {
                // 根据历史记录重新加载创作
                console.log('重新加载创作:', item)
                
                // 切换到对应的工具
                setSelectedTool(item.tool)
                
                // 根据工具类型填充相应的数据
                if (item.tool === 'text-to-image') {
                  textToImage.setPrompt(item.prompt || '')
                  if (item.style) textToImage.setSelectedStyle(item.style)
                } else if (item.tool === 'image-to-video') {
                  if (item.prompt) textToImage.setPrompt(item.prompt)
                  if (item.settings?.resolution) setVideoResolution(item.settings.resolution)
                  if (item.settings?.aspectRatio) setVideoAspectRatio(item.settings.aspectRatio)
                } else if (item.tool === 'motion-transfer') {
                  if (item.settings) {
                    setMotionMode(item.settings.mode || 'fast')
                    setMotionWidth(item.settings.width || 512)
                    setMotionHeight(item.settings.height || 512)
                    setMotionFps(item.settings.fps || 30)
                    setMotionQuality(item.settings.quality || 'high')
                  }
                } else if (item.tool === 'outfit') {
                  if (item.settings) {
                    setOutfitEdgeSmooth(item.settings.edgeSmooth || 5)
                    setOutfitBlend(item.settings.blend || 50)
                  }
                } else if (item.tool === 'upscale') {
                  if (item.settings) {
                    setUpscaleMode(item.settings.mode || 'denoise')
                    setUpscaleScale(item.settings.scale || 2)
                    setUpscaleStyle(item.settings.style || 'natural')
                  }
                }
                
                // 提示用户
                alert(`✅ 已加载历史创作记录\n\n工具: ${item.tool}\n时间: ${new Date(item.timestamp).toLocaleString()}`)
              }}
            />
          </div>
        </aside>
        
        <main className="workspace">
          <WorkflowContainer 
            selectedTool={selectedTool}
            toolComponent={renderCurrentTool()}
          />
        </main>
      </div>
    </div>
  )
}

export default App