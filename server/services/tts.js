import config from '../config.js';

/**
 * TTS配音服务
 * 支持多种TTS引擎：Azure、ElevenLabs、Coqui
 */

// ============================================================
// Azure TTS
// ============================================================

/**
 * 使用Azure TTS生成语音
 * @param {string} text - 要转换的文本
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 音频文件URL
 */
export async function azureTTS(text, options = {}) {
  if (!config.AZURE_TTS_KEY || !config.AZURE_TTS_REGION) {
    throw new Error('AZURE_TTS_KEY 或 AZURE_TTS_REGION 未配置');
  }

  const {
    voice = 'zh-CN-XiaoxiaoNeural', // 默认中文女声
    language = 'zh-CN',
    rate = '1.0', // 语速
    pitch = '0Hz', // 音调
    format = 'audio-16khz-32kbitrate-mono-mp3',
  } = options;

  try {
    // Azure TTS REST API
    const tokenUrl = `https://${config.AZURE_TTS_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;
    
    // 获取访问令牌
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.AZURE_TTS_KEY,
      },
    });

    if (!tokenRes.ok) {
      throw new Error(`Azure TTS Token获取失败: ${tokenRes.status}`);
    }

    const token = await tokenRes.text();

    // 合成语音
    const ssml = generateSSML(text, voice, language, rate, pitch);
    
    const ttsUrl = `https://${config.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const audioRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': format,
        'User-Agent': 'ComicDramaTTS',
      },
      body: ssml,
    });

    if (!audioRes.ok) {
      throw new Error(`Azure TTS合成失败: ${audioRes.status}`);
    }

    // 返回音频Blob URL（实际项目中应上传到云存储）
    const audioBuffer = await audioRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error) {
    console.error('[Azure TTS] 错误:', error.message);
    throw error;
  }
}

/**
 * 生成SSML（Speech Synthesis Markup Language）
 */
function generateSSML(text, voice, language, rate, pitch) {
  return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
  <voice name="${voice}">
    <prosody rate="${rate}" pitch="${pitch}">
      ${text}
    </prosody>
  </voice>
</speak>
  `.trim();
}

// ============================================================
// ElevenLabs TTS
// ============================================================

/**
 * 使用ElevenLabs TTS生成语音
 * @param {string} text - 要转换的文本
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 音频文件URL
 */
export async function elevenLabsTTS(text, options = {}) {
  if (!config.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY 未配置');
  }

  const {
    voiceId = 'EXAVITQu4vr4xnSDxMaL', // 默认声音ID
    model = 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options;

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': config.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail?.message || `ElevenLabs TTS失败: ${res.status}`);
    }

    // 返回音频Blob URL
    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error) {
    console.error('[ElevenLabs TTS] 错误:', error.message);
    throw error;
  }
}

// ============================================================
// Coqui TTS（开源方案，需自建服务）
// ============================================================

/**
 * 使用Coqui TTS生成语音（需要自建服务）
 * @param {string} text - 要转换的文本
 * @param {object} options - 配置选项
 * @returns {Promise<string>} 音频文件URL
 */
export async function coquiTTS(text, options = {}) {
  if (!config.COQUI_TTS_URL) {
    throw new Error('COQUI_TTS_URL 未配置（Coqui TTS需要自建服务）');
  }

  const {
    speaker = 'default',
    language = 'zh',
  } = options;

  try {
    const res = await fetch(config.COQUI_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        speaker_name: speaker,
        language,
      }),
    });

    if (!res.ok) {
      throw new Error(`Coqui TTS失败: ${res.status}`);
    }

    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/wav;base64,${base64Audio}`;
  } catch (error) {
    console.error('[Coqui TTS] 错误:', error.message);
    throw error;
  }
}

// ============================================================
// 统一TTS接口
// ============================================================

/**
 * 统一的TTS生成接口
 * @param {string} text - 要转换的文本
 * @param {object} options - 配置选项
 * @param {string} options.engine - TTS引擎（azure/elevenlabs/coqui）
 * @returns {Promise<string>} 音频文件URL
 */
export async function generateSpeech(text, options = {}) {
  const engine = options.engine || 'azure';

  switch (engine) {
    case 'azure':
      return await azureTTS(text, options);
    case 'elevenlabs':
      return await elevenLabsTTS(text, options);
    case 'coqui':
      return await coquiTTS(text, options);
    default:
      throw new Error(`不支持的TTS引擎: ${engine}`);
  }
}

// ============================================================
// 批量TTS生成（用于漫剧所有台词）
// ============================================================

/**
 * 批量生成台词语音
 * @param {Array} dialogues - 台词数组 [{shotId, text, character}]
 * @param {object} options - 全局配置
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Array>} 生成结果数组
 */
export async function batchGenerateSpeech(dialogues, options = {}, onProgress = null) {
  if (!dialogues || dialogues.length === 0) {
    throw new Error('台词列表为空');
  }

  const results = [];
  const errors = [];
  const total = dialogues.length;

  console.log(`[BatchTTS] 开始批量生成 ${total} 条语音...`);

  for (let i = 0; i < total; i++) {
    const dialogue = dialogues[i];
    
    try {
      console.log(`[BatchTTS] 生成语音 ${i + 1}/${total}: ${dialogue.shotId}`);
      
      const audioUrl = await generateSpeech(dialogue.text, {
        engine: options.engine || 'azure',
        voice: options.voice,
        ...options,
      });

      results.push({
        shotId: dialogue.shotId,
        success: true,
        audioUrl,
        character: dialogue.character,
        duration: estimateAudioDuration(dialogue.text), // 估算时长
        timestamp: new Date().toISOString(),
      });

      if (onProgress) {
        onProgress(i + 1, total, dialogue.shotId);
      }

      // 添加小延迟避免API限流
      if (i < total - 1) {
        await sleep(500);
      }
    } catch (error) {
      console.error(`[BatchTTS] 语音 ${dialogue.shotId} 生成失败:`, error.message);
      
      errors.push({
        shotId: dialogue.shotId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (onProgress) {
        onProgress(i + 1, total, dialogue.shotId);
      }
    }
  }

  console.log(`[BatchTTS] 完成: 成功 ${results.length}, 失败 ${errors.length}`);

  return {
    results,
    errors,
    total,
    successCount: results.length,
    failCount: errors.length,
    completedAt: new Date().toISOString(),
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 估算音频时长（秒）
 * 基于平均语速：中文约3字/秒，英文约2.5词/秒
 */
function estimateAudioDuration(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // 中文按3字/秒，英文按2.5词/秒
  const duration = (chineseChars / 3) + (englishWords / 2.5);
  return Math.max(duration, 0.5); // 最少0.5秒
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取TTS成本估算
 * @param {number} textLength - 文本总字符数
 * @param {string} engine - TTS引擎
 * @returns {object} 成本估算信息
 */
export function estimateTTSCost(textLength, engine = 'azure') {
  const costs = {
    azure: {
      perChar: 0.00016, // Azure TTS定价：$16/百万字符
      currency: 'USD',
    },
    elevenlabs: {
      perChar: 0.0003, // ElevenLabs定价：$0.30/千字符
      currency: 'USD',
    },
    coqui: {
      perChar: 0, // 开源免费
      currency: 'CNY',
    },
  };

  const cost = costs[engine] || costs.azure;
  const totalCost = textLength * cost.perChar;

  return {
    textLength,
    engine,
    costPerChar: cost.perChar,
    totalCost: totalCost.toFixed(4),
    currency: cost.currency,
    note: '实际费用以API账单为准',
  };
}
