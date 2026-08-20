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

    if (msg.text === '测试播放文字') {
      await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！').catch(() => {});
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 启动硬件级静音抢占模式...`);
      
      // 🚨 核心技巧 1：瞬间静音！(siid: 2 扬声器, piid: 2 静音属性)
      // 在云端下发本地 TTS 之前，从硬件层面切断声音输出。
      // 此时音箱 UI 依然会正常显示“眼睛闪烁”的思考状态，体验极佳。
      engine.MiOT.setProperty(2, 2, true).catch(() => {});
      
      // 🚨 核心技巧 2：非阻塞后台请求大模型
      const aiTask = (async () => {
        try {
          // 在后台安静地请求大模型 (耗时 2-4 秒)
          const { text: aiText } = await engine.askAI(msg);
          console.log(`🔊 [AI 生成回复]: ${aiText}`);
          
          // 🚨 核心技巧 3：取消静音
          await engine.MiOT.setProperty(2, 2, false).catch(() => {});
          
          // 稍微延迟 200ms，确保硬件静音状态已完全解除，避免截断第一个字
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 🚨 核心技巧 4：播放 AI 结果
          await engine.MiOT.doAction(5, 3, aiText);
          console.log("✅ AI 语音播放指令已发送");
          
        } catch (error) {
          console.error("❌ [AI 处理失败]:", error.message);
          // ⚠️ 安全机制：如果 AI 请求失败，必须取消静音，防止音箱变成“哑巴”
          await engine.MiOT.setProperty(2, 2, false).catch(() => {});
        }
      })();
      
      // 🚨 核心技巧 5：瞬间返回，接管消息
      return { handled: true }; 
    }
  },
};
