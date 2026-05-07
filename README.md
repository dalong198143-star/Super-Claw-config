# 🎓 AI协作技能学习变现平台 (MVP)

> 让学习成为投资，通过AI协作创造价值

[![Version](https://img.shields.io/badge/version-1.9.3-blue.svg)](https://github.com/your-repo/learning-to-earn)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

## 📋 项目简介

这是一个**学习变现平台**的最小可行性产品（MVP），旨在通过技术手段连接学习与收益。平台提供8种AI创作工具，帮助用户通过学习AI协作技能并完成任务来获得收益。

### ✨ 核心特性

- 🎨 **8大AI创作工具**: 文生图、图生视频、动作迁移、换装、重绘洗图等
- 🔄 **智能工作流系统**: 支持快速模式和全流程模式
- ✅ **自动检查机制**: 格式检查、完整性检查、质量检查
- 👤 **人工审核**: 关键步骤需要人工确认
- 🔒 **隐私保护**: 支持本地Ollama部署
- 💰 **任务变现**: 完成任务即可获得收益

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

### 3. 任务系统

- 📋 任务大厅：浏览可用任务
- 🔍 搜索筛选：按难度、奖励筛选
- 📤 任务提交：上传作品并获得收益
- 💰 收益管理：查看余额和交易记录

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
