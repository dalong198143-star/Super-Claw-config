@echo off
REM Windows 快速启动脚本

echo ====================================
echo AI协作技能学习变现平台 - 快速启动
echo ====================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 20.x
    pause
    exit /b 1
)

echo [1/4] 检查依赖...
if not exist "node_modules" (
    echo 安装根目录依赖...
    call npm install
)

if not exist "client\node_modules" (
    echo 安装客户端依赖...
    cd client && call npm install && cd ..
)

if not exist "server\node_modules" (
    echo 安装服务器端依赖...
    cd server && call npm install && cd ..
)

echo.
echo [2/4] 检查环境变量配置...
if not exist ".env" (
    echo [提示] 未找到 .env 文件，从 .env.example 复制模板...
    copy .env.example .env
    echo [警告] 请编辑 .env 文件配置必要的环境变量
    pause
)

echo.
echo [3/4] 启动服务...
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 使用 concurrently 同时启动前后端
call npm run dev

pause
