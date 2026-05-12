import fetch from 'node-fetch';
import config from '../config.js';

const SF_API = 'https://api.siliconflow.cn/v1';
const SF_VIDEO_API = `${SF_API}/video`;
const SF_IMAGE_API = `${SF_API}/images/generations`;

function isDemoMode() {
  return !config.SILICONFLOW_API_KEY;
}

/**
 * 文生图
 */
export async function textToImage(prompt, options = {}) {
  if (isDemoMode()) {
    console.log('[SiliconFlow Demo] 文生图');
    const demoId = `sf-t2i-${Date.now()}`;
    return {
      url: `https://picsum.photos/seed/${demoId}/${options.width || 512}/${options.height || 512}`,
    };
  }

  const res = await fetch(SF_IMAGE_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.SILICONFLOW_TEXT2IMG_MODEL,
      prompt,
      image_size: `${options.width || 512}x${options.height || 512}`,
      ...(options.seed && options.seed > 0 ? { seed: options.seed } : {}),
      ...(options.guidance ? { guidance_scale: options.guidance } : {}),
      ...(options.steps ? { num_inference_steps: options.steps } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `硅基流动文生图错误: ${res.status}`);
  }

  const data = await res.json();
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) throw new Error('生成失败：未返回图片');

  return { url: imageUrl, seed: data.seed };
}

/**
 * 提交图生视频任务
 */
export async function submitImageToVideo(image, options = {}) {
  if (isDemoMode()) {
    console.log('[SiliconFlow Demo] 创建图生视频任务');
    const demoId = `sf-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return { requestId: demoId, status: 'processing' };
  }

  const isUrl = image.startsWith('http://') || image.startsWith('https://');
  console.log('[SiliconFlow] 图片类型:', isUrl ? 'URL' : 'base64', '长度:', image.length);

  // URL → base64 转换（API 要求 base64）
  let imageData = image;
  if (isUrl) {
    console.log('[SiliconFlow] 下载图片:', image.substring(0, 80));
    const imgRes = await fetch(image);
    if (!imgRes.ok) throw new Error(`下载图片失败: ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // 从 URL 扩展名推断 MIME（CDN 常返回 application/octet-stream）
    const urlPath = image.split('?')[0];
    const ext = urlPath.split('.').pop().toLowerCase();
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
    const mime = mimeMap[ext] || imgRes.headers.get('content-type') || 'image/png';

    imageData = `data:${mime};base64,${buffer.toString('base64')}`;
    console.log('[SiliconFlow] 转换完成, base64长度:', imageData.length, 'mime:', mime);
  }

  const body = {
    model: config.SILICONFLOW_IMG2VIDEO_MODEL,
    prompt: options.prompt || '画面缓慢自然运动',
    image: imageData,
    image_size: options.image_size || '1280x720',
    ...(options.negative_prompt ? { negative_prompt: options.negative_prompt } : {}),
    ...(options.seed ? { seed: options.seed } : {}),
  };
  const bodyStr = JSON.stringify(body);
  console.log('[SiliconFlow] 提交, model:', body.model, 'imgSize:', body.image_size,
    'imageLen:', imageData.length, 'bodyLen:', bodyStr.length);

  // 重试逻辑（500 错误重试最多 3 次）
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${SF_VIDEO_API}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[SiliconFlow] 成功, requestId:', data.requestId);
      return { requestId: data.requestId, status: 'processing' };
    }

    const errText = await res.text();
    console.error(`[SiliconFlow] 尝试${attempt}/3 失败, status:`, res.status, 'body:', errText || '(空)');

    // 4xx 不重试
    if (res.status < 500) {
      let errMsg = `硅基流动 API 错误: ${res.status}`;
      try { const errJson = JSON.parse(errText); errMsg = errJson.message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    lastError = `硅基流动 API 错误: ${res.status}`;
    if (attempt < 3) {
      console.log('[SiliconFlow] 2秒后重试...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  throw new Error(lastError);
}

/**
 * 轮询视频生成状态
 */
export async function getVideoStatus(requestId) {
  // Demo 模式
  if (requestId.startsWith('sf-demo-')) {
    const elapsed = Date.now() - parseInt(requestId.match(/\d+/)?.[0] || Date.now());
    const total = 8000;
    const progress = Math.min(Math.round((elapsed / total) * 100), 100);

    if (progress >= 100) {
      return {
        status: 'succeeded',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        progress: 100,
      };
    }
    return { status: 'processing', url: null, progress };
  }

  if (!config.SILICONFLOW_API_KEY) {
    throw new Error('SILICONFLOW_API_KEY 未配置');
  }

  const res = await fetch(`${SF_VIDEO_API}/status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `查询视频状态失败: ${res.status}`);
  }

  const data = await res.json();

  const sfStatus = data.status;
  const videoUrl = data.results?.videos?.[0]?.url || null;

  return {
    status: sfStatus === 'Succeed' ? 'succeeded'
      : sfStatus === 'Failed' ? 'failed'
      : 'processing',
    url: videoUrl,
    progress: sfStatus === 'Succeed' ? 100
      : sfStatus === 'Failed' ? 0
      : 30,
    error: data.reason || data.error?.message || null,
  };
}
