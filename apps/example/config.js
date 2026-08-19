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

    // 专属测试指令
    if (msg.text === '测试播放文字') {
      await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！').catch(() => {});
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型 (小爱可能会先抢答半句，这是正常现象)...`);
      try {
        // 1. 直接请求大模型 (不再发送任何无效的 stop 指令，防止搞坏音频通道)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 2. 直接播放 AI 结果 (小爱先说的“不知道”正好充当了缓冲，掩盖了这几秒的延迟)
        await engine.MiOT.doAction(5, 3, aiText);
        console.log("✅ AI 语音播放指令已发送");
        
        return { handled: true };
        
      } catch (error) {
        console.error(" [AI 处理失败]:", error.message);
        return { handled: true };
      }
    }
  },
};
