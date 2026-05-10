# 📡 API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: 暂无（MVP阶段）

---

## 👤 用户相关 API

### 4. 获取用户信息

**GET** `/api/user/:id`

获取指定用户的详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 用户ID |

#### 响应示例

```json
{
  "id": 1,
  "name": "Demo User",
  "avatar": null,
  "balance": 100
}
```

---

## 🤖 AI 服务 API

### 5. 获取可用模型列表

**GET** `/api/ollama/tags`

获取本地 Ollama 服务中可用的模型列表。

#### 响应示例

```json
{
  "models": [
    {
      "name": "qwen2.5-coder:1.5b",
      "size": 1234567890,
      "digest": "abc123..."
    }
  ]
}
```

#### 错误响应

```json
{
  "error": "Ollama not available"
}
```

---

### 6. 调用 Ollama 生成

**POST** `/api/ollama/generate`

调用本地 Ollama 服务进行文本生成。

#### 请求体

```json
{
  "model": "qwen2.5-coder:1.5b",
  "prompt": "请帮我写一个JavaScript函数...",
  "stream": false
}
```

#### 响应示例

```json
{
  "response": "这是一个示例函数...\n\n```javascript\nfunction example() {\n  return 'Hello';\n}\n```",
  "done": true
}
```

#### 降级处理

如果 Ollama 服务不可用，返回提示信息：

```json
{
  "response": "AI 提示：您可以这样完成任务...（需要本地安装 Ollama）"
}
```

---

## 🎨 图像生成 API

### 7. 快速生成图像（GET）

**GET** `/api/image-generate/:prompt`

根据提示词快速生成图像（使用 Pollinations.ai 服务）。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 图像描述文本（URL编码） |

#### 响应示例

```json
{
  "url": "https://image.pollinations.ai/prompt/a%20beautiful%20landscape",
  "prompt": "a beautiful landscape"
}
```

---

### 8. 高级图像生成（POST）

**POST** `/api/image-generate`

使用更多参数生成高质量图像。

#### 请求体

```json
{
  "prompt": "a beautiful landscape",
  "style": "realistic",
  "width": 512,
  "height": 512
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| prompt | string | 是 | - | 图像描述 |
| style | string | 否 | "" | 风格修饰词 |
| width | integer | 否 | 512 | 图像宽度 |
| height | integer | 否 | 512 | 图像高度 |

#### 响应示例

```json
{
  "url": "https://image.pollinations.ai/seed/a%20beautiful%20landscaperealistic/512/512",
  "prompt": "a beautiful landscape",
  "style": "realistic",
  "width": 512,
  "height": 512,
  "status": "completed"
}
```

---

### 9. 获取图像风格列表

**GET** `/api/image-styles`

获取可用的图像风格选项。

#### 响应示例

```json
[
  {
    "id": "realistic",
    "name": "写实风格",
    "description": "逼真的照片效果"
  },
  {
    "id": "anime",
    "name": "动漫风格",
    "description": "日式动画风格"
  },
  {
    "id": "watercolor",
    "name": "水彩风格",
    "description": "水彩画效果"
  },
  {
    "id": "oil",
    "name": "油画风格",
    "description": "经典油画效果"
  },
  {
    "id": "digital",
    "name": "数字绘画",
    "description": "现代数字艺术"
  },
  {
    "id": "minimalist",
    "name": "极简风格",
    "description": "简约抽象"
  },
  {
    "id": "fantasy",
    "name": "奇幻风格",
    "description": "魔幻梦幻效果"
  },
  {
    "id": "cyberpunk",
    "name": "赛博朋克",
    "description": "未来科技感"
  }
]
```

---

## 📁 文件上传

### 上传目录

所有上传的文件保存在 `uploads/` 目录下。

### 访问上传的文件

上传后的文件可通过以下URL访问：

```
http://localhost:3000/uploads/<filename>
```

例如：`http://localhost:3000/uploads/1234567890-image.png`

### 支持的文件类型

- **图片**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **视频**: `.mp4`, `.webm`, `.mov`, `.avi`

### 文件大小限制

- 默认限制：无（可在 Multer 配置中设置）

---

## 🔒 安全说明

### CORS 配置

服务器已配置 CORS，允许的源在环境变量 `ALLOWED_ORIGINS` 中定义。

默认允许：
- `http://localhost:5173` (Vite开发服务器)
- `http://localhost:3000` (后端服务)

### 速率限制

当前版本未实现速率限制，生产环境建议添加。

### 身份认证

当前 MVP 版本使用简化用户系统（默认用户ID=1），生产环境需要实现完整的身份认证机制。

---

## 📊 数据库结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 用户名 |
| avatar | TEXT | 头像URL |
| balance | INTEGER | 余额（分） |

---

## 🧪 测试示例

### cURL 示例

```bash
# 获取用户信息
curl http://localhost:3000/api/user/1

# 生成图像
curl "http://localhost:3000/api/image-generate/a%20beautiful%20cat"

# 高级图像生成
curl -X POST http://localhost:3000/api/image-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat","style":"anime","width":512,"height":512}'

# 获取图像风格列表
curl http://localhost:3000/api/image-styles

# 调用 Ollama
curl -X POST http://localhost:3000/api/ollama/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:1.5b","prompt":"Hello"}'
```

### JavaScript 示例

*(暂无特定示例，请参考通用 Fetch API 用法)*

---

## 📝 更新日志

### v1.1.0 (2026-05-05)

- ✅ 实现8个AI创作工具
- ✅ 添加工作流系统
- ✅ 实现自动检查和人工审核
- ✅ 添加搜索和筛选功能
- ✅ 统一API配置管理

### v1.0.0 (2026-05-01)

- ✅ 用户账户系统
- ✅ AI集成（Ollama）
- ✅ 图像生成功能

---

**文档版本**: v1.1.0  
**最后更新**: 2026-05-05
