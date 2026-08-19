# 使用轻量且稳定的 Node 18 镜像
FROM node:18-alpine

WORKDIR /app

# 1. 明确指定从 apps/example 目录复制 package 文件
# (使用 * 号作为通配符，即使没有 lock 文件也不会导致 COPY 步骤报错)
COPY apps/example/package.json apps/example/package-lock.json* ./

# 2. 使用 npm install 代替 npm ci
# (npm install 容错率更高，没有 lock 文件也会自动安装并生成)
RUN npm install --omit=dev

# 3. 明确指定复制运行所需的核心源码
COPY apps/example/app.js apps/example/config.js ./

# 4. 启动应用
CMD ["node", "app.js"]
