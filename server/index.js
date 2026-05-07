import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import config from './config.js';
import { createPrediction, getPrediction } from './services/replicate.js';
import { optimizePrompt, chat } from './services/deepseek.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = config.PORT;

const db = new Database('mvp.db');

// 安全中间件
app.use(helmet()); // 设置安全HTTP头

// CORS配置 - 严格限制允许的源
app.use(cors({ 
  origin: config.ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// 速率限制 - 防止滥用
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 每个IP最多20次提交请求
  message: { error: '提交过于频繁，请稍后再试' },
});

app.use('/api/', generalLimiter);
app.use('/api/submit', strictLimiter);

app.use(express.json({ limit: '10mb' })); // 限制JSON payload大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 文件上传配置 - 添加大小和类型限制
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成安全的文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制10MB
    files: 1 // 每次只能上传1个文件
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片和视频文件
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('不支持的文件类型'));
  }
});

const initDb = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    balance INTEGER DEFAULT 0
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    difficulty INTEGER DEFAULT 1,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  const taskCount = db.prepare('SELECT COUNT(*) FROM tasks').pluck().get();
  if (taskCount === 0) {
    const insertTask = db.prepare(
      'INSERT INTO tasks (title, description, reward, difficulty) VALUES (?, ?, ?, ?)'
    );
    insertTask.run('生成一张风景画', '使用AI生成一张漂亮的风景画', 2, 1);
    insertTask.run('生成一张头像', '使用AI生成一张卡通头像', 3, 1);
    insertTask.run('修改图片风格', '将图片改成动漫风格', 5, 2);
    insertTask.run('生成产品海报', '使用AI生成一张产品宣传海报', 10, 2);
    insertTask.run('定制绘画', '根据详细描述生成定制绘画', 20, 3);
  }

  const userCount = db.prepare('SELECT COUNT(*) FROM users').pluck().get();
  if (userCount === 0) {
    db.prepare('INSERT INTO users (name, balance) VALUES (?, ?)').run('Demo User', 100);
  }
};

initDb();

app.get('/api/tasks', (req, res) => {
  const { search, difficulty, sort } = req.query;
  let query = 'SELECT * FROM tasks WHERE status = ?';
  let params = ['open'];

  // 输入验证和清理
  if (search) {
    // 限制搜索关键词长度
    if (search.length > 100) {
      return res.status(400).json({ error: '搜索关键词过长' });
    }
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (difficulty && difficulty !== 'all') {
    const diffValue = parseInt(difficulty);
    if (isNaN(diffValue) || diffValue < 1 || diffValue > 5) {
      return res.status(400).json({ error: '无效的难度值' });
    }
    query += ' AND difficulty = ?';
    params.push(diffValue);
  }

  // 白名单验证排序参数
  const allowedSorts = ['reward_desc', 'reward_asc', 'difficulty_desc', 'difficulty_asc'];
  if (sort && !allowedSorts.includes(sort)) {
    return res.status(400).json({ error: '无效的排序参数' });
  }

  if (sort === 'reward_desc') {
    query += ' ORDER BY reward DESC';
  } else if (sort === 'reward_asc') {
    query += ' ORDER BY reward ASC';
  } else if (sort === 'difficulty_desc') {
    query += ' ORDER BY difficulty DESC';
  } else {
    query += ' ORDER BY difficulty ASC';
  }

  try {
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (error) {
    console.error('查询任务错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

app.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  
  if (isNaN(taskId)) {
    return res.status(400).json({ error: '无效的任务ID' });
  }
  
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (task) res.json(task);
    else res.status(404).json({ error: 'Task not found' });
  } catch (error) {
    console.error('查询任务详情错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

app.post('/api/submit', upload.single('file'), (req, res) => {
  const { task_id, user_id, content } = req.body;
  
  // 输入验证
  if (!task_id || !user_id) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  // 验证task_id和user_id是数字
  const taskId = parseInt(task_id);
  const userId = parseInt(user_id);
  
  if (isNaN(taskId) || isNaN(userId)) {
    return res.status(400).json({ error: '无效的参数格式' });
  }
  
  // 验证content长度
  if (content && content.length > 5000) {
    return res.status(400).json({ error: '内容过长' });
  }
  
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const submission = db.prepare(
      'INSERT INTO submissions (task_id, user_id, content, file_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, userId, content, file_url, 'pending');

    const task = db.prepare('SELECT reward FROM tasks WHERE id = ?').get(taskId);
    if (task) {
      const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (currentUser) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
          .run(task.reward, userId);
        db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('completed', taskId);
      }
    }

    res.json({ success: true, submission_id: submission.lastInsertRowid });
  } catch (error) {
    console.error('提交错误:', error);
    res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

app.get('/api/user/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (user) res.json(user);
  else res.status(404).json({ error: 'User not found' });
});

app.get('/api/ollama/tags', async (req, res) => {
  try {
    const ollamaRes = await fetch(`${config.OLLAMA_BASE_URL}/api/tags`);
    const data = await ollamaRes.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Ollama not available' });
  }
});

app.post('/api/ollama/generate', async (req, res) => {
  try {
    const requestBody = {
      model: req.body.model || config.DEFAULT_MODEL,
      prompt: req.body.prompt,
      options: req.body.options || {}
    };
    const ollamaRes = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await ollamaRes.json();
    res.json(data);
  } catch (e) {
    res.json({ response: 'AI 提示：您可以这样完成任务...（需要本地安装 Ollama）' });
  }
});

app.get('/api/image-generate/:prompt', async (req, res) => {
  const prompt = req.params.prompt;
  const imageUrl = `${config.IMAGE_SERVICE_URL}/seed/${encodeURIComponent(prompt)}/512/512`;
  res.json({ url: imageUrl, prompt: prompt });
});

app.post('/api/image-generate', async (req, res) => {
  const { prompt, style, width = 512, height = 512 } = req.body;
  const imageUrl = `${config.IMAGE_SERVICE_URL}/seed/${encodeURIComponent(prompt + style)}/${width}/${height}`;
  res.json({
    url: imageUrl,
    prompt: prompt,
    style: style,
    width: width,
    height: height,
    status: 'completed'
  });
});

app.get('/api/image-styles', async (req, res) => {
  const styles = [
    { id: 'realistic', name: '写实风格', description: '逼真的照片效果' },
    { id: 'anime', name: '动漫风格', description: '日式动画风格' },
    { id: 'watercolor', name: '水彩风格', description: '水彩画效果' },
    { id: 'oil', name: '油画风格', description: '经典油画效果' },
    { id: 'digital', name: '数字绘画', description: '现代数字艺术' },
    { id: 'minimalist', name: '极简风格', description: '简约抽象' },
    { id: 'fantasy', name: '奇幻风格', description: '魔幻梦幻效果' },
    { id: 'cyberpunk', name: '赛博朋克', description: '未来科技感' }
  ];
  res.json(styles);
});

// === Replicate 文生图 API ===

app.post('/api/replicate/generate', async (req, res) => {
  const { prompt, negative_prompt, style, width, height, steps, guidance, seed } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: '请输入提示词' });
  }
  if (prompt.length > 2000) {
    return res.status(400).json({ error: '提示词过长' });
  }

  const styleKeywords = {
    realistic: 'photorealistic, hyperrealistic',
    anime: 'anime style, manga style',
    watercolor: 'watercolor painting',
    oil: 'oil painting, classical',
    digital: 'digital art, concept art',
    minimalist: 'minimalist, simple, abstract',
    fantasy: 'fantasy art, magical, ethereal',
    cyberpunk: 'cyberpunk, futuristic, neon',
  };

  let fullPrompt = prompt.trim();
  if (style && styleKeywords[style]) {
    fullPrompt += ', ' + styleKeywords[style];
  }

  try {
    const result = await createPrediction(fullPrompt, {
      negative_prompt,
      width: Math.min(Math.max(parseInt(width) || 512, 256), 1024),
      height: Math.min(Math.max(parseInt(height) || 512, 256), 1024),
      steps: Math.min(Math.max(parseInt(steps) || 30, 20), 50),
      guidance: Math.min(Math.max(parseFloat(guidance) || 7.5, 1), 20),
      seed: parseInt(seed) || -1,
    });
    res.json(result);
  } catch (e) {
    console.error('Replicate generate error:', e.message);
    if (e.message.includes('未配置')) {
      return res.status(503).json({ error: e.message });
    }
    res.status(500).json({ error: '图像生成失败，请稍后重试' });
  }
});

app.get('/api/replicate/prediction/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: '缺少 prediction ID' });
  }

  try {
    const result = await getPrediction(id);
    res.json(result);
  } catch (e) {
    console.error('Replicate prediction error:', e.message);
    res.status(500).json({ error: '查询状态失败' });
  }
});

// === DeepSeek API ===

app.post('/api/deepseek/optimize-prompt', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: '请输入提示词' });
  }
  if (prompt.length > 1000) {
    return res.status(400).json({ error: '提示词过长' });
  }

  try {
    const optimized = await optimizePrompt(prompt.trim());
    res.json({ optimized });
  } catch (e) {
    console.error('DeepSeek optimize error:', e.message);
    if (e.message.includes('未配置')) {
      return res.status(503).json({ error: e.message });
    }
    res.status(500).json({ error: '提示词优化失败' });
  }
});

app.post('/api/deepseek/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '请输入消息内容' });
  }

  try {
    const reply = await chat(messages);
    res.json({ reply });
  } catch (e) {
    console.error('DeepSeek chat error:', e.message);
    if (e.message.includes('未配置')) {
      return res.status(503).json({ error: e.message });
    }
    res.status(500).json({ error: 'AI 对话失败' });
  }
});

// 健康检查端点 - 移除敏感信息
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
    // 移除version信息，避免泄露
  });
});

// 错误处理中间件 - 捕获所有未处理的错误
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  // Multer错误处理
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件过大，最大支持10MB' });
    }
    return res.status(400).json({ error: '文件上传错误' });
  }
  
  // 通用错误
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
