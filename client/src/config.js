const isTestEnvironment = typeof global !== 'undefined' && global.jest !== undefined;

let API_BASE_URL;

if (isTestEnvironment) {
  API_BASE_URL = 'http://localhost:3001';
} else {
  try {
    const getImportMeta = new Function('return import.meta')();
    API_BASE_URL = getImportMeta.env.VITE_API_URL || 'http://localhost:3001';
  } catch (e) {
    API_BASE_URL = 'http://localhost:3001';
  }
}

const config = {
  API_BASE_URL,
  DEFAULT_VIDEO_URL: 'https://www.w3schools.com/html/mov_bbb.mp4',
};

export default config;
