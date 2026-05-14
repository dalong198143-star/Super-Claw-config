import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import config from './config.js';
import { textToImage, imageToVideo, getPrediction } from './services/replicate.js';
import { textToImage as sfTextToImage, submitImageToVideo, getVideoStatus } from './services/siliconflow.js';
import { optimizePrompt, chat } from './services/deepseek.js';
import { generateStoryboard, optimizeShotPrompt, extractCharacters } from './services/storyboard.js';
import { batchGenerateImages, estimateCost } from './services/comicImage.js';
import { batchGeneratePollinations } from './services/pollinationsImage.js';
import { batchGenerateSpeech, estimateTTSCost } from './services/tts.js';
import { synthesizeComicVideo, checkFFmpeg } from './services/videoSynthesis.js';
import { extractSubtitlesFromStoryboard } from './services/subtitle.js';
import { analyzeAndSplitEpisodes, generateEpisodesStoryboard, estimateEpisodeSplitCost } from './services/episodeSplit.js';
import { 
  parseEditingInstruction, 
  getVideoInfo, 
  executeVideoEdit, 
  removeBadFootage, 
  estimateEditingCost 
} from './services/videoEditor.js';

const app = express();
const PORT = config.PORT;

// CORS
app.use(cors({
  origin: config.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 生产环境：提供构建后的前端静态文件
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback: 所有非 /api 和 /uploads 的 GET 请求返回 index.html
    app.get(/^(?!\/(api|uploads)).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log('前端静态文件服务已启用:', clientDist);
  }
}

// 生产环境请求日志
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api/')) {
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, mime && ext ? true : new Error('不支持的文件类型'));
  },
});

// ============================================================
// Replicate 文生图
// ============================================================
app.post('/api/replicate/text-to-image', async (req, res) => {
  const { prompt, negative_prompt, width, height, steps, guidance, seed } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '请输入提示词' });
  }
  if (prompt.length > 2000) {
    return res.status(400).json({ error: '提示词过长（最多2000字符）' });
  }

  try {
    const result = await textToImage(prompt.trim(), {
      negative_prompt,
      width, height, steps, guidance, seed,
    });
    res.json(result);
  } catch (e) {
    console.error('文生图错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

// ============================================================
// Replicate 图生视频
// ============================================================
app.post('/api/replicate/image-to-video', async (req, res) => {
  const { image, video_length, fps, sizing_strategy, motion_bucket_id, cond_aug } = req.body;

  if (!image) {
    return res.status(400).json({ error: '请上传图片' });
  }

  // 校验 base64 格式
  if (!image.startsWith('data:image/')) {
    return res.status(400).json({ error: '图片格式无效，需要 base64 data URI' });
  }

  // 限制大小：base64 约 4/3 原始大小，6.7M base64 ≈ 5MB 图片
  if (image.length > 7 * 1024 * 1024) {
    return res.status(400).json({ error: '图片过大（最大5MB）' });
  }

  try {
    const result = await imageToVideo(image, {
      video_length: video_length || '14_frames',
      fps: fps || 7,
      sizing_strategy: sizing_strategy || 'maintain_aspect_ratio',
      motion_bucket_id: motion_bucket_id || 127,
      cond_aug: cond_aug != null ? cond_aug : 0.02,
    });
    res.json(result);
  } catch (e) {
    console.error('图生视频错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

// ============================================================
// 硅基流动 文生图
// ============================================================
app.post('/api/siliconflow/text-to-image', async (req, res) => {
  const { prompt, negative_prompt, width, height, steps, guidance, seed } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '请输入提示词' });
  }
  if (prompt.length > 2000) {
    return res.status(400).json({ error: '提示词过长（最多2000字符）' });
  }

  try {
    const result = await sfTextToImage(prompt.trim(), {
      width: Math.min(Math.max(parseInt(width) || 512, 256), 1024),
      height: Math.min(Math.max(parseInt(height) || 512, 256), 1024),
      steps: Math.min(Math.max(parseInt(steps) || 30, 1), 50),
      guidance: guidance ? parseFloat(guidance) : undefined,
      seed: seed && parseInt(seed) > 0 ? parseInt(seed) : undefined,
    });
    res.json(result);
  } catch (e) {
    console.error('硅基流动 文生图错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

// ============================================================
// 硅基流动 图生视频
// ============================================================
app.post('/api/siliconflow/image-to-video', async (req, res) => {
  let { image, prompt, duration, resolution, negative_prompt, seed } = req.body;

  if (!image) {
    return res.status(400).json({ error: '请上传图片' });
  }

  // 只校验 base64 大小，URL 直接透传
  if (image.startsWith('data:image/') && image.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: '图片过大（最大10MB）' });
  }

  // 分辨率 → image_size
  const sizeMap = {
    '720p': '1280x720',
    '1080p': '1920x1080',
  };

  try {
    const result = await submitImageToVideo(image, {
      prompt: prompt || '画面缓慢自然运动',
      image_size: sizeMap[resolution] || '1280x720',
      duration: duration || '5s',
      negative_prompt,
      seed: seed || undefined,
    });
    res.json(result);
  } catch (e) {
    console.error('硅基流动 图生视频错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

app.post('/api/siliconflow/video-status', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: '缺少 requestId' });

  try {
    const result = await getVideoStatus(requestId);
    res.json(result);
  } catch (e) {
    console.error('硅基流动 状态查询错误:', e.message);
    res.status(500).json({ error: '查询视频状态失败' });
  }
});

// ============================================================
// Replicate 轮询（文生图+图生视频共用）
// ============================================================
app.get('/api/replicate/prediction/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: '缺少 prediction ID' });

  try {
    const result = await getPrediction(id);
    res.json(result);
  } catch (e) {
    console.error('轮询错误:', e.message);
    res.status(500).json({ error: '查询状态失败' });
  }
});

// ============================================================
// DeepSeek 提示词优化
// ============================================================
app.post('/api/deepseek/optimize-prompt', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '请输入提示词' });
  }
  if (prompt.length > 1000) {
    return res.status(400).json({ error: '提示词过长（最多1000字符）' });
  }

  try {
    const optimized = await optimizePrompt(prompt.trim());
    res.json({ optimized });
  } catch (e) {
    console.error('提示词优化错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

// ============================================================
// DeepSeek Chat
// ============================================================
app.post('/api/deepseek/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '请输入消息内容' });
  }

  try {
    const reply = await chat(messages);
    res.json({ reply });
  } catch (e) {
    console.error('Chat 错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ error: e.message });
  }
});

// ============================================================
// AI漫剧 - 分镜生成
// ============================================================
app.post('/api/comic-drama/generate-storyboard', async (req, res) => {
  const { script, episodeId, style } = req.body;

  if (!script || !script.trim()) {
    return res.status(400).json({ error: '请输入剧本内容' });
  }

  if (script.length > 10000) {
    return res.status(400).json({ error: '剧本过长（最多10000字符）' });
  }

  try {
    console.log('开始生成分镜脚本...');
    const storyboard = await generateStoryboard(script, {
      episodeId: episodeId || 1,
      style: style || 'modern_anime',
    });
    
    console.log('分镜脚本生成成功');
    res.json({
      success: true,
      storyboard,
      characters: extractCharacters(storyboard),
    });
  } catch (e) {
    console.error('分镜生成错误:', e.message);
    const code = e.message.includes('未配置') ? 503 : 500;
    res.status(code).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 优化镜头提示词
// ============================================================
app.post('/api/comic-drama/optimize-prompt', async (req, res) => {
  const { prompt, characterDesc } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '请输入提示词' });
  }

  try {
    const optimized = await optimizeShotPrompt(prompt, characterDesc);
    res.json({
      success: true,
      optimizedPrompt: optimized,
    });
  } catch (e) {
    console.error('提示词优化错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 批量生成图像
// ============================================================
app.post('/api/comic-drama/batch-generate-images', async (req, res) => {
  const { shots, options } = req.body;

  if (!shots || !Array.isArray(shots) || shots.length === 0) {
    return res.status(400).json({
      error: '请提供镜头列表',
      success: false,
    });
  }

  // 限制单次批量生成数量（避免资源耗尽）
  if (shots.length > 50) {
    return res.status(400).json({
      error: '单次最多生成50张图像，请分批处理',
      success: false,
    });
  }

  try {
    const provider = options?.provider || config.IMAGE_PROVIDER || 'pollinations';
    console.log(`[API] 开始批量生成 ${shots.length} 张图像 (provider: ${provider})...`);

    // 提取所有镜头的prompt和shot_id
    const shotList = shots.map(shot => ({
      shot_id: shot.shot_id || shot.shotId,
      prompt: shot.prompt,
    }));

    // 进度回调
    let lastProgress = 0;
    const onProgress = (current, total, shotId) => {
      const progress = Math.round((current / total) * 100);
      if (progress !== lastProgress) {
        console.log(`[API] 进度: ${progress}% (${current}/${total}) - ${shotId}`);
        lastProgress = progress;
      }
    };

    // 根据 provider 选择服务
    let result;
    if (provider === 'pollinations') {
      const pollinationsOptions = {
        ...options,
        model: options?.model || config.POLLINATIONS_IMAGE_MODEL,
        width: options?.width || 512,
        height: options?.height || 512,
      };
      result = await batchGeneratePollinations(shotList, pollinationsOptions, onProgress);
    } else {
      result = await batchGenerateImages(shotList, options || {}, onProgress);
    }

    console.log(`[API] 批量生成完成: 成功 ${result.successCount}, 失败 ${result.failCount}`);

    res.json({
      success: true,
      ...result,
      provider,
      costEstimate: provider === 'pollinations'
        ? { shotCount: shots.length, costPerImage: 0, totalCost: '0.00', currency: 'CNY', note: 'Pollinations.ai 免费' }
        : estimateCost(shots.length),
    });
  } catch (e) {
    console.error('[API] 批量生成错误:', e.message);
    res.status(500).json({
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 估算生成成本
// ============================================================
app.post('/api/comic-drama/estimate-cost', (req, res) => {
  const { shotCount } = req.body;

  if (!shotCount || shotCount <= 0) {
    return res.status(400).json({ 
      error: '请提供有效的镜头数量',
      success: false,
    });
  }

  try {
    const estimate = estimateCost(shotCount);
    res.json({
      success: true,
      ...estimate,
    });
  } catch (e) {
    console.error('[API] 成本估算错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 批量生成配音
// ============================================================
app.post('/api/comic-drama/batch-generate-speech', async (req, res) => {
  const { dialogues, options } = req.body;

  if (!dialogues || !Array.isArray(dialogues) || dialogues.length === 0) {
    return res.status(400).json({ 
      error: '请提供台词列表',
      success: false,
    });
  }

  try {
    console.log(`[API] 开始批量生成 ${dialogues.length} 条语音...`);
    
    let lastProgress = 0;
    const onProgress = (current, total, shotId) => {
      const progress = Math.round((current / total) * 100);
      if (progress !== lastProgress) {
        console.log(`[API] TTS进度: ${progress}% (${current}/${total}) - ${shotId}`);
        lastProgress = progress;
      }
    };

    const result = await batchGenerateSpeech(dialogues, options || {}, onProgress);

    console.log(`[API] TTS生成完成: 成功 ${result.successCount}, 失败 ${result.failCount}`);

    // 计算TTS成本
    const totalTextLength = dialogues.reduce((sum, d) => sum + (d.text?.length || 0), 0);
    const ttsCostEstimate = estimateTTSCost(totalTextLength, options?.engine || 'azure');

    res.json({
      success: true,
      ...result,
      ttsCostEstimate,
    });
  } catch (e) {
    console.error('[API] TTS生成错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 估算TTS成本
// ============================================================
app.post('/api/comic-drama/estimate-tts-cost', (req, res) => {
  const { textLength, engine } = req.body;

  if (!textLength || textLength <= 0) {
    return res.status(400).json({ 
      error: '请提供有效的文本长度',
      success: false,
    });
  }

  try {
    const estimate = estimateTTSCost(textLength, engine || 'azure');
    res.json({
      success: true,
      ...estimate,
    });
  } catch (e) {
    console.error('[API] TTS成本估算错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 智能分集分析
// ============================================================
app.post('/api/comic-drama/analyze-episodes', async (req, res) => {
  const { script, options } = req.body;

  if (!script || !script.trim()) {
    return res.status(400).json({ 
      error: '请输入剧本内容',
      success: false,
    });
  }

  // 限制剧本长度（避免过长导致LLM超时）
  if (script.length > 100000) {
    return res.status(400).json({ 
      error: '剧本过长，请控制在10万字以内',
      success: false,
    });
  }

  try {
    console.log(`[API] 开始智能分集分析，剧本长度: ${script.length}字符`);

    const episodes = await analyzeAndSplitEpisodes(script, options || {});

    // 估算成本
    const costEstimate = estimateEpisodeSplitCost(script.length, episodes.length);

    console.log(`[API] 分集完成: ${episodes.length}集`);

    res.json({
      success: true,
      episodes,
      costEstimate,
      totalDuration: episodes.reduce((sum, ep) => sum + ep.estimated_duration, 0),
      totalShots: episodes.reduce((sum, ep) => sum + ep.estimated_shots, 0),
    });
  } catch (e) {
    console.error('[API] 分集分析错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 批量生成分集分镜
// ============================================================
app.post('/api/comic-drama/generate-episodes-storyboard', async (req, res) => {
  const { script, episodes, options } = req.body;

  if (!script || !episodes || !Array.isArray(episodes) || episodes.length === 0) {
    return res.status(400).json({ 
      error: '请提供剧本和分集列表',
      success: false,
    });
  }

  try {
    console.log(`[API] 开始批量生成${episodes.length}集的分镜脚本...`);

    let lastProgress = 0;
    const onProgress = (current, total, episodeNumber) => {
      const progress = Math.round((current / total) * 100);
      if (progress !== lastProgress) {
        console.log(`[API] 分镜进度: ${progress}% (${current}/${total}) - 第${episodeNumber}集`);
        lastProgress = progress;
      }
    };

    const results = await generateEpisodesStoryboard(script, episodes, onProgress);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[API] 分镜生成完成: 成功${successCount}集, 失败${failCount}集`);

    res.json({
      success: true,
      results,
      successCount,
      failCount,
      total: episodes.length,
    });
  } catch (e) {
    console.error('[API] 批量分镜生成错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// AI漫剧 - 视频合成
// ============================================================
app.post('/api/comic-drama/synthesize-video', async (req, res) => {
  const { images, dialogues, subtitles, bgm, options } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({
      error: '请提供图像列表',
      success: false,
    });
  }

  try {
    console.log(`[API] 开始视频合成: ${images.length}张图像, ${dialogues?.length || 0}条台词`);

    const result = await synthesizeComicVideo({
      images,
      dialogues: dialogues || [],
      subtitles: subtitles || [],
      bgm: bgm || null,
      options: {
        fps: options?.fps || 24,
        resolution: options?.resolution || '1280x720',
        outputDir: options?.outputDir || path.join(__dirname, '../uploads/comic-drama'),
        ttsEngine: options?.ttsEngine || 'azure',
        ttsVoice: options?.ttsVoice,
      },
    });

    console.log('[API] 视频合成完成:', result);
    res.json({
      success: true,
      videoUrl: result.startsWith('/') ? result : `/uploads/comic-drama/${path.basename(result)}`,
      videoPath: result,
    });
  } catch (e) {
    console.error('[API] 视频合成错误:', e.message);
    res.status(500).json({
      error: e.message,
      success: false,
    });
  }
});

// ============================================================
// 辅助函数：计算视频总时长
// ============================================================
function calculateVideoDuration(storyboard) {
  let totalDuration = 0;
  
  storyboard.scenes.forEach(scene => {
    scene.shots.forEach(shot => {
      totalDuration += shot.duration || 3; // 默认3秒
    });
  });

  return totalDuration;
}

// ============================================================
// AI视频剪辑服务
// ============================================================

// 解析自然语言剪辑指令
app.post('/api/video-editor/parse-instruction', async (req, res) => {
  const { instruction, videoInfo } = req.body;

  if (!instruction || !instruction.trim()) {
    return res.status(400).json({ 
      error: '请输入剪辑指令',
      success: false 
    });
  }

  try {
    console.log('[API] 解析剪辑指令:', instruction.substring(0, 100));
    const editingPlan = await parseEditingInstruction(instruction, videoInfo || {});
    
    res.json({
      success: true,
      editingPlan
    });
  } catch (e) {
    console.error('[API] 解析剪辑指令错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false 
    });
  }
});

// 获取视频信息
app.post('/api/video-editor/get-info', async (req, res) => {
  const { videoPath } = req.body;

  if (!videoPath) {
    return res.status(400).json({ 
      error: '请提供视频路径',
      success: false 
    });
  }

  try {
    // 处理相对路径
    const fullPath = videoPath.startsWith('/') 
      ? path.join(__dirname, '..', videoPath)
      : videoPath;
    
    const videoInfo = await getVideoInfo(fullPath);
    
    res.json({
      success: true,
      videoInfo
    });
  } catch (e) {
    console.error('[API] 获取视频信息错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false 
    });
  }
});

// 执行视频剪辑
app.post('/api/video-editor/execute', async (req, res) => {
  const { videoPath, editingPlan } = req.body;

  if (!videoPath || !editingPlan) {
    return res.status(400).json({ 
      error: '请提供视频路径和剪辑方案',
      success: false 
    });
  }

  try {
    console.log('[API] 开始执行视频剪辑...');
    
    // 处理路径
    const fullVideoPath = videoPath.startsWith('/') 
      ? path.join(__dirname, '..', videoPath)
      : videoPath;
    
    const outputDir = path.join(__dirname, '../uploads/video-editor');
    
    const resultPath = await executeVideoEdit(fullVideoPath, editingPlan, outputDir);
    
    // 生成访问URL
    const filename = path.basename(resultPath);
    const videoUrl = `/uploads/video-editor/${filename}`;
    
    console.log('[API] 视频剪辑完成:', videoUrl);
    
    res.json({
      success: true,
      videoUrl,
      videoPath: resultPath,
      editingPlan
    });
  } catch (e) {
    console.error('[API] 视频剪辑错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false 
    });
  }
});

// 智能剔除废片
app.post('/api/video-editor/remove-bad-footage', async (req, res) => {
  const { videoPath, options } = req.body;

  if (!videoPath) {
    return res.status(400).json({ 
      error: '请提供视频路径',
      success: false 
    });
  }

  try {
    console.log('[API] 开始分析废片...');
    
    const fullVideoPath = videoPath.startsWith('/') 
      ? path.join(__dirname, '..', videoPath)
      : videoPath;
    
    const analysis = await removeBadFootage(fullVideoPath, options || {});
    
    console.log('[API] 废片分析完成');
    
    res.json({
      success: true,
      analysis
    });
  } catch (e) {
    console.error('[API] 废片分析错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false 
    });
  }
});

// 估算剪辑成本
app.post('/api/video-editor/estimate-cost', (req, res) => {
  const { videoDuration } = req.body;

  if (!videoDuration || videoDuration <= 0) {
    return res.status(400).json({ 
      error: '请提供有效的视频时长',
      success: false 
    });
  }

  try {
    const estimate = estimateEditingCost(videoDuration);
    res.json({
      success: true,
      ...estimate
    });
  } catch (e) {
    console.error('[API] 成本估算错误:', e.message);
    res.status(500).json({ 
      error: e.message,
      success: false 
    });
  }
});

// ============================================================
// 文件上传
// ============================================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
  });
});

// ============================================================
// 健康检查
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件过大（最大50MB）' });
    }
    return res.status(400).json({ error: '文件上传失败' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const server = app.listen(PORT, () => {
  console.log(`AI漫剧创作平台 后端服务: http://localhost:${PORT}`);
  console.log(`图像生成提供商: ${config.IMAGE_PROVIDER === 'pollinations' ? 'Pollinations.ai (免费) ✓' : '硅基流动 (付费)'}`);
  console.log(`文生图 (硅基流动): ${config.SILICONFLOW_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`图生视频 (硅基流动): ${config.SILICONFLOW_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`DeepSeek API: ${config.DEEPSEEK_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`分镜生成 (LLM): ${config.DEEPSEEK_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`批量图像生成: ${config.SILICONFLOW_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`TTS配音服务: ${config.AZURE_TTS_KEY || config.ELEVENLABS_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`FFmpeg视频合成: 待检测`);
  console.log(`AI视频剪辑服务: ${config.DEEPSEEK_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`✓ 支持自然语言剪辑指令`);
  console.log(`✓ 智能废片剔除`);
  console.log(`✓ 相比专业软件月费$60，可节省大量成本`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，开始优雅关闭...');
  server.close(() => {
    console.log('HTTP 服务已关闭');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('强制退出（超时）');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，开始关闭...');
  server.close(() => process.exit(0));
});
