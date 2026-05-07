#!/bin/bash
# Linux/Mac 快速启动脚本

set -e

echo "===================================="
echo "AI协作技能学习变现平台 - 快速启动"
echo "===================================="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js >= 20.x"
    exit 1
fi

echo "[1/4] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装根目录依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "安装客户端依赖..."
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "安装服务器端依赖..."
    cd server && npm install && cd ..
fi

echo ""
echo "[2/4] 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "[提示] 未找到 .env 文件，从 .env.example 复制模板..."
    cp .env.example .env
    echo "[警告] 请编辑 .env 文件配置必要的环境变量"
    read -p "按回车键继续..."
fi

echo ""
echo "[3/4] 启动服务..."
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 使用 concurrently 同时启动前后端
npm run dev
