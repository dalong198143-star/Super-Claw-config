# 🛠️ 运维手册 - AI漫剧创作平台

## 📋 目录

1. [部署指南](#部署指南)
2. [环境变量配置](#环境变量配置)
3. [监控与日志](#监控与日志)
4. [故障排查](#故障排查)
5. [备份与恢复](#备份与恢复)
6. [性能优化](#性能优化)

---

## 部署指南

### 前置要求

**系统要求**:
- Node.js >= 18.0.0
- npm >= 9.0.0
- SQLite3 (内置，无需单独安装)
- 内存: >= 512MB
- 磁盘空间: >= 1GB

### 快速部署（开发环境）

#### 1. 克隆代码

```bash
git clone <repository-url>
cd xuexi编程基础
```

#### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client && npm install && cd ..

# 安装后端依赖
cd server && npm install && cd ..
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，根据实际环境修改配置
nano .env
```

#### 4. 启动服务

```bash
# 方式一：同时启动前后端（推荐）
npm run dev

# 方式二：分别启动
npm run dev:server  # 后端服务
npm run dev:client  # 前端服务
```

#### 5. 验证部署

访问以下地址验证服务是否正常：
- 前端: http://localhost:5173
- 后端健康检查: http://localhost:3001/api/health

---

### Docker 部署（生产环境）

#### 1. 构建镜像

```bash
# 构建后端镜像
docker build -t wisdomflow-server ./server

# 构建前端镜像
docker build -t wisdomflow-client ./client
```

#### 2. 使用 Docker Compose 启动

```bash
# 创建并启动容器
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 3. 停止服务

```bash
docker-compose down
```

---

## 环境变量配置

### 后端环境变量 (`server/.env`)

| 变量名 | 必填 | 默认值 | 说明 | 示例 |
|--------|------|--------|------|------|
| `PORT` | 否 | 3001 | 后端服务端口 | `PORT=3001` |
| `NODE_ENV` | 否 | development | 运行环境 | `production` / `development` |
| `OLLAMA_URL` | 否 | http://localhost:11434 | Ollama AI服务地址 | `http://ai-server:11434` |
| `DB_PATH` | 否 | ./database.sqlite | SQLite数据库路径 | `/data/wisdomflow.db` |
| `UPLOAD_DIR` | 否 | ./uploads | 文件上传目录 | `/uploads` |
| `MAX_FILE_SIZE` | 否 | 10485760 | 最大文件大小(字节) | `10485760` (10MB) |
| `RATE_LIMIT_WINDOW_MS` | 否 | 900000 | 速率限制时间窗口(ms) | `900000` (15分钟) |
| `RATE_LIMIT_MAX_REQUESTS` | 否 | 100 | 速率限制最大请求数 | `100` |

### 前端环境变量 (`client/.env`)

| 变量名 | 必填 | 默认值 | 说明 | 示例 |
|--------|------|--------|------|------|
| `VITE_API_URL` | 否 | http://localhost:3001 | 后端API地址 | `https://api.wisdomflow.com` |
| `VITE_OLLAMA_URL` | 否 | http://localhost:11434 | Ollama AI服务地址 | `https://ai.wisdomflow.com` |

### 环境变量优先级

1. **系统环境变量** (最高优先级)
2. **.env 文件**
3. **配置文件默认值** (最低优先级)

---

## 监控与日志

### 健康检查

**端点**: `GET /api/health`

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-06T12:00:00.000Z",
  "uptime": 3600
}
```

**监控建议**:
- 每30秒检查一次健康端点
- 如果连续3次失败，触发告警
- 监控响应时间应 < 100ms

### 日志管理

#### 后端日志位置

- **标准输出**: `stdout` (Docker环境中)
- **错误日志**: `stderr`
- **应用日志**: `server/logs/app.log` (如配置了文件日志)

#### 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|----------|
| `error` | 错误 | 系统异常、API错误 |
| `warn` | 警告 | 潜在问题、降级处理 |
| `info` | 信息 | 正常业务操作 |
| `debug` | 调试 | 开发调试信息 |

#### 日志格式

```
[时间] [级别] [模块] 消息
[2026-05-06 12:00:00] [INFO] [API] GET /api/tasks - 200 (15ms)
[2026-05-06 12:00:01] [ERROR] [DB] Database connection failed
```

### 性能指标监控

**关键指标**:
1. **CPU使用率**: 应 < 80%
2. **内存使用**: 应 < 512MB
3. **响应时间**: P95 < 200ms
4. **错误率**: < 1%
5. **并发连接数**: 监控峰值

**监控工具推荐**:
- Prometheus + Grafana (开源)
- New Relic (商业)
- Datadog (商业)

---

## 故障排查

### 常见问题

#### 1. 后端服务无法启动

**症状**: `npm run dev:server` 报错

**排查步骤**:
```bash
# 1. 检查端口是否被占用
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# 2. 检查Node.js版本
node --version  # 应 >= 18.0.0

# 3. 检查依赖是否安装
ls node_modules  # 应存在

# 4. 查看详细错误日志
NODE_DEBUG=* npm run dev:server
```

**解决方案**:
- 端口冲突: 修改 `.env` 中的 `PORT` 或杀死占用进程
- 依赖缺失: `cd server && npm install`
- Node版本过低: 升级Node.js到18+

---

#### 2. 前端页面空白

**症状**: 访问 http://localhost:5173 显示空白

**排查步骤**:
```bash
# 1. 检查浏览器控制台错误
# F12 -> Console 查看错误信息

# 2. 检查后端API是否可达
curl http://localhost:3001/api/health

# 3. 检查前端构建是否有错误
cd client && npm run build
```

**常见原因**:
- 后端服务未启动
- CORS配置错误
- API地址配置错误

**解决方案**:
- 确保后端服务正常运行
- 检查 `client/src/config.js` 中的 `API_BASE_URL`
- 检查浏览器控制台具体错误信息

---

#### 3. 数据库连接失败

**症状**: API返回500错误，日志显示数据库错误

**排查步骤**:
```bash
# 1. 检查数据库文件是否存在
ls -la server/database.sqlite

# 2. 检查文件权限
chmod 644 server/database.sqlite

# 3. 尝试手动连接
sqlite3 server/database.sqlite ".tables"
```

**解决方案**:
- 文件不存在: 重启服务会自动创建
- 权限问题: `chmod 644 database.sqlite`
- 文件损坏: 删除后重启服务重建

---

#### 4. 文件上传失败

**症状**: 上传图片/视频时失败

**排查步骤**:
```bash
# 1. 检查上传目录是否存在
ls -la uploads/

# 2. 检查目录权限
chmod 755 uploads/

# 3. 检查文件大小是否超限
ls -lh uploaded-file.jpg
```

**解决方案**:
- 目录不存在: `mkdir -p uploads`
- 权限不足: `chmod 755 uploads`
- 文件过大: 调整 `MAX_FILE_SIZE` 环境变量

---

#### 5. 速率限制触发

**症状**: API返回429 Too Many Requests

**排查步骤**:
```bash
# 1. 检查当前速率限制配置
cat .env | grep RATE_LIMIT

# 2. 查看请求频率日志
tail -f server/logs/app.log | grep "rate limit"
```

**解决方案**:
- 临时解决: 等待15分钟（默认窗口期）
- 永久解决: 增加 `RATE_LIMIT_MAX_REQUESTS` 值
- 优化客户端: 减少不必要的请求频率

---

### 紧急恢复流程

#### 服务崩溃恢复

```bash
# 1. 停止所有服务
docker-compose down  # 如果使用Docker
# 或
pkill -f node  # Linux/Mac

# 2. 清理临时文件
rm -rf uploads/*  # 可选，清理上传文件
rm -f server/database.sqlite  # 谨慎！会丢失数据

# 3. 重新启动
docker-compose up -d
# 或
npm run dev
```

#### 数据恢复

```bash
# 1. 从备份恢复数据库
cp backups/database-2026-05-06.sqlite server/database.sqlite

# 2. 重启服务
npm run dev:server
```

---

## 备份与恢复

### 备份策略

#### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="server/database.sqlite"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/database_$TIMESTAMP.sqlite"
    echo "Database backed up to $BACKUP_DIR/database_$TIMESTAMP.sqlite"
else
    echo "Database file not found!"
    exit 1
fi

# 保留最近30天的备份
find $BACKUP_DIR -name "database_*.sqlite" -mtime +30 -delete
echo "Old backups cleaned up"
```

#### 定时任务（Linux）

```bash
# 每天凌晨2点执行备份
crontab -e
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 恢复步骤

```bash
# 1. 停止服务
npm run dev:server stop

# 2. 恢复数据库
cp backups/database_20260506_020000.sqlite server/database.sqlite

# 3. 重启服务
npm run dev:server
```

---

## 性能优化

### 前端优化

#### 1. 代码分割

已在 Vite 配置中启用：
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        workflow: ['./src/components/workflow']
      }
    }
  }
}
```

#### 2. 资源压缩

- Gzip/Brotli 压缩已启用
- 图片懒加载
- 组件按需加载

#### 3. 缓存策略

```nginx
# Nginx配置示例
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 后端优化

#### 1. 数据库优化

- 使用索引加速查询
- 避免N+1查询问题
- 定期清理过期数据

#### 2. 缓存策略

```javascript
// 简单的内存缓存示例
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

#### 3. 连接池

SQLite为单文件数据库，无需连接池。如迁移到PostgreSQL/MySQL，需配置连接池。

### 监控优化建议

1. **启用Gzip压缩**: 减少传输体积60-80%
2. **CDN加速**: 静态资源使用CDN
3. **负载均衡**: 高并发时使用Nginx反向代理
4. **水平扩展**: 多实例部署 + 共享数据库

---

## 安全加固清单

- ✅ HTTPS证书配置（生产环境）
- ✅ CORS白名单限制
- ✅ 速率限制启用
- ✅ Helmet安全头配置
- ✅ 输入验证完善
- ✅ 文件上传限制
- ✅ SQL注入防护
- ✅ XSS防护
- ⏸️ JWT认证（待实现）
- ⏸️ CSRF防护（待实现）

---

## 联系与支持

**技术支持**: 
- GitHub Issues: [项目地址]/issues
- 邮箱: support@wisdomflow.com

**文档更新**: 2026-05-06  
**版本**: v1.9.3
