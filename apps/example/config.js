/**
 * @type {import('@mi-gpt/next').MiGPTConfig}
 */
export default {
  debug: false, // 保持 false，避免冗长无用的底层日志
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
  // 扩大关键词，确保日常提问（如“搜索...”、“为什么...”）都能触发 AI
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试', '为什么', '是什么', '多少'],
  
  /**
   * 核心修复：针对小爱音箱 Play (增强版) 的 TTS 播放问题
   */
  async onMessage(engine, msg) {
    // 1. 无论如何，先打印日志，让你明确看到程序听到了你说话
    console.log(`🎤 [收到语音]: "${msg.text}"`);

    // 2. 检查是否命中 AI 关键词
    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 3. 尝试打断小爱原有的回复 (失败也不影响后续流程)
        await engine.speaker.abortXiaoAI().catch(() => {});
        
        // 4. 调用大模型获取回复
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 5. 【核心修复】针对 Play 增强版，强制使用 MiOT 指令播放 TTS
        // siid: 5 (TextToSpeech服务), aiid: 1 (Play播放动作)
        await engine.MiOT.doAction(5, 1, aiText);
        
        // 6. 告诉 MiGPT 引擎：这条消息我已经手动处理完毕，不要再走默认流程
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理或播放失败]:", error.message);
        // 即使报错也标记为已处理，防止小爱用自己的逻辑重复回答
        return { handled: true };
      }
    }
    
    // 如果没有命中关键词（比如“打开空调”、“明天天气”），不拦截，让小爱自己处理
  },
};
