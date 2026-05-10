import { describe, test, expect } from '@jest/globals';
import {
  generateSRT,
  generateVTT,
  extractSubtitlesFromStoryboard,
  syncSubtitlesWithAudio,
} from '../services/subtitle.js';

describe('subtitle.js', () => {
  describe('generateSRT', () => {
    test('空数组返回空字符串', () => {
      expect(generateSRT([])).toBe('');
      expect(generateSRT(null)).toBe('');
    });

    test('生成单条字幕', () => {
      const result = generateSRT([
        { startTime: 0, endTime: 3, text: '你好世界' },
      ]);
      expect(result).toBe('1\n00:00:00,000 --> 00:00:03,000\n你好世界');
    });

    test('生成多条字幕', () => {
      const result = generateSRT([
        { startTime: 0, endTime: 2.5, text: '第一句' },
        { startTime: 2.5, endTime: 5, text: '第二句' },
      ]);
      const lines = result.split('\n');
      expect(lines[0]).toBe('1');
      expect(lines[1]).toBe('00:00:00,000 --> 00:00:02,500');
      expect(lines[2]).toBe('第一句');
      expect(lines[3]).toBe('');
      expect(lines[4]).toBe('2');
      expect(lines[5]).toBe('00:00:02,500 --> 00:00:05,000');
      expect(lines[6]).toBe('第二句');
    });

    test('处理带毫秒的时间', () => {
      const result = generateSRT([
        { startTime: 1.234, endTime: 4.567, text: '测试' },
      ]);
      expect(result).toContain('00:00:01,234 --> 00:00:04,567');
    });

    test('处理超过1小时的时间', () => {
      const result = generateSRT([
        { startTime: 3661.5, endTime: 7200, text: '长视频' },
      ]);
      expect(result).toContain('01:01:01,500 --> 02:00:00,000');
    });
  });

  describe('generateVTT', () => {
    test('空数组返回WEBVTT头', () => {
      expect(generateVTT([])).toBe('WEBVTT\n');
      expect(generateVTT(null)).toBe('WEBVTT\n');
    });

    test('生成单条VTT字幕', () => {
      const result = generateVTT([
        { startTime: 0, endTime: 3, text: 'Hello' },
      ]);
      expect(result).toContain('WEBVTT');
      expect(result).toContain('00:00:00.000 --> 00:00:03.000');
      expect(result).toContain('Hello');
    });

    test('VTT使用点号分隔毫秒', () => {
      const result = generateVTT([
        { startTime: 1.5, endTime: 3.75, text: '测试' },
      ]);
      expect(result).toContain('00:00:01.500 --> 00:00:03.750');
    });
  });

  describe('extractSubtitlesFromStoryboard', () => {
    test('从标准分镜提取字幕', () => {
      const storyboard = {
        scenes: [
          {
            scene_id: 'S001',
            shots: [
              { shot_id: 1, dialogue: '你好！', duration: 3, character: '小明' },
              { shot_id: 2, dialogue: '', duration: 2 },
              { shot_id: 3, dialogue: '再见！', duration: 4, character: '小红' },
            ],
          },
          {
            scene_id: 'S002',
            shots: [
              { shot_id: 4, dialogue: '新场景', duration: 3 },
            ],
          },
        ],
      };

      const result = extractSubtitlesFromStoryboard(storyboard);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        startTime: 0,
        endTime: 3,
        text: '你好！',
        character: '小明',
      });
      expect(result[1]).toMatchObject({
        startTime: 5,
        endTime: 9,
        text: '再见！',
        character: '小红',
      });
      expect(result[2]).toMatchObject({
        startTime: 9,
        endTime: 12,
        text: '新场景',
      });
    });

    test('无台词的镜头只增加时间', () => {
      const storyboard = {
        scenes: [
          {
            scene_id: 'S001',
            shots: [
              { shot_id: 1, dialogue: '', duration: 5 },
              { shot_id: 2, dialogue: '有台词', duration: 2 },
            ],
          },
        ],
      };
      const result = extractSubtitlesFromStoryboard(storyboard);
      expect(result).toHaveLength(1);
      expect(result[0].startTime).toBe(5);
    });

    test('无duration默认3秒', () => {
      const storyboard = {
        scenes: [{ scene_id: 'S001', shots: [{ shot_id: 1, dialogue: '测试' }] }],
      };
      const result = extractSubtitlesFromStoryboard(storyboard);
      expect(result[0]).toMatchObject({ startTime: 0, endTime: 3 });
    });
  });

  describe('syncSubtitlesWithAudio', () => {
    test('根据音频时长调整字幕时间', () => {
      const subtitles = [
        { startTime: 0, endTime: 3, text: 'A', shotId: 's1' },
        { startTime: 3, endTime: 6, text: 'B', shotId: 's2' },
      ];
      const audioDurations = [
        { shotId: 's1', duration: 4.5 },
        { shotId: 's2', duration: 2.0 },
      ];
      const result = syncSubtitlesWithAudio(subtitles, audioDurations);
      expect(result[0]).toMatchObject({ startTime: 0, endTime: 4.5 });
      expect(result[1]).toMatchObject({ startTime: 4.5, endTime: 6.5 });
    });

    test('无匹配音频时使用原时长', () => {
      const subtitles = [
        { startTime: 0, endTime: 3, text: 'A', shotId: 's1' },
      ];
      const result = syncSubtitlesWithAudio(subtitles, []);
      expect(result[0]).toMatchObject({ startTime: 0, endTime: 3 });
    });
  });
});
