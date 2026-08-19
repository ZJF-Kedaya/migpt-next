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

    // 1. 专属测试指令
    if (msg.text === '测试播放文字') {
      console.log("🔊 [测试 TTS] 尝试使用 MIoT 底层指令播放...");
      try {
        await engine.MiOT.doAction(5, 3, '你好，大模型测试成功！');
        console.log("✅ TTS 指令发送成功");
      } catch (e) {
        console.error("❌ TTS 指令失败:", e.message);
      }
      return { handled: true };
    }

    const shouldAskAI = engine.config.callAIKeywords.some((keyword) => msg.text.startsWith(keyword));
    
    if (shouldAskAI) {
      console.log(`🤖 [触发 AI] 正在请求大模型...`);
      try {
        // 2. 【立刻打断】强制停止当前任何播放，防止小爱抢答兜底回复 (SIID 3, AIID 4: stop)
        await engine.MiOT.doAction(3, 4).catch(() => {});
        
        // 3. 【抢占通道 + 体验优化】立刻播放“请稍等”，掩盖大模型延迟，并彻底占用音频通道
        console.log("⏳ [抢占通道] 播放请稍候提示...");
        await engine.MiOT.doAction(5, 3, "请稍等，我正在思考");
        
        // 4. 请求大模型 (此时音箱正在说“请稍等”，用户不会觉得卡顿，小爱也不会抢答)
        const { text: aiText } = await engine.askAI(msg);
        console.log(`🔊 [AI 生成回复]: ${aiText}`);
        
        // 5. 【播放最终结果】直接衔接播放 AI 的回复
        await engine.MiOT.doAction(5, 3, aiText);
        console.log("✅ AI 语音播放指令已发送");
        
        // 6. 标记为已处理，阻止后续默认流程
        return { handled: true };
        
      } catch (error) {
        console.error("❌ [AI 处理失败]:", error.message);
        return { handled: true };
      }
    }
  },
};
