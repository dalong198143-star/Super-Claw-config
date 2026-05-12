# Claude Code Router 启动脚本
# 三层模型架构：Flash → Pro → Sonnet

Write-Host "🚀 启动 Claude Code Router..." -ForegroundColor Cyan
Write-Host "📊 当前路由策略：" -ForegroundColor Yellow
Write-Host "   第一层: DeepSeek-V4-Flash (默认、后台任务)"
Write-Host "   第二层: DeepSeek-V4-Pro (思考模式)"
Write-Host "   第三层: Claude-Sonnet-4.7 (长上下文、多模态)"
Write-Host ""

# 设置环境变量
$env:ANTHROPIC_BASE_URL="http://localhost:3000"
$env:ANTHROPIC_AUTH_TOKEN="router-key"
$env:ANTHROPIC_MODEL="auto"

# 启动 Router
Write-Host "🔧 启动 Router 服务..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "ccr" -ArgumentList "serve"

# 等待服务启动
Start-Sleep -Seconds 2

# 启动 Claude Code
Write-Host "💻 启动 Claude Code..." -ForegroundColor Green
cd "d:\maozhua\xuexi编程基础"
. ".\node_modules\.bin\claude.ps1"