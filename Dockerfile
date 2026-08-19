FROM node:18-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
COPY apps/example/package.json ./apps/example/
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["node", "apps/example/app.js"]
