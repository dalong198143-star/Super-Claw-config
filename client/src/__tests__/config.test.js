import config from '../config';

describe('Config Module', () => {
  test('should have API_BASE_URL defined', () => {
    expect(config.API_BASE_URL).toBeDefined();
    expect(typeof config.API_BASE_URL).toBe('string');
  });

  test('API_BASE_URL should be a valid URL format', () => {
    expect(config.API_BASE_URL).toMatch(/^https?:\/\//);
  });

  test('should have OLLAMA_BASE_URL defined', () => {
    expect(config.OLLAMA_BASE_URL).toBeDefined();
    expect(typeof config.OLLAMA_BASE_URL).toBe('string');
  });

  test('should have IMAGE_SERVICE_URL defined', () => {
    expect(config.IMAGE_SERVICE_URL).toBeDefined();
    expect(typeof config.IMAGE_SERVICE_URL).toBe('string');
  });
});
