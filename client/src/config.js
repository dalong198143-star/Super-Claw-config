// 检测是否在测试环境中
const isTestEnvironment = typeof global !== 'undefined' && global.jest !== undefined;

let API_BASE_URL, OLLAMA_BASE_URL;

if (isTestEnvironment) {
  // Jest测试环境
  API_BASE_URL = 'http://localhost:3001';
  OLLAMA_BASE_URL = 'http://localhost:11434';
} else {
  // Vite开发/生产环境 - 使用Function构造器动态访问import.meta
  try {
    const getImportMeta = new Function('return import.meta')();
    API_BASE_URL = getImportMeta.env.VITE_API_URL || 'http://localhost:3001';
    OLLAMA_BASE_URL = getImportMeta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
  } catch {
    API_BASE_URL = 'http://localhost:3001';
    OLLAMA_BASE_URL = 'http://localhost:11434';
  }
}

const config = {
  API_BASE_URL,
  OLLAMA_BASE_URL,
  DEFAULT_VIDEO_URL: 'https://www.w3schools.com/html/mov_bbb.mp4',
  IMAGE_SERVICE_URL: 'https://picsum.photos',
};

export default config;