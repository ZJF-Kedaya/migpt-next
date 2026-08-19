FROM node:18-alpine

WORKDIR /app

# 1. 仅复制 example 应用的 package 文件
COPY apps/example/package.json apps/example/package-lock.json* ./

# 2. 安装生产环境依赖 (使用 npm install 容错率更高，自动处理 lock 文件)
RUN npm install --omit=dev

# 3. 仅复制运行所需的核心源码
COPY apps/example/app.js apps/example/config.js ./

# 4. 启动应用
CMD ["node", "app.js"]
