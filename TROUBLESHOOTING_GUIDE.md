# 🔧 故障排查指南 - 短平快(WisdomFlow)学习变现平台

## 📋 目录

1. [快速诊断流程](#快速诊断流程)
2. [前端问题](#前端问题)
3. [后端问题](#后端问题)
4. [数据库问题](#数据库问题)
5. [网络问题](#网络问题)
6. [性能问题](#性能问题)
7. [日志分析](#日志分析)

---

## 快速诊断流程

### 第一步：检查服务状态

```bash
# 检查后端服务
curl http://localhost:3001/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2026-05-06T12:00:00.000Z",
  "uptime": 3600
}

# 检查前端服务
curl -I http://localhost:5173

# 预期响应
HTTP/1.1 200 OK
```

### 第二步：查看错误日志

```bash
# 后端日志
tail -f server/logs/app.log

# Docker日志
docker-compose logs -f server

# 前端控制台
# F12 -> Console
```

### 第三步：定位问题类型

| 现象 | 可能原因 | 跳转章节 |
|------|----------|----------|
| 页面空白 | 前端构建失败/API不可达 | [前端问题](#前端问题) |
| API返回500 | 后端代码错误/数据库问题 | [后端问题](#后端问题) |
| 数据丢失 | 数据库损坏 | [数据库问题](#数据库问题) |
| 请求超时 | 网络配置错误 | [网络问题](#网络问题) |
| 响应缓慢 | 性能瓶颈 | [性能问题](#性能问题) |

---

## 前端问题

### 1. 页面完全空白

**症状**: 
- 访问 http://localhost:5173 显示空白
- 浏览器控制台有红色错误

**诊断步骤**:

```bash
# 1. 检查前端服务是否运行
ps aux | grep vite

# 2. 检查构建是否有错误
cd client && npm run build

# 3. 检查浏览器控制台错误
# F12 -> Console
```

**常见错误及解决方案**:

#### 错误1: `Failed to fetch`

**原因**: 后端API不可达

**解决**:
```bash
# 检查后端服务
curl http://localhost:3001/api/health

# 如果失败，重启后端
npm run dev:server
```

#### 错误2: `Cannot read properties of undefined`

**原因**: JavaScript运行时错误

**解决**:
- 查看具体错误堆栈
- 检查组件props是否正确传递
- 验证API响应数据结构

#### 错误3: `Module not found`

**原因**: 依赖缺失或路径错误

**解决**:
```bash
# 重新安装依赖
cd client && rm -rf node_modules package-lock.json
npm install
```

---

### 2. 组件渲染异常

**症状**: 
- 部分组件不显示
- 样式错乱

**诊断**:

```javascript
// 在浏览器控制台执行
console.log(document.querySelectorAll('[data-testid]'))
```

**解决方案**:

1. **检查Props传递**:
```jsx
// 确保所有必需的props都已传递
<WorkflowContainer 
  currentMode={currentMode}
  onModeChange={handleModeChange}
/>
```

2. **检查CSS加载**:
```bash
# 检查CSS文件是否存在
ls client/src/components/workflow/*.css
```

3. **清除浏览器缓存**:
```
Ctrl+Shift+R (强制刷新)
或
F12 -> Network -> Disable cache
```

---

### 3. 工作流模式切换失败

**症状**: 
- 点击模式切换按钮无反应
- 控制台报错

**诊断**:

```javascript
// 检查Zustand store状态
import { useWorkflowStore } from './store/workflowStore'
console.log(useWorkflowStore.getState())
```

**解决方案**:

1. **重置Store状态**:
```javascript
useWorkflowStore.setState({
  currentMode: 'linear',
  linearWorkflow: { ... },
  canvasWorkflow: { nodes: [], connections: [] },
  smartWorkflow: { requirement: '', recommendations: [], analyzing: false }
})
```

2. **检查localStorage**:
```javascript
// 清除可能损坏的持久化数据
localStorage.removeItem('workflow-store')
location.reload()
```

---

## 后端问题

### 1. 服务无法启动

**症状**: 
- `npm run dev:server` 立即退出
- 错误信息: `EADDRINUSE` 或 `MODULE_NOT_FOUND`

**诊断步骤**:

```bash
# 1. 检查端口占用
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# 2. 检查Node版本
node --version  # 应 >= 18.0.0

# 3. 检查依赖
ls server/node_modules | head
```

**解决方案**:

#### 方案1: 端口冲突

```bash
# 杀死占用进程
kill -9 <PID>  # Linux/Mac
taskkill /F /PID <PID>  # Windows

# 或修改端口
echo "PORT=3002" >> server/.env
```

#### 方案2: 依赖缺失

```bash
cd server && npm install
```

#### 方案3: Node版本过低

```bash
# 使用nvm升级
nvm install 18
nvm use 18
```

---

### 2. API返回500错误

**症状**: 
- 请求失败，响应状态码500
- 后端日志显示异常堆栈

**诊断**:

```bash
# 查看详细错误日志
tail -100 server/logs/app.log

# 或Docker环境
docker-compose logs server | tail -100
```

**常见错误及解决方案**:

#### 错误1: `SQLITE_ERROR: no such table`

**原因**: 数据库表未初始化

**解决**:
```bash
# 删除数据库文件（会重建）
rm server/database.sqlite

# 重启服务
npm run dev:server
```

#### 错误2: `TypeError: Cannot read property 'xxx' of undefined`

**原因**: 请求参数验证缺失

**解决**:
- 检查API端点的输入验证逻辑
- 添加防御性编程

```javascript
// 示例：添加参数验证
if (!req.body.prompt) {
    return res.status(400).json({ error: 'Prompt is required' })
}
```

#### 错误3: `ENOENT: no such file or directory`

**原因**: 文件或目录不存在

**解决**:
```bash
# 创建缺失的目录
mkdir -p uploads
chmod 755 uploads
```

---

### 3. 速率限制触发

**症状**: 
- API返回429 Too Many Requests
- 响应头包含 `Retry-After`

**诊断**:

```bash
# 检查当前速率限制配置
cat server/.env | grep RATE_LIMIT

# 查看被限制的IP
grep "rate limit" server/logs/app.log | tail -20
```

**解决方案**:

#### 临时解决

等待15分钟（默认窗口期）后自动解除限制。

#### 永久解决

```bash
# 增加限制阈值
echo "RATE_LIMIT_MAX_REQUESTS=200" >> server/.env

# 重启服务
npm run dev:server
```

#### 优化客户端

```javascript
// 添加请求节流
import throttle from 'lodash/throttle'

const fetchTasks = throttle(async () => {
    const response = await fetch('/api/tasks')
    return response.json()
}, 1000) // 最多每秒1次
```

---

## 数据库问题

### 1. 数据库文件损坏

**症状**: 
- API返回500错误
- 日志显示 `SQLITE_CORRUPT`

**诊断**:

```bash
# 检查数据库完整性
sqlite3 server/database.sqlite "PRAGMA integrity_check;"

# 预期输出: ok
# 如果输出其他内容，说明数据库损坏
```

**解决方案**:

#### 方案1: 从备份恢复

```bash
# 查找最新备份
ls -lt backups/ | head

# 恢复数据库
cp backups/database_20260506.sqlite server/database.sqlite

# 重启服务
npm run dev:server
```

#### 方案2: 重建数据库（数据丢失）

```bash
# 删除损坏的数据库
rm server/database.sqlite

# 重启服务（会自动重建）
npm run dev:server
```

---

### 2. 查询性能下降

**症状**: 
- API响应时间变长
- 数据库CPU使用率高

**诊断**:

```sql
-- 检查慢查询
sqlite3 server/database.sqlite <<EOF
.explain on
SELECT * FROM tasks WHERE difficulty = 1;
EOF
```

**解决方案**:

#### 添加索引

```sql
-- 为常用查询字段添加索引
sqlite3 server/database.sqlite <<EOF
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_reward ON tasks(reward);
EOF
```

#### 清理过期数据

```sql
-- 删除已完成超过30天的任务
sqlite3 server/database.sqlite <<EOF
DELETE FROM tasks 
WHERE status = 'completed' 
AND created_at < datetime('now', '-30 days');
VACUUM;
EOF
```

---

### 3. 数据库锁定

**症状**: 
- API返回500错误
- 日志显示 `database is locked`

**原因**: SQLite同时只允许一个写操作

**解决方案**:

#### 方案1: 等待锁释放

SQLite会自动处理锁竞争，通常等待几秒即可。

#### 方案2: 优化写入频率

```javascript
// 批量写入而非逐条写入
const batchInsert = async (items) => {
    const db = getDatabase()
    const stmt = db.prepare('INSERT INTO tasks VALUES (?, ?, ?)')
    
    db.transaction(() => {
        items.forEach(item => {
            stmt.run(item.id, item.title, item.reward)
        })
    })()
}
```

#### 方案3: 迁移到PostgreSQL

对于高并发场景，建议迁移到支持并发的数据库。

---

## 网络问题

### 1. CORS错误

**症状**: 
- 浏览器控制台显示CORS错误
- API请求被阻止

**诊断**:

```bash
# 检查CORS配置
cat server/index.js | grep -A 5 cors
```

**解决方案**:

```javascript
// server/index.js
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

### 2. 连接超时

**症状**: 
- 请求长时间无响应
- 最终返回timeout错误

**诊断**:

```bash
# 测试网络连接
ping localhost

# 测试端口连通性
telnet localhost 3001

# 检查防火墙规则
sudo iptables -L
```

**解决方案**:

#### 方案1: 检查防火墙

```bash
# 开放端口
sudo ufw allow 3001/tcp
sudo ufw reload
```

#### 方案2: 调整超时设置

```javascript
// 前端请求超时配置
const response = await fetch('/api/tasks', {
    signal: AbortSignal.timeout(5000) // 5秒超时
})
```

---

## 性能问题

### 1. 响应缓慢

**症状**: 
- API响应时间 > 500ms
- 页面加载缓慢

**诊断**:

```bash
# 使用curl测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/tasks

# curl-format.txt内容:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

**解决方案**:

#### 前端优化

1. **启用代码分割**:
```javascript
// vite.config.js
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                vendor: ['react', 'react-dom']
            }
        }
    }
}
```

2. **图片懒加载**:
```jsx
<img loading="lazy" src={imageUrl} alt="..." />
```

#### 后端优化

1. **添加缓存**:
```javascript
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

function getCachedData(key, fetchFn) {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }
    const data = await fetchFn()
    cache.set(key, { data, timestamp: Date.now() })
    return data
}
```

2. **数据库索引**: 见[数据库问题](#2-查询性能下降)

---

### 2. 内存泄漏

**症状**: 
- 服务运行一段时间后内存持续增长
- 最终OOM崩溃

**诊断**:

```bash
# 监控内存使用
watch -n 1 'ps aux | grep node | awk "{print $6}"'

# Node.js内置诊断
NODE_OPTIONS="--inspect" npm run dev:server
# 然后在Chrome DevTools中分析内存
```

**解决方案**:

1. **检查事件监听器**:
```javascript
// 确保移除不再需要的事件监听器
componentDidMount() {
    window.addEventListener('resize', this.handleResize)
}

componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
}
```

2. **清理定时器**:
```javascript
useEffect(() => {
    const timer = setInterval(fetchData, 5000)
    return () => clearInterval(timer) // 清理
}, [])
```

3. **避免闭包引用大对象**:
```javascript
// ❌ 错误：闭包引用大数组
const processData = () => {
    const largeArray = new Array(1000000).fill(0)
    return () => largeArray.length // 闭包保持引用
}

// ✅ 正确：及时释放引用
const processData = () => {
    const largeArray = new Array(1000000).fill(0)
    const result = largeArray.length
    largeArray = null // 显式释放
    return () => result
}
```

---

## 日志分析

### 日志位置

| 环境 | 日志位置 |
|------|----------|
| 开发环境 | 终端输出 (stdout/stderr) |
| Docker | `docker-compose logs` |
| 生产环境 | `/var/log/wisdomflow/app.log` |

### 日志级别说明

| 级别 | 颜色 | 用途 |
|------|------|------|
| ERROR | 🔴 红色 | 系统异常、API错误 |
| WARN | 🟡 黄色 | 潜在问题、降级处理 |
| INFO | 🔵 蓝色 | 正常业务操作 |
| DEBUG | ⚪ 灰色 | 开发调试信息 |

### 常用日志分析命令

```bash
# 查看最近100行日志
tail -100 server/logs/app.log

# 搜索错误日志
grep "ERROR" server/logs/app.log | tail -20

# 实时监控日志
tail -f server/logs/app.log

# 统计错误数量
grep -c "ERROR" server/logs/app.log

# 查看特定时间段的日志
awk '/2026-05-06 12:00/,/2026-05-06 13:00/' server/logs/app.log
```

### 日志关键词速查

| 关键词 | 含义 | 行动 |
|--------|------|------|
| `EADDRINUSE` | 端口被占用 | 检查端口占用情况 |
| `SQLITE_CORRUPT` | 数据库损坏 | 从备份恢复 |
| `rate limit` | 速率限制触发 | 调整限制阈值 |
| `CORS` | 跨域错误 | 检查CORS配置 |
| `MODULE_NOT_FOUND` | 模块缺失 | 重新安装依赖 |
| `ENOMEM` | 内存不足 | 检查内存泄漏 |

---

## 应急联系

**技术支持**:
- GitHub Issues: [项目地址]/issues
- 紧急联系: support@wisdomflow.com

**文档更新**: 2026-05-06  
**版本**: v1.9.3
