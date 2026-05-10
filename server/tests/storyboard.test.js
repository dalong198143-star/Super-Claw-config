import { describe, test, expect } from '@jest/globals';
import {
  extractCharacters,
} from '../services/storyboard.js';

// validateStoryboard 和 getStyleGuidance 是内部函数，通过验证 extractCharacters 间接测试

describe('storyboard.js', () => {
  describe('extractCharacters', () => {
    test('从分镜中提取唯一角色列表', () => {
      const storyboard = {
        scenes: [
          {
            scene_id: 'S001',
            characters: ['小明', '小红'],
            shots: [
              { shot_id: 1, character: '小明', prompt: 'a boy walking...' },
              { shot_id: 2, character: '小红', prompt: 'a girl smiling...' },
            ],
          },
          {
            scene_id: 'S002',
            characters: ['小明', '张医生'],
            shots: [
              { shot_id: 3, character: '张医生', prompt: 'a doctor...' },
            ],
          },
        ],
      };

      const characters = extractCharacters(storyboard);
      expect(characters).toHaveLength(3);
      const names = characters.map((c) => c.name);
      expect(names).toContain('小明');
      expect(names).toContain('小红');
      expect(names).toContain('张医生');
    });

    test('每个角色有id', () => {
      const storyboard = {
        scenes: [{ scene_id: 'S001', characters: ['小明'], shots: [] }],
      };
      const characters = extractCharacters(storyboard);
      expect(characters[0]).toHaveProperty('id', 1);
      expect(characters[0]).toHaveProperty('name', '小明');
      expect(characters[0]).toHaveProperty('referenceImages');
      expect(characters[0]).toHaveProperty('loraModel');
    });

    test('从shots中提取角色（scene无characters）', () => {
      const storyboard = {
        scenes: [
          {
            scene_id: 'S001',
            shots: [
              { shot_id: 1, character: '主角', prompt: 'test' },
              { shot_id: 2, character: '主角', prompt: 'test' },
              { shot_id: 3, character: '配角', prompt: 'test' },
            ],
          },
        ],
      };
      const characters = extractCharacters(storyboard);
      expect(characters).toHaveLength(2);
    });

    test('空分镜返回空数组', () => {
      const storyboard = { scenes: [] };
      const characters = extractCharacters(storyboard);
      expect(characters).toEqual([]);
    });

    test('角色ID从1递增', () => {
      const storyboard = {
        scenes: [
          {
            scene_id: 'S001',
            characters: ['角色A', '角色B', '角色C'],
            shots: [],
          },
        ],
      };
      const characters = extractCharacters(storyboard);
      expect(characters[0].id).toBe(1);
      expect(characters[1].id).toBe(2);
      expect(characters[2].id).toBe(3);
    });
  });
});
