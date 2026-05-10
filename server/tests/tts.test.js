import { describe, test, expect } from '@jest/globals';
import { estimateTTSCost } from '../services/tts.js';

describe('tts.js', () => {
  describe('estimateTTSCost', () => {
    test('Azure TTS 成本估算', () => {
      const result = estimateTTSCost(1000, 'azure');
      expect(result.engine).toBe('azure');
      expect(result.currency).toBe('USD');
      expect(result.textLength).toBe(1000);
      expect(parseFloat(result.totalCost)).toBeCloseTo(0.16, 2); // 1000 * 0.00016
    });

    test('ElevenLabs TTS 成本估算', () => {
      const result = estimateTTSCost(1000, 'elevenlabs');
      expect(result.engine).toBe('elevenlabs');
      expect(parseFloat(result.totalCost)).toBeCloseTo(0.3, 2);
    });

    test('Coqui TTS 免费', () => {
      const result = estimateTTSCost(1000, 'coqui');
      expect(result.engine).toBe('coqui');
      expect(parseFloat(result.totalCost)).toBe(0);
      expect(result.currency).toBe('CNY');
    });

    test('未知引擎回退 Azure 成本数据', () => {
      const result = estimateTTSCost(1000, 'unknown');
      expect(parseFloat(result.totalCost)).toBeCloseTo(0.16, 2);
      expect(result.currency).toBe('USD');
    });

    test('文本越长成本越高', () => {
      const short = parseFloat(estimateTTSCost(100, 'azure').totalCost);
      const longer = parseFloat(estimateTTSCost(10000, 'azure').totalCost);
      expect(short).toBeLessThan(longer);
    });

    test('返回包含 note 提示', () => {
      const result = estimateTTSCost(500, 'azure');
      expect(result.note).toBeTruthy();
    });
  });
});
