# 多阶段构建 - 客户端
FROM node:20-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# 服务器端构建
FROM node:20-alpine AS server-build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# 最终镜像
FROM node:20-alpine

WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 复制服务器文件
COPY --from=server-build /app/server ./server
COPY --from=client-build /app/client/dist ./client/dist

# 复制根目录配置
COPY package*.json ./
RUN npm ci --only=production

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
