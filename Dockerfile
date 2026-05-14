# 多阶段构建 - 客户端
FROM node:22-slim AS client-build

WORKDIR /app/client

COPY client/package.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# 服务器端构建
FROM node:22-slim AS server-build

WORKDIR /app/server

COPY server/package.json ./
RUN npm install --omit=dev

COPY server/ ./

# 最终镜像
FROM node:22-slim

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init curl && rm -rf /var/lib/apt/lists/*

# 复制服务器文件和客户端构建产物
COPY --from=server-build /app/server ./server
COPY --from=client-build /app/client/dist ./client/dist

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
