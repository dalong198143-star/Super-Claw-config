import fetch from 'node-fetch';
import config from '../config.js';

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 系统提示词：将剧本转换为结构化JSON分镜脚本
 */
const STORYBOARD_SYSTEM_PROMPT = `你是一个专业的漫剧分镜师和AI内容制作专家。请将用户提供的小说/剧本片段转换成结构化的JSON分镜脚本。

输出要求：
1. 必须输出纯JSON格式，不要包含任何解释文字
2. JSON结构必须符合以下规范
3. 每个镜头的prompt必须是高质量的英文文生图提示词
4. 合理分配场景时长和镜头数量
5. 角色名称保持一致性

JSON结构示例：
{
  "episode_id": 1,
  "title": "章节标题",
  "scenes": [
    {
      "scene_id": "S001",
      "description": "场景描述（中文）",
      "location": "地点",
      "time_of_day": "白天/夜晚/黄昏",
      "characters": ["角色A", "角色B"],
      "duration": 5,
      "shots": [
        {
          "shot_id": 1,
          "duration": 3,
          "camera": "medium_shot",
          "angle": "eye_level",
          "character": "角色A",
          "action": "角色动作描述",
          "emotion": "情绪状态",
          "prompt": "高质量英文提示词，包含：角色外貌、服装、动作、表情、环境、光线、构图、艺术风格、质量关键词",
          "dialogue": "角色台词（如果有）",
          "sound_effect": "音效描述（可选）"
        }
      ]
    }
  ]
}

镜头类型（camera）可选值：
- long_shot: 远景
- medium_shot: 中景
- close_up: 特写
- extreme_close_up: 大特写
- over_shoulder: 过肩镜头
- point_of_view: 主观视角

拍摄角度（angle）可选值：
- eye_level: 平视
- high_angle: 俯视
- low_angle: 仰视
- dutch_angle: 倾斜角

提示词编写规范：
1. 使用英文，详细描述角色特征（确保一致性）
2. 包含光线、色彩、氛围描述
3. 添加质量关键词：8K, highly detailed, cinematic lighting, sharp focus
4. 指定艺术风格：anime style, manga art, etc.
5. 长度控制在100-200个单词`;

/**
 * 将剧本转换为分镜脚本
 * @param {string} script - 原始剧本文本
 * @param {object} options - 配置选项
 * @param {number} options.episodeId - 集数ID
 * @param {string} options.style - 动漫风格（ghibli/modern/retro等）
 * @returns {Promise<object>} 分镜脚本JSON对象
 */
export async function generateStoryboard(script, options = {}) {
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 中设置');
  }

  const { episodeId = 1, style = 'modern_anime' } = options;

  // 根据风格调整提示词指导
  const styleGuidance = getStyleGuidance(style);

  const userPrompt = `请将以下剧本片段转换为分镜脚本：

剧本内容：
---
${script}
---

风格要求：${styleGuidance}

请生成完整的JSON分镜脚本，包含所有必要的场景和镜头信息。`;

  try {
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: STORYBOARD_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }, // 强制JSON输出
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content.trim();

    // 尝试解析JSON
    let storyboard;
    try {
      // 移除可能的markdown代码块标记
      const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      storyboard = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      console.error('原始内容:', content.substring(0, 500));
      throw new Error('分镜脚本JSON格式错误，请重试');
    }

    // 验证基本结构
    validateStoryboard(storyboard);

    return storyboard;
  } catch (error) {
    console.error('分镜生成失败:', error);
    throw error;
  }
}

/**
 * 获取风格指导说明
 */
function getStyleGuidance(style) {
  const styles = {
    ghibli: '吉卜力工作室风格，温暖柔和的色彩，手绘质感，自然光线，温馨治愈系',
    modern_anime: '现代日漫风格，鲜明的线条，明亮的色彩，动态感强，适合青少年题材',
    retro: '复古动漫风格，80-90年代动画美学，颗粒感，怀旧色调',
    chibi: 'Q版萌系风格，大头小身，可爱夸张的表情，明亮饱和的色彩',
    cyberpunk: '赛博朋克风格，霓虹灯光，高科技低生活，蓝紫色调，未来都市',
    fantasy: '奇幻冒险风格，魔法元素，史诗感，金色和紫色为主，神秘氛围',
  };
  return styles[style] || styles.modern_anime;
}

/**
 * 验证分镜脚本的基本结构
 */
function validateStoryboard(storyboard) {
  if (!storyboard.episode_id && !storyboard.episodeId) {
    throw new Error('分镜脚本缺少episode_id字段');
  }
  
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) {
    throw new Error('分镜脚本缺少scenes数组');
  }

  if (storyboard.scenes.length === 0) {
    throw new Error('分镜脚本至少需要一个场景');
  }

  // 验证每个场景
  storyboard.scenes.forEach((scene, index) => {
    if (!scene.scene_id) {
      throw new Error(`场景${index + 1}缺少scene_id`);
    }
    if (!scene.shots || !Array.isArray(scene.shots)) {
      throw new Error(`场景${scene.scene_id}缺少shots数组`);
    }
    if (scene.shots.length === 0) {
      throw new Error(`场景${scene.scene_id}至少需要一个镜头`);
    }

    // 验证每个镜头
    scene.shots.forEach((shot, shotIndex) => {
      if (!shot.prompt) {
        throw new Error(`场景${scene.scene_id}的镜头${shotIndex + 1}缺少prompt`);
      }
      if (shot.prompt.length < 20) {
        throw new Error(`场景${scene.scene_id}的镜头${shotIndex + 1}的prompt太短，需要更详细的描述`);
      }
    });
  });
}

/**
 * 优化单个镜头的提示词
 * @param {string} prompt - 原始提示词
 * @param {string} characterDesc - 角色描述（用于保持一致性）
 * @returns {Promise<string>} 优化后的提示词
 */
export async function optimizeShotPrompt(prompt, characterDesc = '') {
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const systemPrompt = `你是AI绘画提示词优化专家。优化用户提供的镜头提示词，使其更适合AI图像生成。

要求：
1. 保持原有含义，但增加细节和质量描述
2. 如果提供了角色描述，确保在提示词中包含关键特征以保持一致性
3. 添加光线、构图、色彩、艺术风格等元素
4. 包含质量关键词：8K, highly detailed, cinematic lighting, sharp focus
5. 输出纯英文提示词，100-200个单词
6. 直接输出优化后的提示词，不要解释`;

  const userContent = characterDesc 
    ? `原始提示词：${prompt}\n\n角色描述（需保持一致）：${characterDesc}\n\n请优化这个提示词。`
    : `请优化这个提示词：${prompt}`;

  try {
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('提示词优化失败:', error);
    throw error;
  }
}

/**
 * 从分镜脚本中提取角色列表
 * @param {object} storyboard - 分镜脚本对象
 * @returns {Array} 角色列表
 */
export function extractCharacters(storyboard) {
  const characterSet = new Set();
  
  storyboard.scenes.forEach(scene => {
    if (scene.characters && Array.isArray(scene.characters)) {
      scene.characters.forEach(char => characterSet.add(char));
    }
    
    if (scene.shots && Array.isArray(scene.shots)) {
      scene.shots.forEach(shot => {
        if (shot.character) {
          characterSet.add(shot.character);
        }
      });
    }
  });

  return Array.from(characterSet).map((name, index) => ({
    id: index + 1,
    name,
    referenceImages: [], // 待用户上传参考图
    loraModel: null, // 待用户选择LoRA模型
  }));
}
