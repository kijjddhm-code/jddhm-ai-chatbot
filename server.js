import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

if (!API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY is missing from .env");
  process.exit(1);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    provider: "OpenRouter",
    model: MODEL
  });
});

/* =========================
   CHAT
========================= */

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "No message provided."
      });
    }

    const cleanMessages = messages
      .filter((message) => message && message.content)
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",
        content: String(message.content)
      }));

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        error: "No valid message provided."
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "JDDHM Product of AI"
        },

        body: JSON.stringify({
          model: MODEL,
          messages: cleanMessages,
          temperature: 0.7,
          max_tokens: 2000
        })
      }
    );

    const data = await response.json();

    console.log("OpenRouter status:", response.status);

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      if (response.status === 429) {
        return res.status(429).json({
          error:
            "The free AI limit has been reached. Please wait and try again later."
        });
      }

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenRouter request failed."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "The AI returned an empty response."
      });
    }

    return res.json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error:
        "Unable to contact the AI service. Please try again."
    });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log(" JDDHM Product of AI");
  console.log(" AI Chatbot");
  console.log("=================================");
  console.log(`Provider: OpenRouter`);
  console.log(`Model: ${MODEL}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log("=================================");
  console.log("");
});
