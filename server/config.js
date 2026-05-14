import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  PORT: process.env.PORT || 3000,

  // Replicate API
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',

  // 文生图模型
  REPLICATE_TEXT2IMG_MODEL: process.env.REPLICATE_TEXT2IMG_MODEL || 'black-forest-labs/flux-schnell',

  // 图生视频模型
  REPLICATE_IMG2VIDEO_MODEL: process.env.REPLICATE_IMG2VIDEO_MODEL || 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',

  // 图像生成提供商: pollinations (免费) | siliconflow (付费)
  IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || 'pollinations',

  // Pollinations.ai（免费，无需 API Key）
  POLLINATIONS_IMAGE_MODEL: process.env.POLLINATIONS_IMAGE_MODEL || 'flux',

  // 硅基流动 API
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY || '',
  SILICONFLOW_TEXT2IMG_MODEL: process.env.SILICONFLOW_TEXT2IMG_MODEL || 'Qwen/Qwen-Image',
  SILICONFLOW_IMG2VIDEO_MODEL: process.env.SILICONFLOW_IMG2VIDEO_MODEL || 'Wan-AI/Wan2.2-I2V-A14B',

  // DeepSeek AI
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',

  // TTS 服务
  AZURE_TTS_KEY: process.env.AZURE_TTS_KEY || '',
  AZURE_TTS_REGION: process.env.AZURE_TTS_REGION || 'eastus',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',

  // 数据库
  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'mvp.db'),

  // CORS - 支持逗号分隔的环境变量字符串和直接数组
  ALLOWED_ORIGINS: (() => {
    const raw = process.env.ALLOWED_ORIGINS;
    if (!raw) return ['http://localhost:5173', 'http://localhost:5174'];
    if (Array.isArray(raw)) return raw;
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  })(),
};

export default config;
