# 📋 App.jsx 组件拆分计划

## 当前状态
- **文件**: `client/src/App.jsx`
- **重构前行数**: 2078行
- **重构后行数**: 1094行（减少约47%）
- **状态**: ✅ 重构完成

## 拆分策略

### 1. 核心业务组件 (按功能模块)

#### 1.1 TaskList 组件
**文件**: `client/src/components/TaskList.jsx`
**职责**: 
- 任务列表展示
- 搜索和筛选功能
- 任务排序

**从 App.jsx 提取**:
- 状态: `tasks`, `searchQuery`, `filterDifficulty`, `sortBy`
- 函数: 任务加载、搜索、筛选逻辑
- UI: 任务列表渲染部分

---

#### 1.2 TaskDetail 组件
**文件**: `client/src/components/TaskDetail.jsx`
**职责**:
- 单个任务详情展示
- 任务提交表单

**从 App.jsx 提取**:
- 状态: `selectedTask`, `submitSuccess`
- 函数: 任务提交逻辑
- UI: 任务详情和提交表单

---

#### 1.3 AIAgent 组件
**文件**: `client/src/components/AIAgent.jsx`
**职责**:
- AI 模式切换
- AI 对话界面
- 模型选择

**从 App.jsx 提取**:
- 状态: `aiMode`, `aiMessage`, `aiResponse`, `loading`, `selectedModel`, `availableModels`
- 函数: AI 交互逻辑
- UI: AI 聊天界面

---

### 2. 创作工具组件 (按工具类型)

#### 2.1 TextToImage 组件
**文件**: `client/src/components/tools/TextToImage.jsx`
**职责**: 文生图功能

**从 App.jsx 提取**:
- 状态: `imagePrompt`, `selectedStyle`, `imageStyles`, `generatedImage`, `imageGenerating`
- 函数: 图像生成逻辑
- UI: 文生图界面

---

#### 2.2 ImageToVideo 组件
**文件**: `client/src/components/tools/ImageToVideo.jsx`
**职责**: 图生视频功能

**从 App.jsx 提取**:
- 状态: `uploadedImage`, `generatedVideo`, `videoGenerating`, `videoResolution`, `videoAspectRatio`, `lockOriginalRatio`, `videoFitMode`, `originalImageSize`
- 函数: 视频生成逻辑
- UI: 图生视频界面

---

#### 2.3 MotionTransfer 组件
**文件**: `client/src/components/tools/MotionTransfer.jsx`
**职责**: 动作迁移功能

**从 App.jsx 提取**:
- 状态: `motionSourceFile`, `motionSourcePreview`, `motionTargetFile`, `motionTargetPreview`, `motionGenerating`, `motionProgress`, `motionMode`, `motionWidth`, `motionHeight`, `motionFps`, `motionQuality`, `generatedMotion`
- 函数: 动作迁移逻辑
- UI: 动作迁移界面

---

#### 2.4 OutfitChange 组件
**文件**: `client/src/components/tools/OutfitChange.jsx`
**职责**: 换装功能

**从 App.jsx 提取**:
- 状态: `outfitPersonFile`, `outfitPersonPreview`, `outfitClothFile`, `outfitClothPreview`, `outfitGenerating`, `outfitProgress`, `outfitEdgeSmooth`, `outfitBlend`, `generatedOutfit`
- 函数: 换装逻辑
- UI: 换装界面

---

#### 2.5 ImageUpscale 组件
**文件**: `client/src/components/tools/ImageUpscale.jsx`
**职责**: 图像超分辨率/重绘功能

**从 App.jsx 提取**:
- 状态: `upscaleFile`, `upscalePreview`, `upscaleGenerating`, `upscaleProgress`, `upscaleMode`, `upscaleScale`, `upscaleStyle`, `generatedUpscale`
- 函数: 图像增强逻辑
- UI: 图像增强界面

---

#### 2.6 VideoJoiner 组件
**文件**: `client/src/components/tools/VideoJoiner.jsx`
**职责**: 视频拼接功能

**从 App.jsx 提取**:
- 状态: `videoClips`, `videoJoinGenerating`, `videoJoinProgress`, `generatedVideoJoin`
- 函数: 视频拼接逻辑
- UI: 视频拼接界面

---

### 3. 工作流系统组件

#### 3.1 WorkflowManager 组件
**文件**: `client/src/components/workflow/WorkflowManager.jsx`
**职责**: 工作流整体管理

**从 App.jsx 提取**:
- 状态: `useFullWorkflowMode`, `workflowSteps`, `workflowCurrentStep`
- 函数: 工作流启动、重置、验证
- UI: 工作流容器和导航

---

#### 3.2 WorkflowStep 组件
**文件**: `client/src/components/workflow/WorkflowStep.jsx`
**职责**: 单个工作流步骤展示

**从 App.jsx 提取**:
- Props: step 数据、检查状态、审核状态
- UI: 步骤卡片、进度指示器

---

#### 3.3 WorkflowCheckPanel 组件
**文件**: `client/src/components/workflow/WorkflowCheckPanel.jsx`
**职责**: 自动检查结果展示

**从 App.jsx 提取**:
- Props: 检查结果数据
- UI: 检查项列表、通过/失败状态

---

#### 3.4 WorkflowApproval 组件
**文件**: `client/src/components/workflow/WorkflowApproval.jsx`
**职责**: 人工审核面板

**从 App.jsx 提取**:
- Props: 审核状态、批准/拒绝回调
- UI: 审核按钮、意见输入

---

### 4. 共享组件

#### 4.1 ToolSelector 组件
**文件**: `client/src/components/shared/ToolSelector.jsx`
**职责**: 工具选择器

**从 App.jsx 提取**:
- 状态: `selectedTool`
- UI: 8个工具的图标和名称

---

#### 4.2 UserProfile 组件
**文件**: `client/src/components/shared/UserProfile.jsx`
**职责**: 用户信息展示

**从 App.jsx 提取**:
- 状态: `user`
- UI: 用户头像、余额显示

---

## 实施步骤

### Phase 1: 创建目录结构
```bash
mkdir -p client/src/components/{tools,workflow,shared}
```

### Phase 2: 逐个提取组件（优先级从高到低）
1. ✅ 创建基础组件骨架
2. ✅ 提取 UserProfile 组件（最简单）
3. ✅ 提取 ToolSelector 组件
4. ✅ 提取 TaskList 组件（含 TaskCard）
5. ✅ 提取 AIAgent 组件（命名为 AIAssistant）
6. ✅ 提取 Header 组件（新增）
7. ✅ 提取 SubmitForm 组件（新增）
8. ✅ 提取各个工具组件（6个）
   - TextToImageTool ✅
   - ImageToVideoTool ✅
   - MotionTransferTool ✅
   - OutfitTool ✅
   - UpscaleTool ✅
   - VideoJoinTool ✅
9. ✅ 提取工作流组件（1个核心）
   - WorkflowSteps ✅

### Phase 3: 重构 App.jsx ✅ 完成
- ✅ 移除已提取的状态和函数
- ✅ 导入并使用新组件（14个）
- ✅ 保留全局状态管理

### Phase 4: 测试验证
- ✅ 确保所有功能正常工作（构建成功）
- 🔲 运行单元测试（待完善）
- ✅ 手动测试各组件交互

## 预期收益

✅ **代码可维护性**: 每个组件 < 300行  
✅ **可测试性**: 可以单独测试每个组件  
✅ **复用性**: 组件可在其他地方复用  
✅ **团队协作**: 多人可同时开发不同组件  
✅ **性能优化**: 可以针对单个组件进行优化  

## 预计工作量

- **Phase 1-2**: 2-3天
- **Phase 3**: 1天
- **Phase 4**: 1天
- **总计**: 4-5天

---

**创建日期**: 2026-05-05  
**状态**: 计划阶段
