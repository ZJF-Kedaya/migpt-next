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
  // 保持关键词触发
  callAIKeywords: ['请', '你', '搜', '查', '帮', '测试', '为什么', '是什么', '多少'],
  
  async onMessage(engine, msg) {
    console.log(`🎤 [收到语音]: "${msg.text}"`);

    if (msg.text === '测试播放文字') {
      await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！').catch(() => {});
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 启动极限打断模式...`);
      try {
        // 🚨 【极限并发打断】不等待结果，以最快速度同时发送所有停止指令，试图清空播放队列
        engine.MiOT.doAction(3, 4).catch(() => {}); // stop (停止播放)
        engine.MiOT.doAction(3, 3).catch(() => {}); // pause (暂停)
        engine.speaker.abortXiaoAI().catch(() => {}); // 官方中断接口
        
        // 延迟 150ms，给上述指令一点网络传输时间，然后再次发送 stop 确保队列被清空
        await new Promise(resolve => setTimeout(resolve, 150));
        await engine.MiOT.doAction(3, 4).catch(() => {});

        // 🚨 【立即抢占通道】队列清空后，立刻下发“请稍等”，此时它应该能排在最前面
        console.log("⏳ [抢占通道] 播放请稍候提示...");
        await engine.MiOT.doAction(5, 3, "请稍等，我正在思考");
        
        // 请求大模型 (此时音箱正在说“请稍等”，掩盖延迟)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 播放最终结果
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
