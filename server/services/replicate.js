import fetch from 'node-fetch';
import config from '../config.js';

const REPLICATE_API = 'https://api.replicate.com/v1';

export async function createPrediction(prompt, options = {}) {
  if (!config.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN 未配置，请在 .env 中设置');
  }

  const input = {
    prompt,
    width: options.width || 512,
    height: options.height || 512,
    num_inference_steps: options.steps || 30,
    guidance_scale: options.guidance || 7.5,
    ...(options.negative_prompt ? { negative_prompt: options.negative_prompt } : {}),
    ...(options.seed && options.seed > 0 ? { seed: options.seed } : {}),
  };

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: config.REPLICATE_MODEL,
      input,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Replicate API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    predictionId: data.id,
    status: data.status,
  };
}

export async function getPrediction(predictionId) {
  if (!config.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN 未配置');
  }

  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${config.REPLICATE_API_TOKEN}`,
    },
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
      : data.status === 'processing' ? Math.round((data.logs?.length || 0) / 30 * 100)
      : 0,
    error: data.error || null,
  };
}
