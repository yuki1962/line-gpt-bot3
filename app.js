const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Renderの環境変数から取得
const CHANNEL_ACCESS_TOKEN = "8dNa3mH0AH6kpD+s65abQ+W9hQYO0yG63oTqml6abKvxNDEyTea0/a1DW36udgbfU2wn3A2QT2Hz56tOARTlNCzvYZMbLs78CKC3qaNXpZLvvfJpgnPeNC6tKPsJ2Oe3KT0np/zz2FzqiBiejaCprgdB04t89/1O/w1cDnyilFU=";
const GROQ_API_KEY = "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";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];
  if (event?.message?.type === "text") {
    try {
      const userText = event.message.text;

      // Google検索
      const googleResp = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: GOOGLE_API_KEY,
            cx: GOOGLE_CX,
            q: userText,
          },
        }
      );

      const googleResults = googleResp.data.items
        ?.slice(0, 3)
        .map((item, idx) => `${idx + 1}. ${item.title}\n${item.link}`)
        .join("\n\n") || "検索結果は見つかりませんでした。";

      // Groq API
      const groqResp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "あなたは日本語で答えるAIです。" },
            { role: "user", content: userText },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const aiReply =
        groqResp.data.choices?.[0]?.message?.content ?? "AIの返答なし";

      // LINEに送信
      const reply = `🌐Google検索結果:\n${googleResults}\n\n🤖AI:\n${aiReply}`;
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: reply }],
        },
        {
          headers: {
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("エラー:", err.response?.data || err.message);
    }
  }
  res.sendStatus(200);
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


