import fetch from 'node-fetch';
import config from '../config.js';

/**
 * 智能分集服务
 * 将长剧本自动拆分为多个剧集（Episode）
 */

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 检查API密钥是否配置
 */
function checkApiKey() {
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 中设置');
  }
}

/**
 * 智能分析剧本结构并分集
 * @param {string} script - 完整剧本文本
 * @param {object} options - 分集配置选项
 * @returns {Promise<Array>} 分集列表
 */
export async function analyzeAndSplitEpisodes(script, options = {}) {
  checkApiKey();

  const {
    targetDurationPerEpisode = 300, // 每集目标时长（秒），默认5分钟
    maxEpisodes = 20,               // 最大分集数
    style = 'modern_anime',         // 动漫风格
    language = 'zh-CN',             // 语言
  } = options;

  // 估算总镜头数（假设平均每镜头3秒）
  const estimatedTotalShots = Math.ceil(script.length / 150); // 每150字符约1个镜头
  const estimatedTotalDuration = estimatedTotalShots * 3;
  const estimatedEpisodes = Math.ceil(estimatedTotalDuration / targetDurationPerEpisode);

  console.log(`[EpisodeSplit] 剧本分析: 长度${script.length}字符, 预估${estimatedEpisodes}集`);

  try {
    // Step 1: 调用LLM分析剧本结构
    const episodes = await callLLMForEpisodeSplit(script, {
      targetDurationPerEpisode,
      maxEpisodes,
      estimatedEpisodes,
      style,
      language,
    });

    // Step 2: 验证和优化分集结果
    const validatedEpisodes = validateEpisodes(episodes, script, options);

    console.log(`[EpisodeSplit] 分集完成: ${validatedEpisodes.length}集`);

    return validatedEpisodes;
  } catch (error) {
    console.error('[EpisodeSplit] 分集失败:', error.message);
    
    // 降级方案：使用简单规则分集
    console.log('[EpisodeSplit] 使用降级方案（规则分集）...');
    return fallbackRuleBasedSplit(script, options);
  }
}

/**
 * 调用LLM进行智能分集
 */
async function callLLMForEpisodeSplit(script, options) {
  const systemPrompt = `你是一位专业的动漫剧本编辑和分集导演。你的任务是将长篇剧本智能地拆分为多个剧集（Episode）。

分集原则：
1. **剧情完整性**：每集应该有相对完整的剧情段落，避免在关键情节中间切断
2. **节奏控制**：每集时长控制在${options.targetDurationPerEpisode}秒左右（约${Math.floor(options.targetDurationPerEpisode / 60)}分钟）
3. **悬念设置**：每集结尾应设置适当的悬念或转折，吸引观众继续观看
4. **角色平衡**：确保每集都有主要角色的出场和发展
5. **场景连贯**：尽量避免在同一场景中间切断

输出格式要求：
必须返回严格的JSON数组格式，每个元素包含：
- episode_number: 集数（从1开始）
- title: 本集标题（简洁有力，5-15字）
- summary: 本集剧情摘要（50-100字）
- start_position: 在原文中的起始位置（字符索引）
- end_position: 在原文中的结束位置（字符索引）
- estimated_duration: 预估时长（秒）
- estimated_shots: 预估镜头数
- key_characters: 本集主要角色列表
- climax_level: 高潮程度（low/medium/high）
- hook: 本集结尾的悬念或钩子（一句话）

示例输出：
[
  {
    "episode_number": 1,
    "title": "急诊室的深夜",
    "summary": "李明医生在深夜急诊室面对第一个重大挑战...",
    "start_position": 0,
    "end_position": 2500,
    "estimated_duration": 280,
    "estimated_shots": 93,
    "key_characters": ["李明", "张医生"],
    "climax_level": "medium",
    "hook": "突然，急救车送来了一名神秘病人..."
  }
]

注意：
- start_position 和 end_position 必须是数字，对应原文的字符索引
- 所有集的 end_position 应该覆盖整个剧本，无遗漏无重叠
- 第一集的 start_position 必须是 0
- 最后一集的 end_position 应该等于剧本总长度`;

  const userPrompt = `请分析以下剧本并进行智能分集：

剧本内容（前2000字符预览）：
${script.substring(0, 2000)}${script.length > 2000 ? '...' : ''}

剧本总长度：${script.length} 字符
预估集数：${options.estimatedEpisodes} 集
每集目标时长：${options.targetDurationPerEpisode} 秒

请返回JSON格式的分集方案。`;

  const response = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `LLM API错误: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('LLM返回内容为空');
  }

  // 解析JSON响应
  const episodes = parseLLMResponse(content);

  return episodes;
}

/**
 * 解析LLM返回的JSON响应
 */
function parseLLMResponse(content) {
  try {
    // 尝试直接解析
    const episodes = JSON.parse(content);
    
    if (!Array.isArray(episodes)) {
      throw new Error('LLM返回的不是数组格式');
    }

    // 验证基本结构
    episodes.forEach((ep, idx) => {
      if (!ep.episode_number || !ep.title || ep.start_position === undefined || ep.end_position === undefined) {
        throw new Error(`第${idx + 1}集缺少必要字段`);
      }
    });

    return episodes;
  } catch (error) {
    // 尝试提取JSON代码块
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const episodes = JSON.parse(jsonMatch[1]);
        return episodes;
      } catch (e) {
        throw new Error(`JSON解析失败: ${error.message}`);
      }
    }

    throw new Error(`无法解析LLM响应: ${error.message}`);
  }
}

/**
 * 验证和优化分集结果
 */
function validateEpisodes(episodes, script, options) {
  const validated = [];
  let currentPosition = 0;

  episodes.forEach((ep, idx) => {
    // 修正位置偏移
    const correctedEp = {
      ...ep,
      episode_number: idx + 1,
      start_position: Math.max(currentPosition, ep.start_position || 0),
      end_position: Math.min(script.length, ep.end_position || script.length),
    };

    // 提取本集实际文本
    const episodeText = script.substring(correctedEp.start_position, correctedEp.end_position);
    correctedEp.text_length = episodeText.length;
    
    // 重新计算预估时长和镜头数
    correctedEp.estimated_shots = Math.ceil(episodeText.length / 150);
    correctedEp.estimated_duration = correctedEp.estimated_shots * 3;

    validated.push(correctedEp);
    currentPosition = correctedEp.end_position;
  });

  // 检查是否有遗漏
  if (currentPosition < script.length) {
    console.warn(`[EpisodeSplit] 警告: 剧本末尾有${script.length - currentPosition}字符未被分集覆盖`);
    
    // 添加最后一集覆盖剩余内容
    validated.push({
      episode_number: validated.length + 1,
      title: '最终章',
      summary: '故事结局',
      start_position: currentPosition,
      end_position: script.length,
      text_length: script.length - currentPosition,
      estimated_shots: Math.ceil((script.length - currentPosition) / 150),
      estimated_duration: Math.ceil((script.length - currentPosition) / 150) * 3,
      key_characters: [],
      climax_level: 'high',
      hook: '故事完结',
    });
  }

  return validated;
}

/**
 * 降级方案：基于规则的简单分集
 */
function fallbackRuleBasedSplit(script, options) {
  const {
    targetDurationPerEpisode = 300,
    maxEpisodes = 20,
  } = options;

  // 简单策略：按固定长度分割
  const charsPerEpisode = Math.floor(script.length / maxEpisodes);
  const episodes = [];

  for (let i = 0; i < maxEpisodes; i++) {
    const startPos = i * charsPerEpisode;
    const endPos = i === maxEpisodes - 1 ? script.length : (i + 1) * charsPerEpisode;
    
    // 尝试在段落边界切断
    const adjustedEndPos = findParagraphBoundary(script, endPos);

    episodes.push({
      episode_number: i + 1,
      title: `第${i + 1}集`,
      summary: script.substring(startPos, Math.min(startPos + 100, adjustedEndPos)).substring(0, 50) + '...',
      start_position: startPos,
      end_position: adjustedEndPos,
      text_length: adjustedEndPos - startPos,
      estimated_shots: Math.ceil((adjustedEndPos - startPos) / 150),
      estimated_duration: Math.ceil((adjustedEndPos - startPos) / 150) * 3,
      key_characters: [],
      climax_level: 'medium',
      hook: '待续...',
    });
  }

  return episodes;
}

/**
 * 寻找最近的段落边界
 */
function findParagraphBoundary(script, position) {
  // 向前搜索换行符或标点符号
  for (let i = position; i > position - 200 && i >= 0; i--) {
    const char = script[i];
    if (char === '\n' || char === '。' || char === '！' || char === '？') {
      return i + 1;
    }
  }
  return position;
}

/**
 * 获取单集的完整文本
 * @param {string} script - 完整剧本
 * @param {object} episode - 分集信息
 * @returns {string} 本集文本
 */
export function getEpisodeText(script, episode) {
  return script.substring(episode.start_position, episode.end_position);
}

/**
 * 批量生成多集的分镜脚本
 * @param {string} script - 完整剧本
 * @param {Array} episodes - 分集列表
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Array>} 每集的分镜脚本
 */
export async function generateEpisodesStoryboard(script, episodes, onProgress = null) {
  const { generateStoryboard } = await import('./storyboard.js');
  
  const results = [];
  const total = episodes.length;

  for (let i = 0; i < total; i++) {
    const episode = episodes[i];
    const episodeText = getEpisodeText(script, episode);

    try {
      console.log(`[EpisodeStoryboard] 生成第${episode.episode_number}集分镜...`);
      
      const storyboard = await generateStoryboard(episodeText, {
        episodeId: episode.episode_number,
        style: 'modern_anime',
      });

      results.push({
        episode: episode.episode_number,
        success: true,
        storyboard,
      });

      if (onProgress) {
        onProgress(i + 1, total, episode.episode_number);
      }
    } catch (error) {
      console.error(`[EpisodeStoryboard] 第${episode.episode_number}集分镜生成失败:`, error.message);
      
      results.push({
        episode: episode.episode_number,
        success: false,
        error: error.message,
      });

      if (onProgress) {
        onProgress(i + 1, total, episode.episode_number);
      }
    }
  }

  return results;
}

/**
 * 估算分集成本
 * @param {number} scriptLength - 剧本总长度（字符数）
 * @param {number} episodesCount - 分集数量
 * @returns {object} 成本估算
 */
export function estimateEpisodeSplitCost(scriptLength, episodesCount) {
  // LLM调用成本估算（DeepSeek定价）
  const inputTokens = Math.ceil(scriptLength / 4); // 约4字符/token
  const outputTokens = episodesCount * 200; // 每集约200 token输出
  
  const costPerToken = 0.000001; // DeepSeek定价：$1/百万token（示例）
  const totalCost = (inputTokens + outputTokens) * costPerToken;

  return {
    scriptLength,
    episodesCount,
    inputTokens,
    outputTokens,
    totalCost: totalCost.toFixed(4),
    currency: 'USD',
    note: '仅分集分析费用，不包含后续分镜生成费用',
  };
}
