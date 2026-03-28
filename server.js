// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables from .env locally (do NOT push .env to Git)
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// ✅ Middlewares
app.use(cors({ origin: "*" })); // Allow all origins for global access
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST endpoint for chat
app.post("/chat", async (req, res) => {
  try {
    const message = req.body?.message || req.body?.user_input;
    const topic = req.body?.topic || "general";
    const language = req.body?.language || "en";

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required in body" });
    }

    console.log("📝 User:", message, "| Topic:", topic, "| Lang:", language);

    // 🔥 Language + Topic aware prompt
    let systemPrompt = "";

    if (language === "ur") {
      systemPrompt = `
تم ایک انگریزی بولنے والے پارٹنر ہو۔ لیکن ہمیشہ جوابات اردو میں دو تاکہ یوزر کو سمجھ آئے۔
یوزر نے یہ موضوع منتخب کیا ہے: "${topic}"۔
⚠️ قاعدہ: 
- صرف اسی موضوع پر بات کرو۔
- اگر یوزر کا سوال منتخب موضوع سے ہٹ کر ہے تو جواب میں کہو:
  "یہ سوال موجودہ موضوع (${topic}) سے متعلق نہیں ہے، براہ کرم صرف اسی موضوع پر بات کریں۔"
- غیر متعلقہ سوالات پر کوئی اور جواب مت دو۔
      `;
    } else {
      systemPrompt = `
You are an English speaking partner. Reply in clear and simple English.
The user has selected this topic: "${topic}".
⚠️ Rule:
- Only talk about this topic.
- If the user asks something unrelated, respond with:
  "This question is not related to the selected topic (${topic}). Please stay on topic."
- Do not answer irrelevant questions.
      `;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let aiReply = "Sorry, could not generate a response.";

    try {
      const result = await model.generateContent(`${systemPrompt}\nUser: ${message}`);
      if (result?.response?.text) {
        aiReply = result.response.text();
      }
    } catch (gemError) {
      console.error("Gemini API Error:", gemError);
      aiReply = "Gemini API error occurred.";
    }

    res.json({ reply: aiReply, topic, language });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Gemini API Backend is Running!");
});


// 🔹 Listen on dynamic port (works locally and on hosted servers)
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 Use this URL from Postman or mobile app after deployment.`);
});
