import { describe, test, expect } from '@jest/globals';
import {
  getEpisodeText,
  estimateEpisodeSplitCost,
} from '../services/episodeSplit.js';

describe('episodeSplit.js', () => {
  describe('getEpisodeText', () => {
    test('提取单集文本', () => {
      const script = '第一集内容。第二集内容。第三集内容。';
      const episode = { start_position: 0, end_position: 6 };
      expect(getEpisodeText(script, episode)).toBe('第一集内容。');
    });

    test('提取中间部分', () => {
      const script = 'AAAAABBBBBCCCCC';
      const episode = { start_position: 5, end_position: 10 };
      expect(getEpisodeText(script, episode)).toBe('BBBBB');
    });

    test('提取末尾部分', () => {
      const script = '开头中间结尾';
      const episode = { start_position: 4, end_position: 6 };
      expect(getEpisodeText(script, episode)).toBe('结尾');
    });
  });

  describe('estimateEpisodeSplitCost', () => {
    test('估算分集成本', () => {
      const result = estimateEpisodeSplitCost(10000, 5);
      expect(result.scriptLength).toBe(10000);
      expect(result.episodesCount).toBe(5);
      expect(result.currency).toBe('USD');
      expect(parseFloat(result.totalCost)).toBeGreaterThan(0);
      expect(result.inputTokens).toBe(2500); // 10000/4
      expect(result.outputTokens).toBe(1000); // 5*200
    });

    test('短剧本成本低于长剧本', () => {
      const short = parseFloat(estimateEpisodeSplitCost(100, 1).totalCost);
      const long = parseFloat(estimateEpisodeSplitCost(100000, 10).totalCost);
      expect(short).toBeLessThan(long);
    });

    test('返回结构完整', () => {
      const result = estimateEpisodeSplitCost(500, 2);
      expect(result).toHaveProperty('scriptLength');
      expect(result).toHaveProperty('episodesCount');
      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('outputTokens');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('note');
    });
  });
});
