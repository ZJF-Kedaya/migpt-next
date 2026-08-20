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
      console.log(`🤖 [触发 AI] 正在请求大模型 (本地语音可能会先抢答半句，这是云端API的物理限制)...`);
      try {
        // 1. 直接请求大模型 (不尝试拦截，避免指令冲突导致播放失败)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 2. 延迟 1000ms (1秒) 播放
        // 目的：让本地语音（“这个我还不知道”）先播放完毕，清空音频队列，
        // 确保 AI 的回复不会和本地语音重叠，从而 100% 清晰播放。
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. 播放 AI 结果
        await engine.MiOT.doAction(5, 3, aiText);
        console.log("✅ AI 语音播放指令已发送");
        
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理失败]:", error.message);
        return { handled: true };
      }
    }
  },
};
