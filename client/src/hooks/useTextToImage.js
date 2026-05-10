import { useState, useEffect, useCallback } from 'react';
import config from '../config';

export function useTextToImage() {
  // 提示词
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);

  // 风格
  const [selectedStyle, setSelectedStyle] = useState('');
  const [styles, setStyles] = useState([]);

  // 参数
  const [params, setParams] = useState({
    width: 512,
    height: 512,
    steps: 30,
    guidance: 7.5,
    seed: -1,
  });

  // 步骤
  const [currentStep, setCurrentStep] = useState(1);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  // 加载风格列表
  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/image-styles`);
      const data = await res.json();
      setStyles(data);
      if (data.length > 0 && !selectedStyle) {
        setSelectedStyle(data[0].id);
      }
    } catch (e) {
      console.error('加载风格失败:', e);
    }
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  // 用 DeepSeek 优化提示词
  const optimizePromptAction = useCallback(async () => {
    if (!prompt.trim()) return;
    setOptimizingPrompt(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/deepseek/optimize-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (data.optimized) {
        setPrompt(data.optimized);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      alert('提示词优化失败，请检查 DeepSeek API 配置');
    }
    setOptimizingPrompt(false);
  }, [prompt]);

  // 设置单个参数
  const setParam = useCallback((key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // 生成图片
  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setGeneratedImage(null);

    try {
      const genRes = await fetch(`${config.API_BASE_URL}/api/siliconflow/text-to-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
          ...params,
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        throw new Error(errData.error || '生成请求失败');
      }

      setProgress(50);
      const data = await genRes.json();
      setProgress(100);
      setGeneratedImage(data);
    } catch (e) {
      setError(e.message);
    }
    setIsGenerating(false);
  }, [prompt, negativePrompt, selectedStyle, params]);

  // 重置
  const reset = useCallback(() => {
    setGeneratedImage(null);
    setProgress(0);
    setError(null);
    setIsGenerating(false);
    setCurrentStep(1);
  }, []);

  // 下载图片
  const download = useCallback(() => {
    if (!generatedImage?.url) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `generated-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage]);

  return {
    currentStep, setCurrentStep,
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,
    optimizingPrompt, onOptimizePrompt: optimizePromptAction,
    selectedStyle, setSelectedStyle,
    styles,
    params, setParam,
    isGenerating, progress,
    generatedImage, error,
    generate, reset, download,
  };
}
