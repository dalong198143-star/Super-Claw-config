import fetch from 'node-fetch';
import config from '../config.js';

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

const OPTIMIZE_SYSTEM_PROMPT = `You are a professional AI art prompt engineer. Convert the user's description into a high-quality English image generation prompt suitable for Stable Diffusion / Flux models.

Rules:
1. Output ONLY in English, no explanations
2. Add details: lighting, composition, color palette, texture, art style
3. Include quality keywords: highly detailed, 8K, cinematic lighting, sharp focus
4. Keep output between 100-300 characters
5. Output the prompt directly, nothing else`;

export async function optimizePrompt(userPrompt) {
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 中设置');
  }

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: OPTIMIZE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
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
}

export async function chat(messages) {
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是AI创作助手，帮助用户完成AI绘图、视频制作等创作任务。用中文回答，简洁实用。可以提供提示词建议、风格推荐、参数优化等建议。',
        },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
