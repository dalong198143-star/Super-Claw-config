import config from '../config';

describe('Config Module', () => {
  test('should have API_BASE_URL defined', () => {
    expect(config.API_BASE_URL).toBeDefined();
    expect(typeof config.API_BASE_URL).toBe('string');
  });

  test('API_BASE_URL should be a valid URL format', () => {
    expect(config.API_BASE_URL).toMatch(/^https?:\/\//);
  });

  test('should have DEFAULT_VIDEO_URL defined', () => {
    expect(config.DEFAULT_VIDEO_URL).toBeDefined();
    expect(typeof config.DEFAULT_VIDEO_URL).toBe('string');
  });

  test('DEFAULT_VIDEO_URL should be a valid URL format', () => {
    expect(config.DEFAULT_VIDEO_URL).toMatch(/^https?:\/\//);
  });

  test('should use localhost in test environment', () => {
    expect(config.API_BASE_URL).toContain('localhost');
  });
});