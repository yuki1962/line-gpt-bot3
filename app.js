const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const CHANNEL_ACCESS_TOKEN = "8dNa3mH0AH6kpD+s65abQ+W9hQYO0yG63oTqml6abKvxNDEyTea0/a1DW36udgbfU2wn3A2QT2Hz56tOARTlNCzvYZMbLs78CKC3qaNXpZLvvfJpgnPeNC6tKPsJ2Oe3KT0np/zz2FzqiBiejaCprgdB04t89/1O/w1cDnyilFU=";
const GROQ_API_KEY = "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";
const GOOGLE_API_KEY = "AIzaSyBJgKKLED1rKwz9IVTANGSBCaybot8pcFM";
const GOOGLE_CX = process.env.GOOGLE_CX; // d4d24333808e44e57

// Google検索
async function googleSearch(query) {
  const response = await axios.get(
    "https://www.googleapis.com/customsearch/v1",
    {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
      },
    }
  );
  const results = response.data.items?.slice(0, 3).map((item, index) => {
    return `${index + 1}. ${item.title}\n${item.link}`;
  }).join("\n\n") || "検索結果がありません。";
  return results;
}

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];
  if (event?.message?.type === "text") {
    try {
      const userText = event.message.text;

      // 1. Google検索
      const googleResults = await googleSearch(userText);

      // 2. Groq API にリクエスト
      const groqResp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "あなたは親切なAIアシスタントです。ユーザーには日本語で回答してください。",
            },
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

      // 3. Google結果＋AI返答をLINEに送信
      const finalReply = `🌐 **Google検索結果**\n${googleResults}\n\n🤖 **AIの回答**\n${replyText}`;

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: finalReply }],
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

