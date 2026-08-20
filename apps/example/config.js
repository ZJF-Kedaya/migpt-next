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
    // 🚨 核心修改：让大模型自己在回复开头加上过渡语，化零为整
    system: '你是一个智能助手。在回答任何问题之前，请先简短地说一句“请稍等，我正在思考”，然后换行给出你的正式回答。',
  },
  context: {
    historyMaxLength: 10,
  },
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试', '为什么', '是什么', '多少'],
  
  async onMessage(engine, msg) {
    console.log(`🎤 [收到语音]: "${msg.text}"`);

    if (msg.text === '测试播放文字') {
      await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！').catch(() => {});
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 1. 尽人事：瞬间发送双重打断指令，试图压制本地语音（能压制多少是多少）
        engine.speaker.abortXiaoAI().catch(() => {});
        engine.MiOT.doAction(3, 4).catch(() => {}); // stop

        // 2. 等待大模型返回完整结果（包含“请稍等...”和正式答案）
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 完整回复]: ${aiText}`);
        
        // 3. 🚨 核心技巧：只发送一次 TTS 指令！
        // 因为这是一个完整的长句，一旦下发，优先级极高，会流畅地完整播放，
        // 完美掩盖之前可能存在的半句本地语音，且不会出现奇怪的停顿。
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
