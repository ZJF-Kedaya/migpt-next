FROM node:18-alpine

# 1. 设置工作目录
WORKDIR /app

# 2. 安装 git (防止某些 npm 包的 postinstall 脚本报错)
RUN apk add --no-cache git

# 3. 全局安装 pnpm
RUN npm install -g pnpm

# 4. 仅复制 example 应用的 package.json (避免安装根目录庞大的开发依赖)
COPY apps/example/package.json ./

# 5. 安装生产环境依赖 (只会安装 @mi-gpt/next 及其必要依赖)
RUN pnpm install --prod

# 6. 复制 example 应用的源代码 (包含 app.js 和 config.js)
COPY apps/example/ ./

# 7. 启动应用
CMD ["node", "app.js"]
