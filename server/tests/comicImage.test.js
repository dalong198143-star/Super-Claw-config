import { describe, test, expect } from '@jest/globals';
import { estimateCost } from '../services/comicImage.js';

describe('comicImage.js', () => {
  describe('estimateCost', () => {
    test('单张图片成本估算', () => {
      const result = estimateCost(1);
      expect(result.shotCount).toBe(1);
      expect(parseFloat(result.totalCost)).toBeCloseTo(0.01, 2);
      expect(result.currency).toBe('CNY');
    });

    test('多张图片成本线性增长', () => {
      const one = parseFloat(estimateCost(1).totalCost);
      const ten = parseFloat(estimateCost(10).totalCost);
      expect(ten).toBeCloseTo(one * 10, 2);
    });

    test('零张图片成本为零', () => {
      const result = estimateCost(0);
      expect(parseFloat(result.totalCost)).toBe(0);
    });

    test('返回 note 提示', () => {
      const result = estimateCost(5);
      expect(result.note).toBeTruthy();
      expect(result.costPerImage).toBe(0.01);
    });
  });
});
