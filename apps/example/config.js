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

    // 1. 优先处理硬编码测试，用于验证 TTS 通道是否畅通
    if (msg.text === '测试播放文字') {
      console.log("🔊 [测试 TTS] 尝试播放固定文本...");
      await engine.speaker.play({ text: '你好，很高兴认识你！' }).catch(() => {});
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 2. 【第一次打断】在请求大模型前，立即尝试掐断小爱的初始反应
        await engine.speaker.abortXiaoAI().catch(() => {});
        
        // 3. 请求大模型 (这里会有 2-4 秒的延迟)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 4. 【第二次打断】在拿到 AI 结果后、播放前，再次尝试打断 (防止小爱在这几秒内开始播放兜底回复)
        await engine.speaker.abortXiaoAI().catch(() => {});
        
        // 5. 【双通道播放】优先使用封装好的 play 方法，如果失败则降级使用底层 MiOT 指令
        try {
          await engine.speaker.play({ text: aiText });
        } catch (playError) {
          console.log("⚠️ speaker.play 失败，尝试 MiOT.doAction 兜底...");
          // siid: 5 (TextToSpeech), aiid: 1 (Play)
          await engine.MiOT.doAction(5, 1, aiText);
        }
        
        // 6. 标记为已处理，阻止后续默认流程
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理失败]:", error.message);
        return { handled: true };
      }
    }
  },
};
