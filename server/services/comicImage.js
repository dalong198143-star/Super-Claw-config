import fetch from 'node-fetch';
import config from '../config.js';

const SF_IMAGE_API = 'https://api.siliconflow.cn/v1/images/generations';

/**
 * 检查是否为演示模式
 */
function isDemoMode() {
  return !config.SILICONFLOW_API_KEY;
}

/**
 * 生成单张图像（用于漫剧镜头）
 * @param {string} prompt - 英文提示词
 * @param {object} options - 配置选项
 * @returns {Promise<object>} 包含url和seed的结果对象
 */
export async function generateComicImage(prompt, options = {}) {
  if (isDemoMode()) {
    console.log('[SiliconFlow Demo] 生成漫剧图像');
    const demoId = `comic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      url: `https://picsum.photos/seed/${demoId}/${options.width || 512}/${options.height || 512}`,
      seed: 0,
      cost: 0,
    };
  }

  // 验证提示词
  if (!prompt || prompt.trim().length < 10) {
    throw new Error('提示词太短，至少需要10个字符');
  }

  try {
    const res = await fetch(SF_IMAGE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.SILICONFLOW_TEXT2IMG_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: prompt.trim(),
        image_size: `${options.width || 512}x${options.height || 512}`,
        num_inference_steps: options.steps || 30,
        guidance_scale: options.guidance || 7.5,
        ...(options.seed && options.seed > 0 ? { seed: options.seed } : {}),
        negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, deformed',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `硅基流动API错误: ${res.status}`);
    }

    const data = await res.json();
    const imageUrl = data.images?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('生成失败：未返回图片URL');
    }

    return {
      url: imageUrl,
      seed: data.seed || 0,
      cost: data.cost || 0,
      generationTime: data.generation_time || 0,
    };
  } catch (error) {
    console.error('[SiliconFlow] 图像生成失败:', error.message);
    throw error;
  }
}

/**
 * 批量生成图像（用于漫剧所有镜头）
 * @param {Array} shots - 镜头数组，每个元素包含shot_id和prompt
 * @param {object} options - 全局配置选项
 * @param {Function} onProgress - 进度回调函数 (current, total, shotId)
 * @returns {Promise<Array>} 生成结果数组
 */
export async function batchGenerateImages(shots, options = {}, onProgress = null) {
  if (!shots || shots.length === 0) {
    throw new Error('镜头列表为空');
  }

  const results = [];
  const errors = [];
  const total = shots.length;

  console.log(`[BatchGenerate] 开始批量生成 ${total} 张图像...`);

  // 顺序生成（避免并发过多导致API限流）
  for (let i = 0; i < total; i++) {
    const shot = shots[i];
    const shotId = shot.shot_id || shot.shotId || `shot_${i + 1}`;

    try {
      console.log(`[BatchGenerate] 生成镜头 ${i + 1}/${total}: ${shotId}`);
      
      const result = await generateComicImage(shot.prompt, {
        width: options.width || 512,
        height: options.height || 512,
        steps: options.steps || 30,
        guidance: options.guidance || 7.5,
        negativePrompt: options.negativePrompt,
      });

      results.push({
        shotId,
        success: true,
        url: result.url,
        seed: result.seed,
        cost: result.cost,
        generationTime: result.generationTime,
        timestamp: new Date().toISOString(),
      });

      // 调用进度回调
      if (onProgress) {
        onProgress(i + 1, total, shotId);
      }

      // 添加小延迟避免API限流
      if (i < total - 1) {
        await sleep(1000);
      }
    } catch (error) {
      console.error(`[BatchGenerate] 镜头 ${shotId} 生成失败:`, error.message);
      
      errors.push({
        shotId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // 即使失败也继续下一个
      if (onProgress) {
        onProgress(i + 1, total, shotId);
      }
    }
  }

  console.log(`[BatchGenerate] 完成: 成功 ${results.length}, 失败 ${errors.length}`);

  return {
    results,
    errors,
    total,
    successCount: results.length,
    failCount: errors.length,
    completedAt: new Date().toISOString(),
  };
}

/**
 * 辅助函数：延迟
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取生成成本估算
 * @param {number} shotCount - 镜头数量
 * @returns {object} 成本估算信息
 */
export function estimateCost(shotCount) {
  // SiliconFlow定价（示例，需根据实际API定价调整）
  const costPerImage = 0.01; // 每张图约0.01元
  const totalCost = shotCount * costPerImage;

  return {
    shotCount,
    costPerImage,
    totalCost: totalCost.toFixed(2),
    currency: 'CNY',
    note: '实际费用以API账单为准',
  };
}
