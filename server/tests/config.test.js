import { describe, test, expect } from '@jest/globals';
import config from '../config.js';

describe('config.js', () => {
  test('PORT 有默认值', () => {
    expect(config.PORT).toBeDefined();
    expect(Number(config.PORT)).toBeGreaterThan(0);
  });

  test('REPLICATE 相关配置存在', () => {
    expect(config).toHaveProperty('REPLICATE_API_TOKEN');
    expect(config).toHaveProperty('REPLICATE_TEXT2IMG_MODEL');
    expect(config).toHaveProperty('REPLICATE_IMG2VIDEO_MODEL');
  });

  test('SILICONFLOW 相关配置存在', () => {
    expect(config).toHaveProperty('SILICONFLOW_API_KEY');
    expect(config).toHaveProperty('SILICONFLOW_TEXT2IMG_MODEL');
    expect(config).toHaveProperty('SILICONFLOW_IMG2VIDEO_MODEL');
  });

  test('DEEPSEEK 相关配置存在', () => {
    expect(config).toHaveProperty('DEEPSEEK_API_KEY');
    expect(config).toHaveProperty('DEEPSEEK_MODEL');
    expect(config.DEEPSEEK_MODEL).toBe('deepseek-chat');
  });

  test('ALLOWED_ORIGINS 是数组', () => {
    expect(Array.isArray(config.ALLOWED_ORIGINS)).toBe(true);
    expect(config.ALLOWED_ORIGINS.length).toBeGreaterThan(0);
  });

  test('模型版本使用默认值（未设置环境变量时）', () => {
    expect(config.SILICONFLOW_TEXT2IMG_MODEL).toBe('Qwen/Qwen-Image');
    expect(config.SILICONFLOW_IMG2VIDEO_MODEL).toBe('Wan-AI/Wan2.2-I2V-A14B');
    expect(config.REPLICATE_TEXT2IMG_MODEL).toBe('black-forest-labs/flux-schnell');
  });
});
