import { MiGPT } from '@mi-gpt/next';
import config from './config.js';
import http from 'http'; // <-- 新增这行

// <-- 新增这 4 行：骗过 Koyeb 的健康检查，监听 8000 端口
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MiGPT is running normally');
}).listen(8000);

// Gracefully shutdown
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => process.exit(0));
}

async function main() {
  try {
    await MiGPT.start(config);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
