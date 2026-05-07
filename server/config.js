const config = {
  PORT: process.env.PORT || 3001,
  OLLAMA_BASE_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'deepseek-v4-pro',
  IMAGE_SERVICE_URL: 'https://picsum.photos',
  ALLOWED_ORIGINS: ['http://localhost:5174', 'http://localhost:5173'],
  // Replicate 文生图 API
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  REPLICATE_MODEL: process.env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell',
  // DeepSeek AI API（提示词优化 + 对话）
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
};

export default config;