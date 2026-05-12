# 🎬 AI漫剧后端API文档

**版本**: v2.0.0  
**更新日期**: 2026-05-10  
**基础URL**: `http://localhost:3001/api`

---

## 📋 目录

1. [分镜生成](#分镜生成)
2. [提示词优化](#提示词优化)
3. [错误处理](#错误处理)
4. [使用示例](#使用示例)

---

## 🔧 API端点

### 分镜生成

**端点**: `POST /api/comic-drama/generate-storyboard`

将剧本/小说文本转换为结构化的JSON分镜脚本。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| script | string | ✅ | 剧本或小说文本（最多10000字符） |
| episodeId | number | ❌ | 集数ID，默认1 |
| style | string | ❌ | 动漫风格，可选值见下方 |

#### 风格选项

- `ghibli` - 吉卜力工作室风格
- `modern_anime` - 现代日漫风格（默认）
- `retro` - 复古动漫风格
- `chibi` - Q版萌系风格
- `cyberpunk` - 赛博朋克风格
- `fantasy` - 奇幻冒险风格

#### 响应格式

```json
{
  "success": true,
  "storyboard": {
    "episode_id": 1,
    "title": "章节标题",
    "scenes": [
      {
        "scene_id": "S001",
        "description": "场景描述",
        "location": "地点",
        "time_of_day": "白天",
        "characters": ["角色A", "角色B"],
        "duration": 5,
        "shots": [
          {
            "shot_id": 1,
            "duration": 3,
            "camera": "medium_shot",
            "angle": "eye_level",
            "character": "角色A",
            "action": "动作描述",
            "emotion": "情绪状态",
            "prompt": "高质量英文提示词...",
            "dialogue": "台词",
            "sound_effect": "音效"
          }
        ]
      }
    ]
  },
  "characters": [
    {
      "id": 1,
      "name": "角色A",
      "referenceImages": [],
      "loraModel": null
    }
  ]
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 示例请求

```javascript
const response = await fetch('http://localhost:3001/api/comic-drama/generate-storyboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: '深夜，急诊室里灯火通明。已经连续工作十个小时的李明医生疲惫地靠在走廊的墙上...',
    episodeId: 1,
    style: 'modern_anime'
  })
});

const data = await response.json();
console.log(data.storyboard);
```

---

### 提示词优化

**端点**: `POST /api/comic-drama/optimize-prompt`

优化单个镜头的提示词，确保角色一致性和图像质量。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | ✅ | 原始提示词 |
| characterDesc | string | ❌ | 角色描述（用于保持一致性） |

#### 响应格式

```json
{
  "success": true,
  "optimizedPrompt": "优化后的高质量英文提示词..."
}
```

#### 示例请求

```javascript
const response = await fetch('http://localhost:3001/api/comic-drama/optimize-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '一个医生在走廊里',
    characterDesc: '李明，30岁男性，黑色短发，戴眼镜，穿着白大褂，挂着听诊器'
  })
});

const data = await response.json();
console.log(data.optimizedPrompt);
// 输出: "A handsome Chinese doctor Li Ming, ~30 years old, short black hair, wearing glasses, white lab coat with stethoscope around neck, standing in hospital corridor, exhausted expression, dramatic lighting, cinematic composition, anime style, highly detailed, 8K, sharp focus"
```

---

## ⚠️ 错误处理

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |
| 503 | API密钥未配置 |

### 常见错误

1. **DEEPSEEK_API_KEY未配置**
   ```json
   { "error": "DEEPSEEK_API_KEY 未配置，请在 .env 中设置" }
   ```
   **解决**: 在`.env`文件中添加`DEEPSEEK_API_KEY=your_api_key`

2. **剧本过长**
   ```json
   { "error": "剧本过长（最多10000字符）" }
   ```
   **解决**: 缩短剧本内容或分批处理

3. **JSON格式错误**
   ```json
   { "error": "分镜脚本JSON格式错误，请重试" }
   ```
   **解决**: 重新生成，可能是LLM返回格式异常

---

## 💡 使用示例

### 完整工作流程

```javascript
// 1. 生成分镜脚本
const storyboardRes = await fetch('/api/comic-drama/generate-storyboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: userInput.script,
    style: userInput.style
  })
});

const { storyboard, characters } = await storyboardRes.json();

// 2. 展示分镜给用户确认
displayStoryboard(storyboard);

// 3. 用户配置角色（上传参考图、选择LoRA模型）
const configuredCharacters = await configureCharacters(characters);

// 4. 批量生成图像
for (const scene of storyboard.scenes) {
  for (const shot of scene.shots) {
    // 优化提示词
    const optimizedRes = await fetch('/api/comic-drama/optimize-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: shot.prompt,
        characterDesc: getCharacterDesc(shot.character, configuredCharacters)
      })
    });
    
    const { optimizedPrompt } = await optimizedRes.json();
    
    // 调用图像生成API
    const image = await generateImage(optimizedPrompt);
    
    // 保存结果
    saveShotImage(shot.shot_id, image);
  }
}

// 5. 视频合成（待实现）
await synthesizeVideo(storyboard);
```

---

## 🔐 安全注意事项

1. **API密钥保护**
   - `DEEPSEEK_API_KEY`必须存储在`.env`文件中
   - 不要将密钥提交到版本控制系统
   - 生产环境使用环境变量注入

2. **输入验证**
   - 剧本长度限制：10000字符
   - 自动过滤恶意代码
   - JSON输出验证

3. **速率限制**
   - 建议配置Express Rate Limit
   - 防止滥用API资源

---

## 📊 性能指标

| 操作 | 平均耗时 | 说明 |
|------|---------|------|
| 分镜生成 | 5-15秒 | 取决于剧本长度和复杂度 |
| 提示词优化 | 2-5秒 | 单个镜头 |
| 并发限制 | 取决于API配额 | DeepSeek API限制 |

---

## 🔄 版本历史

### v2.0.0 (2026-05-10)
- ✨ 初始版本发布
- ✅ 分镜生成API
- ✅ 提示词优化API
- ✅ 角色提取功能

---

## 📞 技术支持

如有问题，请查看：
- [COMIC_DRAMA_WORKFLOW.md](../COMIC_DRAMA_WORKFLOW.md) - 技术架构文档
- [COMIC_DRAMA_QUICK_START.md](../COMIC_DRAMA_QUICK_START.md) - 快速入门指南
- GitHub Issues - 报告bug或提出建议

---

**最后更新**: 2026-05-10  
**维护者**: Lingma AI Assistant
