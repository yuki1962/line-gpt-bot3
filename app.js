const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const CHANNEL_ACCESS_TOKEN = process.yV1CMSbVCjmMWVOPVOZ+k+SbBqenFQGUjDgmRQVFNAFwFj54eAx7Z/hC0ALksPwAU2wn3A2QT2Hz56tOARTlNCzvYZMbLs78CKC3qaNXpZJDP2KPyy0w/IIuysOf5m0vYY5m2Nge1yYZssOlLZo3IAdB04t89/1O/w1cDnyilFU=
;
const GROQ_API_KEY = process.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;

app.post("/webhook", async (req, res) => {
  const event = req.body.events[0];
  if (event?.message?.type === "text") {
    const userText = event.message.text;

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

    const replyText = groqResp.data.choices[0].message.content;

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
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
