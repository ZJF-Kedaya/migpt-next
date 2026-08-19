import { MiGPT } from '@mi-gpt/next';
import config from './config.js';
import http from 'http';

// 1. 骗过 Koyeb 的健康检查
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MiGPT is running normally');
}).listen(8000);

console.log("🟢 [Step 1] HTTP 服务已启动，准备初始化 MiGPT...");
console.log("🟢 [Debug] 当前配置的 DID 是:", process.env.MI_DID || "未设置");

async function main() {
  try {
    console.log("🟢 [Step 2] 正在调用 MiGPT.start()，正在连接小米服务器 (这可能需要 10-30 秒)...");
    
    await MiGPT.start(config);
    
    console.log("🟢 [Step 3] MiGPT.start() 执行完毕！正在后台监听音箱...");
  } catch (error) {
    console.error("🔴 [致命错误] MiGPT 启动失败:", error);
    process.exit(1);
  }
}

main();
