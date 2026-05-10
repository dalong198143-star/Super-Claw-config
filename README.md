# 🎬 AI漫剧创作平台

> 一句话生成一部漫剧 - 智能分集 + 端到端自动化工作流

[![Version](https://img.shields.io/badge/version-2.8.0--alpha-blue.svg)](https://github.com/your-repo/comic-drama-platform)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

## 📋 项目简介

这是一个**AI驱动的漫剧创作平台**，让用户能够通过输入剧本或小说，一键生成完整的动漫剧集。平台整合了LLM智能分集、Stable Diffusion图像生成、TTS配音和FFmpeg视频合成等技术，实现从"文字→视频"的端到端自动化流程。

### ✨ 核心特性

- 📚 **智能分集系统**: LLM自动拆解长剧本为合理剧集，支持短剧/标准/长篇/电影四种模式
- 🎬 **批量分镜生成**: 一键生成所有集数的分镜脚本（场景+镜头+台词）
- 🖼️ **Stable Diffusion图像生成**: 批量生成高质量动漫风格图像，支持6种风格
- 🎙️ **TTS配音服务**: 支持Azure/ElevenLabs/Coqui三种引擎，自动生成角色配音
- 🎵 **字幕与BGM**: 自动烧录SRT字幕，支持背景音乐混合
- 🎞️ **FFmpeg视频合成**: 图像+音频+字幕合成为最终MP4视频
- 💰 **成本透明化**: 每步操作前显示成本预估，避免意外账单
- ⚡ **容错机制**: 断点续传、自动重试、部分失败不影响整体

### 🆕 v2.5.0-alpha 重大重构（第一性原理优化）

**产品定位明确**: 专注"AI漫剧创作平台"，端到端自动化工作流  
**工作流程简化**: 从6步简化为3步核心流程（输入→确认→输出）  
**成本透明化**: 每步操作前显示详细成本预估  
**容错机制完善**: 断点续传、自动重试、部分失败不影响整体

### 🎯 简化后的3步工作流

```
Step 1: 输入剧本
  ↓ (自动后台处理：智能分集 + 批量分镜)
Step 2: 预览和调整（可选）
  ↓ (一键生成)
Step 3: 输出视频（图像+配音+字幕+BGM）
```

**关键改进**:
- ✅ 智能分集和分镜合并为后台自动处理
- ✅ 角色配置使用AI自动生成默认值
- ✅ TTS/BGM使用最佳默认配置
- ✅ 用户只需关注：输入 → 确认 → 输出

### 🆕 v2.4.0-alpha 新增功能（前端智能分集集成）

- 🖼️ **Stable Diffusion批量图像生成**：从分镜到图像的自动化转换
  - 单镜头和批量生成支持
  - 实时进度追踪（0% → 100%）
  - 失败重试机制（单个失败不影响其他）
  - API端点：`POST /api/comic-drama/batch-generate-images`

- 💰 **成本估算服务**：透明化费用预览
  - 根据镜头数量预估总费用
  - 示例：15张图像仅需¥0.15
  - API端点：`POST /api/comic-drama/estimate-cost`

- ✨ **ComicDramaTool Step 4完整实现**：用户可真正看到"剧本→分镜→图像"流程
  - 批量生成全部按钮
  - 单镜头独立生成
  - 错误提示和进度显示

### 🆕 v2.4.0-alpha 新增功能（前端智能分集集成）

- 📚 **Step 1.5: 智能分集界面**：用户友好的分集配置和预览
  - 分集参数配置（时长/集数/风格）
  - 分集方案预览卡片（标题/摘要/悬念/高潮程度）
  - 多选集数功能（选择性生成）
  - 实时统计面板（总集数/时长/镜头数）

- 🔄 **工作流程升级**：从5步扩展为6步
  - Step 1 → Step 1.5（智能分集）→ Step 2（批量分镜）
  - 支持短剧/标准/长篇/电影四种模式
  - 成本透明化展示

- ✨ **用户体验优化**
  - 渐进式加载流程
  - Loading状态和错误提示
  - 智能默认值减少配置
  - 灵活的分集模式切换

### 🆕 v2.3.0-alpha 新增功能（智能分集系统）

- 📚 **智能分集分析**：LLM自动拆解长剧本为多集
  - 理解剧情逻辑，识别自然分集点
  - 生成分集标题、摘要、悬念钩子
  - 支持配置每集时长（短剧/长篇/电影模式）
  - API端点：`POST /api/comic-drama/analyze-episodes`

- 🎬 **批量分镜生成**：一键生成所有集数的分镜脚本
  - 基于分集结果，逐集调用LLM
  - 实时进度追踪
  - 失败重试机制
  - API端点：`POST /api/comic-drama/generate-episodes-storyboard`

- 💰 **成本透明化**：分集分析费用预估
  - DeepSeek API定价计算
  - 示例：5万字约¥0.5-1.0

- 🔄 **降级容错**：LLM失败时自动切换到规则分集
  - 按段落边界智能切割
  - 确保100%覆盖完整剧本

### 🆕 v2.2.0-alpha 新增功能（TTS配音 + 视频合成）

- 🎙️ **TTS配音服务**：支持3种引擎（Azure/ElevenLabs/Coqui）
  - 批量生成台词语音
  - 实时进度追踪
  - API端点：`POST /api/comic-drama/batch-generate-speech`

- 📝 **字幕生成服务**：SRT/VTT格式，自动时间轴计算
  - 从分镜脚本提取字幕
  - 音画同步调整
  - 字幕烧录到视频

- 🎬 **FFmpeg视频合成**：图像+音频+字幕完整流程
  - 5步渐进式合成（图像→音频→混合→添加→字幕）
  - 自定义FPS、分辨率、音量
  - API端点：`POST /api/comic-drama/synthesize-video`

- 💰 **成本透明化**：TTS费用预估
  - Azure: $0.00016/字符
  - ElevenLabs: $0.0003/字符
  - API端点：`POST /api/comic-drama/estimate-tts-cost`

### 🆕 v2.0.0 新增功能（后端集成）

- 🔧 **LLM分镜生成服务**：剧本到JSON分镜脚本的自动化转换
  - 支持6种动漫风格（吉卜力/现代日漫/复古/Q版/赛博朋克/奇幻）
  - 智能场景分割和镜头分配
  - 高质量英文提示词自动生成
  - RESTful API端点：`POST /api/comic-drama/generate-storyboard`

- ✨ **提示词优化服务**：确保角色一致性和图像质量
  - 基于角色描述的提示词增强
  - 自动添加质量关键词和艺术风格
  - API端点：`POST /api/comic-drama/optimize-prompt`

- 📊 **完整API文档**：详细的接口说明和使用示例
  - 请求/响应格式规范
  - 错误处理指南
  - 完整工作流程代码示例

- ✅ **测试覆盖率达标**：97.5%用例通过率（234/240）
  - 25个测试套件全部通过（100%）
  - 符合80%+覆盖率要求

### 🆕 v1.9.5 新增功能

- 🎭 **AI漫剧制作系统**：工业级剧本到视频的自动化流水线
  - 5步工作流：导入剧本→生成分镜→角色配置→批量生成→最终合成
  - JSON分镜脚本作为模块间通用语言
  - 角色一致性控制（LoRA/IP-Adapter/ControlNet三保险方案）
  - TTS配音+字幕+FFmpeg音画同步合成

- 🎬 **AI动漫视频生成工作流**：从提示词到完整视频的4步引导式创作
  - 6种动漫风格模板（吉卜力风、现代日漫、复古、Q版、赛博朋克、奇幻）
  - 全面的参数配置（时长/分辨率/FPS/运动强度/镜头运动）
  - 首帧预览和实时进度反馈

## 🚀 快速开始

### 前置要求

- Node.js >= 20.x
- npm >= 9.x
- （可选）Docker & Docker Compose

### 安装依赖

```
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client && npm install

# 安装服务器端依赖
cd ../server && npm install
```

### 开发模式

```
# 同时启动前后端（推荐）
npm run dev

# 单独启动后端
npm run dev:server

# 单独启动前端
npm run dev:client
```

访问 http://localhost:5173 查看应用

### 生产构建

```
# 使用 Docker 构建和运行
docker-compose up -d

# 或手动构建
cd client && npm run build
cd ../server && npm start
```

## 📁 项目结构

```
xuexi编程基础/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/    # React组件（待拆分）
│   │   ├── App.jsx        # 主应用组件
│   │   ├── config.js      # API配置
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── server/                # 后端服务
│   ├── index.js          # 服务器入口
│   ├── config.js         # 服务器配置
│   └── package.json
├── uploads/              # 文件上传目录
├── Dockerfile            # Docker镜像配置
├── docker-compose.yml    # Docker编排配置
├── .env.example          # 环境变量模板
└── README.md             # 项目文档
```

## 🛠️ 技术栈

### 前端
- **框架**: React 19
- **构建工具**: Vite 8
- **状态管理**: React Hooks
- **样式**: CSS3

### 后端
- **运行时**: Node.js 20
- **框架**: Express 4
- **数据库**: SQLite (better-sqlite3)
- **文件上传**: Multer
- **AI集成**: Ollama API

### 部署
- **容器化**: Docker
- **编排**: Docker Compose
- **反向代理**: Nginx（可选）

## 📖 功能模块

### 1. 创作工具系统

| 工具 | 图标 | 输入 | 输出 | 说明 |
|------|------|------|------|------|
| 文生图 | 🖼️ | 文字 | 图片 | 根据文本描述生成图像 |
| 图生视频 | 🎬 | 图片 | 视频 | 将静态图像转换为动态视频 |
| 图生图 | 🔄 | 图片 | 图片 | 图像风格转换和优化 |
| 视频生图 | 📹 | 视频 | 图片 | 从视频中提取关键帧 |
| 动作迁移 | 🕺 | 视频+图片 | 视频 | 将动作从一个视频迁移到另一个 |
| 换装 | 👗 | 图片+图片 | 图片 | AI智能换装 |
| 重绘洗图 | 🔧 | 图片 | 图片 | 图像去噪、增强、风格转换 |
| 视频拼接 | 🎬 | 视频×N | 长视频 | 合并多个视频片段 |

### 2. 工作流系统

平台支持两种工作流模式：

#### 快速模式
- 直接调用AI模型生成结果
- 适合熟练用户快速完成任务

#### 全流程模式
- **文生图工作流** (6步):
  1. 文本解析 → 2. 模型选择 → 3. 参数配置 → 4. 图像生成 → 5. 质量评估 → 6. 结果修整

- **图生视频工作流** (6步):
  1. 图像分析 → 2. 关键帧提取 → 3. 运动参数设置 → 4. 视频生成 → 5. 帧序列优化 → 6. 结果导出

每个步骤包含：
- ✅ 自动检查（格式、完整性、质量）
- 👤 人工审核（关键步骤）
- 📊 实时进度跟踪

## ⚙️ 配置说明

### 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| OLLAMA_BASE_URL | Ollama服务地址 | http://localhost:11434 |
| IMAGE_SERVICE_URL | 图像生成服务URL | https://image.pollinations.ai |
| ALLOWED_ORIGINS | CORS允许的源 | http://localhost:5173 |

### Ollama 本地部署（可选）

如需使用本地AI模型：

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 拉取模型
ollama pull qwen2.5-coder:1.5b

# 启动服务
ollama serve
```

## 📚 文档

- [API文档](API_DOCUMENTATION.md) - 完整的API接口说明
- [运维手册](OPERATIONS_MANUAL.md) - 部署、监控、备份指南
- [故障排查](TROUBLESHOOTING_GUIDE.md) - 常见问题解决方案
- [工作流重构指南](WORKFLOW_REFACTORING_GUIDE.md) - 工作流系统架构说明
- [组件重构计划](COMPONENT_REFACTORING_PLAN.md) - 代码优化路线图

## 🧪 测试报告

- [第一阶段完成报告](PHASE1_COMPLETION_REPORT.md) - 布局重构
- [第二阶段完成报告](PHASE2_COMPLETION_REPORT.md) - 组件拆分
- [第三阶段完成报告](PHASE3_COMPLETION_REPORT.md) - 单元测试
- [安全加固报告](SECURITY_HARDENING_REPORT.md) - 安全增强
- [工作流功能完善报告](WORKFLOW_ENHANCEMENT_REPORT.md) - 功能增强
- [集成测试报告](INTEGRATION_TEST_REPORT.md) - 集成与性能测试
- [第三阶段测试报告](THIRD_PHASE_TEST_REPORT.md) - 全面测试总结

```
