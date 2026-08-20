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
      console.log(`🤖 [触发 AI] 启动非阻塞抢占模式...`);
      
      //  核心技巧 1：火后即忘 (Fire-and-Forget)
      // 不等待结果，瞬间发出停止和“请稍等”指令，试图抢占播放队列
      engine.speaker.abortXiaoAI().catch(() => {});
      engine.MiOT.doAction(5, 3, "请稍等，我正在思考").catch(() => {});
      
      // 🚨 核心技巧 2：非阻塞后台处理
      // 立即启动一个异步任务去请求大模型，不阻塞 onMessage 的返回
      const aiTask = (async () => {
        try {
          // 在后台安静地请求大模型 (耗时 2-4 秒)
          const { text: aiText } = await engine.askAI(msg);
          console.log(`🔊 [AI 生成回复]: ${aiText}`);
          
          // 🚨 核心技巧 3：延迟播放，避免队列冲突
          // 等待“请稍等”播放完毕 (约 1.5 秒)，再发送 AI 结果，确保两者不互相覆盖
          await new Promise(resolve => setTimeout(resolve, 1500));
          await engine.MiOT.doAction(5, 3, aiText);
          console.log("✅ AI 语音播放指令已发送");
        } catch (error) {
          console.error("❌ [AI 处理失败]:", error.message);
        }
      })();
      
      // 🚨 核心技巧 4：瞬间返回
      // 立刻告诉 MiGPT 引擎这条消息已接管，防止引擎进行默认处理
      return { handled: true }; 
    }
  },
};
