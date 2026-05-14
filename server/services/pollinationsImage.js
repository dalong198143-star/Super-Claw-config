import fetch from 'node-fetch';

const POLLINATIONS_API = 'https://image.pollinations.ai/prompt';
const REQUEST_TIMEOUT_MS = 15000;

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
 * Pollinations.ai 生成图片（最多重试 1 次）
 * 失败时自动降级到 picsum 占位图，保证流程不中断
 */
async function tryPollinations(prompt, options) {
  const width = options.width || 512;
  const height = options.height || 512;
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const model = options.model || 'turbo';

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const url = `${POLLINATIONS_API}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Pollinations] 重试 (等待4s)...`);
        await sleep(4000);
      }
      console.log(`[Pollinations] ${attempt > 0 ? '重试' : '请求'} (${model} ${width}x${height}): ${prompt.slice(0, 50)}...`);
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      if (res.status === 429) continue;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 100) continue;

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const base64 = Buffer.from(buffer).toString('base64');
      return { url: `data:${contentType};base64,${base64}`, provider: 'pollinations' };
    } catch (e) {
      if (e.name === 'AbortError') continue;
      throw e;
    }
  }
  return null; // 降级
}

/**
 * picsum 兜底图片
 */
function picsumFallback(seed, width, height) {
  const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  console.log(`[PicSum] 降级兜底: ${url}`);
  return { url, provider: 'picsum_fallback' };
}

/**
 * 生成单张图像（自动降级，保证不失败）
 */
export async function generatePollinationsImage(prompt, options = {}) {
  const width = options.width || 512;
  const height = options.height || 512;
  const seed = options.seed || Math.floor(Math.random() * 1000000);

  const result = await tryPollinations(prompt, { ...options, width, height, seed });
  if (result) return { ...result, seed, cost: 0 };

  return { ...picsumFallback(seed, width, height), seed, cost: 0 };
}

/**
 * 批量生成图像（自动降级，永不失败）
 */
export async function batchGeneratePollinations(shots, options = {}, onProgress = null) {
  if (!shots || shots.length === 0) {
    throw new Error('镜头列表为空');
  }

  const total = shots.length;
  console.log(`[Pollinations] 批量生成 ${total} 张（限流失败自动降级 picsum）...`);

  const results = [];
  const errors = [];

  for (let i = 0; i < total; i++) {
    const shot = shots[i];
    const shotId = shot.shot_id || shot.shotId || `shot_${i + 1}`;

    console.log(`[Pollinations] ${i + 1}/${total}: ${shotId}`);
    const result = await generatePollinationsImage(shot.prompt, options);

    results.push({
      shotId,
      success: true,
      url: result.url,
      seed: result.seed,
      provider: result.provider,
      timestamp: new Date().toISOString(),
    });

    if (onProgress) onProgress(i + 1, total, shotId);

    if (i < total - 1) {
      await sleep(2000);
    }
  }

  console.log(`[Pollinations] 完成: 成功 ${results.length}, 失败 ${errors.length}`
    + ` (pollinations: ${results.filter(r => r.provider === 'pollinations').length},`
    + ` picsum: ${results.filter(r => r.provider === 'picsum_fallback').length})`);

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
