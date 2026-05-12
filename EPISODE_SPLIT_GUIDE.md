# 🎬 AI漫剧智能分集系统 - 技术架构与使用指南

**版本**: v2.3.0-alpha  
**更新日期**: 2026-05-10  
**状态**: ✅ **已完成**

---

## 📋 目录

1. [功能概述](#功能概述)
2. [架构设计](#架构设计)
3. [API文档](#api文档)
4. [使用示例](#使用示例)
5. [配置要求](#配置要求)
6. [最佳实践](#最佳实践)

---

## 🎯 功能概述

### 核心价值

智能分集系统解决了**长剧本处理**的核心痛点：

```
❌ 问题: 用户上传10万字小说，系统无法一次性处理
✅ 解决: 自动拆分为20集，每集5分钟，智能识别剧情边界
```

### 核心能力

1. **智能结构分析** - LLM理解剧情逻辑，识别自然分集点
2. **多维度优化** - 时长控制、悬念设置、角色平衡
3. **降级容错** - LLM失败时自动切换到规则分集
4. **批量分镜生成** - 一键生成所有集数的分镜脚本

---

## 🏗️ 架构设计

### 三层拆解模型

```
原始剧本 (10万字)
    ↓
┌─────────────────────────┐
│  Layer 1: 分集 (Episode) │  ← 智能分集服务
│  - 20集 × 5分钟/集       │
│  - 每集约5000字          │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│  Layer 2: 分场 (Scene)   │  ← 现有storyboard.js
│  - 每集3-5个场景         │
│  - 场景包含地点/时间     │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│  Layer 3: 分镜 (Shot)    │  ← 现有storyboard.js
│  - 每场5-10个镜头        │
│  - 镜头包含画面/台词     │
└─────────────────────────┘
```

### 混合分集策略

```javascript
// 伪代码流程
async function smartSplit(script) {
  // Step 1: LLM智能分析（优先）
  try {
    const episodes = await llmAnalyze(script);
    return validateAndOptimize(episodes);
  } catch (error) {
    // Step 2: 降级到规则分集（保底）
    console.warn('LLM失败，使用规则分集');
    return ruleBasedSplit(script);
  }
}
```

### 分集原则

| 原则 | 说明 | 实现方式 |
|------|------|---------|
| **剧情完整性** | 避免在关键情节中间切断 | LLM理解剧情结构 |
| **节奏控制** | 每集时长5±1分钟 | 目标时长参数化 |
| **悬念设置** | 每集结尾有钩子 | LLM生成hook字段 |
| **角色平衡** | 主要角色均匀分布 | key_characters字段 |
| **场景连贯** | 避免同场景中断裂 | start/end_position校验 |

---

## 📡 API文档

### 1. 智能分集分析

**端点**: `POST /api/comic-drama/analyze-episodes`

将长剧本智能拆分为多个剧集。

#### 请求参数

```json
{
  "script": "完整的剧本文本（最多10万字）",
  "options": {
    "targetDurationPerEpisode": 300,  // 每集目标时长（秒），默认300
    "maxEpisodes": 20,                // 最大分集数，默认20
    "style": "modern_anime",          // 动漫风格
    "language": "zh-CN"               // 语言
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "episodes": [
    {
      "episode_number": 1,
      "title": "急诊室的深夜",
      "summary": "李明医生在深夜急诊室面对第一个重大挑战...",
      "start_position": 0,
      "end_position": 2500,
      "text_length": 2500,
      "estimated_duration": 280,
      "estimated_shots": 93,
      "key_characters": ["李明", "张医生"],
      "climax_level": "medium",
      "hook": "突然，急救车送来了一名神秘病人..."
    },
    {
      "episode_number": 2,
      "title": "神秘病人",
      "summary": "...",
      "start_position": 2500,
      "end_position": 5000,
      "text_length": 2500,
      "estimated_duration": 300,
      "estimated_shots": 100,
      "key_characters": ["李明", "神秘病人"],
      "climax_level": "high",
      "hook": "病人的身份竟然出乎所有人意料..."
    }
  ],
  "costEstimate": {
    "scriptLength": 50000,
    "episodesCount": 20,
    "inputTokens": 12500,
    "outputTokens": 4000,
    "totalCost": "0.0165",
    "currency": "USD",
    "note": "仅分集分析费用，不包含后续分镜生成费用"
  },
  "totalDuration": 6000,
  "totalShots": 2000
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "剧本过长，请控制在10万字以内"
}
```

---

### 2. 批量生成分集分镜

**端点**: `POST /api/comic-drama/generate-episodes-storyboard`

基于分集结果，批量生成所有集数的分镜脚本。

#### 请求参数

```json
{
  "script": "完整的剧本文本",
  "episodes": [
    {
      "episode_number": 1,
      "start_position": 0,
      "end_position": 2500,
      ...
    }
  ],
  "options": {
    "style": "modern_anime"
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "results": [
    {
      "episode": 1,
      "success": true,
      "storyboard": {
        "episode_id": 1,
        "title": "急诊室的深夜",
        "scenes": [...]
      }
    },
    {
      "episode": 2,
      "success": false,
      "error": "LLM超时"
    }
  ],
  "successCount": 19,
  "failCount": 1,
  "total": 20
}
```

---

## 💻 使用示例

### 示例1: 基础分集分析

```javascript
// 前端调用示例
const response = await fetch('/api/comic-drama/analyze-episodes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: userInput.script, // 用户上传的完整剧本
    options: {
      targetDurationPerEpisode: 300, // 每集5分钟
      maxEpisodes: 20,
    }
  })
});

const data = await response.json();

if (data.success) {
  console.log(`分集完成: ${data.episodes.length}集`);
  console.log(`总时长: ${Math.round(data.totalDuration / 60)}分钟`);
  console.log(`总镜头数: ${data.totalShots}`);
  
  // 展示分集列表
  data.episodes.forEach(ep => {
    console.log(`第${ep.episode_number}集: ${ep.title}`);
    console.log(`  摘要: ${ep.summary}`);
    console.log(`  时长: ${ep.estimated_duration}秒`);
    console.log(`  悬念: ${ep.hook}`);
  });
}
```

### 示例2: 用户确认分集方案

```javascript
// 展示分集方案给用户确认
function displayEpisodePlan(episodes) {
  return `
    <div class="episode-plan">
      <h3>分集方案预览</h3>
      <p>共${episodes.length}集，总时长${Math.round(episodes.reduce((sum, ep) => sum + ep.estimated_duration, 0) / 60)}分钟</p>
      
      <div class="episode-list">
        ${episodes.map(ep => `
          <div class="episode-card">
            <h4>第${ep.episode_number}集: ${ep.title}</h4>
            <p>${ep.summary}</p>
            <div class="episode-meta">
              <span>⏱️ ${ep.estimated_duration}秒</span>
              <span>🎬 ${ep.estimated_shots}镜头</span>
              <span>🔥 ${ep.climax_level === 'high' ? '高潮' : ep.climax_level === 'medium' ? '中等' : '平缓'}</span>
            </div>
            <div class="episode-hook">
              <strong>悬念:</strong> ${ep.hook}
            </div>
          </div>
        `).join('')}
      </div>
      
      <button onclick="confirmEpisodes()">✅ 确认分集方案</button>
      <button onclick="regenerateEpisodes()">🔄 重新分集</button>
    </div>
  `;
}
```

### 示例3: 批量生成分镜

```javascript
// 用户确认后，批量生成所有集数的分镜
async function generateAllEpisodes(script, episodes) {
  const response = await fetch('/api/comic-drama/generate-episodes-storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script,
      episodes,
      options: { style: 'modern_anime' }
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`分镜生成完成: 成功${data.successCount}集, 失败${data.failCount}集`);
    
    // 保存所有分镜脚本
    data.results.forEach(result => {
      if (result.success) {
        saveStoryboard(result.episode, result.storyboard);
      }
    });
  }
}
```

### 示例4: 成本预估

```javascript
// 在执行分集前，先估算成本
const costResponse = await fetch('/api/comic-drama/analyze-episodes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: longScript,
    options: { maxEpisodes: 20 }
  })
});

const costData = await costResponse.json();

if (costData.success) {
  alert(`分集分析费用预估: $${costData.costEstimate.totalCost}\n是否继续？`);
}
```

---

## 🔧 配置要求

### 环境变量 (.env)

```bash
# DeepSeek API（必需，用于智能分集）
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat

# 其他服务（可选）
SILICONFLOW_API_KEY=your_siliconflow_api_key
AZURE_TTS_KEY=your_azure_tts_key
```

### 依赖包

无需新增依赖，使用现有的`node-fetch`。

---

## 📊 性能指标

| 操作 | 平均耗时 | 说明 |
|------|---------|------|
| 分集分析（5万字） | 10-20秒 | LLM推理时间 |
| 单集分镜生成 | 5-15秒 | 取决于场景复杂度 |
| 批量分镜（20集） | 2-5分钟 | 顺序生成 |
| 规则分集（降级） | <1秒 | 纯JavaScript计算 |

**成本估算**（DeepSeek定价）:
- 输入: $1/百万token ≈ ¥0.007/千字符
- 输出: $2/百万token ≈ ¥0.014/千字符
- 5万字剧本分集: 约¥0.5-1.0

---

## 🎯 最佳实践

### 1. 分集参数调优

```javascript
// 短剧模式（快节奏）
const shortDramaOptions = {
  targetDurationPerEpisode: 180, // 每集3分钟
  maxEpisodes: 30,               // 最多30集
};

// 长篇模式（慢节奏）
const longDramaOptions = {
  targetDurationPerEpisode: 600, // 每集10分钟
  maxEpisodes: 10,               // 最多10集
};

// 电影模式（单集）
const movieOptions = {
  targetDurationPerEpisode: 5400, // 90分钟
  maxEpisodes: 1,                 // 单集
};
```

### 2. 用户体验优化

```javascript
// 渐进式加载
async function progressiveEpisodeGeneration(script) {
  // Step 1: 快速分集分析（10-20秒）
  const episodes = await analyzeEpisodes(script);
  displayEpisodePlan(episodes);
  
  // Step 2: 用户确认后，逐集生成分镜（避免长时间等待）
  for (const episode of episodes) {
    const storyboard = await generateStoryboard(episode);
    displayStoryboardPreview(episode, storyboard);
    
    // 询问用户是否继续
    if (!await userConfirm()) break;
  }
}
```

### 3. 错误处理

```javascript
try {
  const episodes = await analyzeEpisodes(script);
} catch (error) {
  if (error.message.includes('LLM')) {
    // LLM失败，提示用户使用规则分集
    alert('智能分集暂时不可用，已切换到规则分集模式');
    const episodes = fallbackRuleBasedSplit(script);
  } else {
    // 其他错误
    throw error;
  }
}
```

### 4. 缓存策略

```javascript
// 缓存分集结果（相同剧本无需重复分析）
const cache = new Map();

async function cachedAnalyzeEpisodes(script, options) {
  const cacheKey = hash(script + JSON.stringify(options));
  
  if (cache.has(cacheKey)) {
    console.log('[Cache] 命中分集缓存');
    return cache.get(cacheKey);
  }
  
  const episodes = await analyzeAndSplitEpisodes(script, options);
  cache.set(cacheKey, episodes);
  
  return episodes;
}
```

---

## 🚀 下一步计划

### 前端集成（待实现）

1. **ComicDramaTool Step 1.5: 分集确认界面**
   - 展示分集方案预览
   - 允许用户调整分集边界
   - 支持合并/拆分剧集
   - 成本预估显示

2. **批量分镜生成进度**
   - 实时进度条（0% → 100%）
   - 每集独立状态显示
   - 失败重试机制

3. **分集管理界面**
   - 剧集列表视图
   - 快速导航到指定集
   - 导出分集大纲

---

## 📝 变更清单

### 新增文件
1. `server/services/episodeSplit.js` - 智能分集服务（350行）
2. `EPISODE_SPLIT_GUIDE.md` - 本文档

### 修改文件
1. `server/index.js` - 添加分集分析和批量分镜生成API路由（2个新端点）

---

## 🎉 总结

智能分集系统为AI漫剧制作带来了**革命性的改进**：

✅ **自动化** - 从手动分集到智能分析  
✅ **智能化** - LLM理解剧情逻辑，设置悬念  
✅ **灵活性** - 支持多种分集模式（短剧/长篇/电影）  
✅ **可靠性** - LLM失败时自动降级到规则分集  

**核心价值**: 用户可以上传整本小说，系统自动拆分为合理的剧集，并批量生成分镜脚本，真正实现"一键生成漫剧"！

---

**文档版本**: v1.0  
**最后更新**: 2026-05-10  
**维护者**: Lingma AI Assistant
