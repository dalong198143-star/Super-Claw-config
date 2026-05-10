import fetch from 'node-fetch';
import config from '../config.js';

const REPLICATE_API = 'https://api.replicate.com/v1';

// Demo 模式：存储模拟的预测任务
const demos = new Map();

function isDemoMode() {
  return !config.REPLICATE_API_TOKEN;
}

function makeDemoId(type) {
  const id = `demo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  demos.set(id, { type, createdAt: Date.now(), duration: type === 'img2video' ? 8000 : 2000 });
  return id;
}

/**
 * 创建 Replicate 预测（无 Token 时降级为 demo 模式）
 */
async function createPrediction(model, input, type) {
  if (isDemoMode()) {
    console.log(`[Demo] 创建 ${type} 任务`);
    return { predictionId: makeDemoId(type), status: 'processing' };
  }

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: model, input }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Replicate API error: ${res.status}`);
  }

  const data = await res.json();
  return { predictionId: data.id, status: data.status };
}

/**
 * 轮询预测状态（demo 模式模拟进度）
 */
export async function getPrediction(predictionId) {
  // Demo 模式
  if (predictionId.startsWith('demo-')) {
    const info = demos.get(predictionId);
    if (!info) {
      return { status: 'failed', output: null, progress: 0, error: '任务不存在' };
    }

    const elapsed = Date.now() - info.createdAt;
    const progress = Math.min(Math.round((elapsed / info.duration) * 100), 100);

    if (progress >= 100) {
      demos.delete(predictionId);
      if (info.type === 'img2video') {
        return {
          status: 'succeeded',
          output: 'https://www.w3schools.com/html/mov_bbb.mp4',
          progress: 100,
          error: null,
        };
      }
      return {
        status: 'succeeded',
        output: ['https://picsum.photos/seed/' + predictionId + '/512/512'],
        progress: 100,
        error: null,
      };
    }

    return { status: 'processing', output: null, progress, error: null };
  }

  // 真实模式
  if (!config.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN 未配置');
  }

  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: { 'Authorization': `Bearer ${config.REPLICATE_API_TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Replicate API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    output: data.output || null,
    progress: data.status === 'succeeded' ? 100
      : data.status === 'processing' ? Math.min(Math.round((data.logs?.length || 0) / 30 * 100), 95)
      : 0,
    error: data.error || null,
  };
}

/**
 * 文生图
 */
export async function textToImage(prompt, options = {}) {
  const input = {
    prompt,
    width: Math.min(Math.max(parseInt(options.width) || 512, 256), 1024),
    height: Math.min(Math.max(parseInt(options.height) || 512, 256), 1024),
    num_inference_steps: Math.min(Math.max(parseInt(options.steps) || 4, 1), 8),
    ...(options.guidance != null ? { guidance_scale: parseFloat(options.guidance) } : {}),
    ...(options.negative_prompt ? { negative_prompt: options.negative_prompt } : {}),
    ...(options.seed && parseInt(options.seed) > 0 ? { seed: parseInt(options.seed) } : {}),
  };

  return await createPrediction(config.REPLICATE_TEXT2IMG_MODEL, input, 'text2img');
}

/**
 * 图生视频
 */
export async function imageToVideo(base64Image, options = {}) {
  const input = {
    input_image: base64Image,
    video_length: options.video_length || '14_frames',
    sizing_strategy: options.sizing_strategy || 'maintain_aspect_ratio',
    frames_per_second: options.fps || 7,
    motion_bucket_id: options.motion_bucket_id || 127,
    ...(options.cond_aug != null ? { cond_aug: options.cond_aug } : {}),
  };

  return await createPrediction(config.REPLICATE_IMG2VIDEO_MODEL, input, 'img2video');
}
