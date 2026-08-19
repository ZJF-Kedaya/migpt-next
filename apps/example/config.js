/**
 * @type {import('@mi-gpt/next').MiGPTConfig}
 */
export default {
  debug: false,
  speaker: {
    did: process.env.MI_DID || '小爱音箱Play增强版',
    userId: process.env.MI_USER_ID,
    password: process.env.MI_PASSWORD,
    passToken: process.env.MI_PASSTOKEN,
  },
  openai: {
    baseURL: process.env.OPENAI_BASE_URL || "https://token.sensenova.cn/v1",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "deepseek-v4-flash",
  },
  prompt: {
    system: '你是一个智能助手，请根据用户的问题给出回答。',
  },
  context: {
    historyMaxLength: 10,
  },
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试', '为什么', '是什么', '多少'],
  
  async onMessage(engine, msg) {
    console.log(`🎤 [收到语音]: "${msg.text}"`);

    // 1. 专属测试指令：用于验证 L05C 的 MIoT TTS 通道是否彻底打通
    if (msg.text === '测试播放文字') {
      console.log("🔊 [测试 TTS] 尝试使用 MIoT 底层指令播放...");
      try {
        // L05C 正确的 TTS 指令: SIID 5, AIID 3 (play-text)
        await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！');
        console.log("✅ TTS 指令发送成功");
      } catch (e) {
        console.error("❌ TTS 指令失败:", e.message);
      }
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 2. 【第一次底层打断】立即强制停止当前播放 (SIID 3, AIID 4: stop)，掐断小爱的初始反应
        await engine.MiOT.doAction(3, 4).catch(() => {});
        
        // 3. 请求大模型 (这里会有 2-4 秒的网络延迟)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 4. 【第二次底层打断】防止在等待 AI 期间，小爱开始了兜底回复
        await engine.MiOT.doAction(3, 4).catch(() => {});
        
        // 5. 【核心修复】使用 L05C 专属的 TTS 指令播放 AI 文本 (SIID 5, AIID 3: play-text)
        await engine.MiOT.doAction(5, 3, aiText);
        console.log("✅ AI 语音播放指令已发送");
        
        // 6. 标记为已处理，阻止后续默认流程
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理失败]:", error.message);
        return { handled: true };
      }
    }
  },
};
