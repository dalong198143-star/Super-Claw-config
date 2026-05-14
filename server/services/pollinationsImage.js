import fetch from 'node-fetch';

const POLLINATIONS_API = 'https://image.pollinations.ai/prompt';

/**
 * 生成单张图像（使用 Pollinations.ai 免费 API）
 * @param {string} prompt - 英文提示词
 * @param {object} options - 配置选项
 * @returns {Promise<object>} 包含url的结果对象
 */
export async function generatePollinationsImage(prompt, options = {}) {
  const width = options.width || 512;
  const height = options.height || 512;
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const model = options.model || 'flux';

  const encodedPrompt = encodeURIComponent(prompt.trim());
  const url = `${POLLINATIONS_API}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

  console.log(`[Pollinations] 生成图像: ${prompt.slice(0, 60)}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Pollinations API 错误: ${res.status}`);
    }

    // Pollinations 直接返回图片，需要下载为 buffer 来验证
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 100) {
      throw new Error('生成失败：返回图片数据异常');
    }

    // 转为 base64 data URL，避免外链失效
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return {
      url: dataUrl,
      seed,
      cost: 0,
      provider: 'pollinations',
      generationTime: 0,
    };
  } catch (error) {
    console.error('[Pollinations] 图像生成失败:', error.message);
    throw error;
  }
}

/**
 * 批量生成图像
 */
export async function batchGeneratePollinations(shots, options = {}, onProgress = null) {
  if (!shots || shots.length === 0) {
    throw new Error('镜头列表为空');
  }

  const total = shots.length;
  console.log(`[Pollinations] 开始批量生成 ${total} 张图像（免费）...`);

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

      // Pollinations 免费 API 有速率限制，加延迟
      if (i < total - 1) {
        await sleep(1500);
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
