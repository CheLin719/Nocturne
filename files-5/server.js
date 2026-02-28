/* ╔══════════════════════════════════════════════════════════════════╗
   ║                        server.js                                 ║
   ║   Nocturne 后端 — Node.js + Express + Gemini API                 ║
   ║                                                                  ║
   ║   ⚠ API Key 放在 .env 文件里，不要提交到 GitHub！               ║
   ╚══════════════════════════════════════════════════════════════════╝ */

require('dotenv').config();   // 读取 .env 文件
const express = require('express');
const cors    = require('cors');
const fetch   = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── 中间件 ── */
app.use(cors());              // 允许前端跨域请求
app.use(express.json());      // 解析 JSON 请求体
app.use(express.static('.'));  // 直接把当前目录作为静态文件服务（可选）

/* ══════════════════════════════════════════════════════════════════
   对话历史存储（内存，重启服务器会清空）
   key 格式：worldId_charIdx（由前端传来）
   ══════════════════════════════════════════════════════════════════ */
const conversationHistory = {};

/* ── 历史长度限制：最多保留最近 N 轮对话（1轮 = 用户+模型各一条） ── */
const MAX_HISTORY_TURNS = 15;

/* ══════════════════════════════════════════════════════════════════
   POST /api/chat
   前端发来：{ message, history, systemPrompt, charName, worldId }
   返回：    { reply } 或 { error }
   ══════════════════════════════════════════════════════════════════ */
app.post('/api/chat', async (req, res) => {
  const { message, systemPrompt, charName, worldId } = req.body;

  /* 基本校验 */
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: '请提供 message 字段' });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: '服务器未配置 GEMINI_API_KEY，请检查 .env 文件' });
  }

  /* 初始化/获取该角色的历史 */
  const histKey = worldId || 'default';
  if (!conversationHistory[histKey]) {
    conversationHistory[histKey] = [];
  }
  const history = conversationHistory[histKey];

  /* 把新消息加入历史 */
  history.push({ role: 'user', parts: [{ text: message }] });

  /* 限制历史长度（超出时删最旧的一对） */
  while (history.length > MAX_HISTORY_TURNS * 2) {
    history.splice(0, 2); // 删最旧的一轮（user + model）
  }

  /* ── 构建发给 Gemini 的请求体 ── */
  const requestBody = {
    // system_instruction 是 Gemini 的 system prompt 字段
    system_instruction: {
      parts: [{
        text: systemPrompt ||
          `你是一个角色扮演助手，角色名为「${charName || '未知角色'}」。请完全入戏，保持角色性格回复。`
      }]
    },
    contents: history,   // 完整对话历史（含本次新消息）
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.85,
    }
  };

  /* ── 调用 Gemini REST API ── */
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

  try {
    const geminiRes = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody),
    });

    const geminiData = await geminiRes.json();

    /* 解析 Gemini 回复 */
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error('Gemini 未返回有效内容：', JSON.stringify(geminiData, null, 2));
      return res.status(500).json({
        error: geminiData?.error?.message || 'Gemini 未返回有效内容'
      });
    }

    /* 把模型回复也存入历史 */
    history.push({ role: 'model', parts: [{ text: reply }] });

    /* 返回给前端 */
    res.json({ reply });

  } catch (err) {
    console.error('请求 Gemini 时出错：', err);
    res.status(500).json({ error: `服务器错误：${err.message}` });
  }
});

/* ══════════════════════════════════════════════════════════════════
   POST /api/reset  — 清空某个角色的对话历史（可选）
   前端发来：{ worldId }
   ══════════════════════════════════════════════════════════════════ */
app.post('/api/reset', (req, res) => {
  const { worldId } = req.body;
  if (worldId && conversationHistory[worldId]) {
    conversationHistory[worldId] = [];
  }
  res.json({ ok: true });
});

/* ── 启动服务器 ── */
app.listen(PORT, () => {
  console.log(`✅ Nocturne 后端已启动：http://localhost:${PORT}`);
  console.log(`   Gemini 模型：${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}`);
  console.log(`   最大对话轮数：${MAX_HISTORY_TURNS}`);
});
