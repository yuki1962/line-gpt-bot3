const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ⚠️ ここに正しいキーを直書き
const CHANNEL_ACCESS_TOKEN = "【8dNa3mH0AH6kpD+s65abQ+W9hQYO0yG63oTqml6abKvxNDEyTea0/a1DW36udgbfU2wn3A2QT2Hz56tOARTlNCzvYZMbLs78CKC3qaNXpZLvvfJpgnPeNC6tKPsJ2Oe3KT0np/zz2FzqiBiejaCprgdB04t89/1O/w1cDnyilFU=】";
const GROQ_API_KEY = "【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】";

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];
  if (event?.message?.type === "text") {
    try {
      const userText = event.message.text;

      // Groq API にリクエスト
      const groqResp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: userText },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const replyText = groqResp.data.choices?.[0]?.message?.content ?? "返答がありません";

      // LINEに返信
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }],
        },
        {
          headers: {
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("エラー:", error.response?.data || error.message);
    }
  }
  res.sendStatus(200);
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
