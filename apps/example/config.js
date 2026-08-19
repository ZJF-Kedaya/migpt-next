/**
 * @type {import('@mi-gpt/next').MiGPTConfig}
 */
export default {
  debug: true, // ⚠️ 建议先保持 true，方便在日志中查看 AI 回复和报错，稳定后再改为 false
  speaker: {
    /**
     * ⚠️ 强烈建议：这里最好填写真实的 DID（一串纯数字或字母数字组合，如 123456789）。
     * 如果填设备名称能正常工作则保留；若后续出现找不到设备，请去米家 App 设备信息里找真实的 DID 填入，或通过 process.env.MI_DID 传入。
     */
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
  /**
   * 扩展了触发关键词，确保你之前的提问（如“搜索...”）也能命中 AI
   */
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试'],
  
  /**
   * 核心修复：针对小爱音箱 Play (增强版) 的 TTS 播放问题
   */
  async onMessage(engine, msg) {
    // 1. 检查当前消息是否以 AI 关键词开头
    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [拦截并处理] 准备调用大模型: "${msg.text}"`);
      
      try {
        // 2. 尝试打断小爱原有的回复 (关键步骤，防止抢话)
        await engine.speaker.abortXiaoAI();
        
        // 3. 调用大模型获取回复
        const aiResponse = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiResponse.text}`);
        
        // 4. 强制播放文字 (Play 增强版兼容写法)
        await engine.speaker.play({ text: aiResponse.text });
        
        /* 
         * 🚨 备用方案：如果上面那行 play 执行后音箱依然没声音，
         * 请将上面那行注释掉，并取消下面这行的注释。
         * (5, 1 是大部分小爱音箱的 TTS 指令，如果你的设备不同，需去 https://home.miot-spec.com 查询)
         */
        // await engine.MiOT.doAction(5, 1, aiResponse.text);
        
        // 5. 告诉 MiGPT 引擎：这条消息我已经手动处理完毕，不要再走默认流程
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 回复或播放失败]:", error);
        return { handled: true }; // 即使失败也标记为已处理，防止小爱用自己的逻辑重复回答
      }
    }
    
    // 如果不是 AI 关键词（比如“打开空调”、“今天天气”），不拦截，让小爱自己处理
  },
};
