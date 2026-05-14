import fetch from 'node-fetch';

const POLLINATIONS_API = 'https://image.pollinations.ai/prompt';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 生成单张图像（带重试 + 指数退避）
 */
export async function generatePollinationsImage(prompt, options = {}) {
  const width = options.width || 512;
  const height = options.height || 512;
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const model = options.model || 'turbo';

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const url = `${POLLINATIONS_API}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        console.log(`[Pollinations] 重试 ${attempt}/${MAX_RETRIES - 1}, 等待 ${delay / 1000}s...`);
        await sleep(delay);
      }

      console.log(`[Pollinations] ${attempt > 0 ? '重试' : '生成'} (${model} ${width}x${height}): ${prompt.slice(0, 50)}...`);
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      if (res.status === 429) {
        throw new Error('RATE_LIMIT');
      }

      if (!res.ok) {
        throw new Error(`Pollinations API 错误: ${res.status}`);
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 100) {
        throw new Error('生成失败：返回图片数据异常');
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      return {
        url: dataUrl,
        seed,
        cost: 0,
        provider: 'pollinations',
        retries: attempt,
      };
    } catch (error) {
      lastError = error;
      if (error.message === 'RATE_LIMIT' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

/**
 * 批量生成图像
 */
export async function batchGeneratePollinations(shots, options = {}, onProgress = null) {
  if (!shots || shots.length === 0) {
    throw new Error('镜头列表为空');
  }

  const total = shots.length;
  console.log(`[Pollinations] 开始批量生成 ${total} 张图像（免费，模型: ${options.model || 'turbo'}）...`);

  const results = [];
  const errors = [];

  for (let i = 0; i < total; i++) {
    const shot = shots[i];
    const shotId = shot.shot_id || shot.shotId || `shot_${i + 1}`;

    try {
      console.log(`[Pollinations] 生成镜头 ${i + 1}/${total}: ${shotId}`);
      const result = await generatePollinationsImage(shot.prompt, options);

      results.push({
        shotId,
        success: true,
        url: result.url,
        seed: result.seed,
        provider: 'pollinations',
        timestamp: new Date().toISOString(),
      });

      if (onProgress) onProgress(i + 1, total, shotId);

      // 限流保护：每张图间隔 3 秒
      if (i < total - 1) {
        await sleep(3000);
      }
    } catch (error) {
      console.error(`[Pollinations] 镜头 ${shotId} 生成失败:`, error.message);
      errors.push({
        shotId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      if (onProgress) onProgress(i + 1, total, shotId);

      // 失败后也稍等一下再继续
      if (i < total - 1) {
        await sleep(2000);
      }
    }
  }

  console.log(`[Pollinations] 完成: 成功 ${results.length}, 失败 ${errors.length}`);
  return {
    results,
    errors,
    total,
    successCount: results.length,
    failCount: errors.length,
    completedAt: new Date().toISOString(),
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
