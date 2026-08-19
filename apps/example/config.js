/**
 * @type {import('@mi-gpt/next').MiGPTConfig}
 */
export default {
  debug: false, // ⚠️ 设为 false，屏蔽冗长的底层设备列表日志
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
  // 扩大关键词范围，确保日常提问也能触发 AI
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试', '为什么', '是什么', '多少'],
  
  async onMessage(engine, msg) {
    // 1. 无论是否处理，先打印日志，让你明确知道程序听到了你说话
    console.log(`🎤 [收到语音] : "${msg.text}"`);

    // 2. 检查是否命中 AI 关键词
    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 尝试打断小爱原有的回复 (失败也不影响后续流程)
        await engine.speaker.abortXiaoAI().catch(() => {});
        
        // 获取 AI 回复
        const aiResponse = await engine.askAI(msg);
        console.log(`🔊 [准备播报] : ${aiResponse.text}`);
        
        // 强制播放文字 (针对 Play 增强版的兼容写法)
        await engine.speaker.play({ text: aiResponse.text });
        
        // 告诉引擎：这条消息我已处理，不要让小爱再重复回答
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理异常]:", error.message);
        return { handled: true };
      }
    }
    
    // 如果没有命中关键词（比如“打开空调”），不拦截，让小爱自己处理
  },
};
