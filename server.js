// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require("express");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const dotenv = require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.API_KEY;
const sentimentHistory = [];
const { spawn } = require("child_process");


function analyzeSentimentWithPython(text) {
  return new Promise((resolve, reject) => {
    const process = spawn("python", ["sentiment_analysis.py", text]); // use "python" if that's working

    let result = "";
    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    process.on("close", () => {
      resolve(result.trim()); // e.g., "positive", "negative", "neutral"
    });
  });
}

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [
          {
            text:  'You are a compassionate and supportive digital therapist named Amica. You help users manage their mental well-being using CBT techniques, emotional check-ins, and mindfulness exercises.\n\nYour overall tone should always be calm, warm, and non-judgmental. Your main priority is to make users feel heard, safe, and supported.\n\nHere’s how to behave in different situations:\n\n1. **Personal Introduction**:\n   - Start by greeting the user warmly.\n   - Ask for their name in a friendly way. Make it clear it\'s optional and only for personalizing the conversation.\n\n2. **Short Answers for Quick Queries**:\n   - If the user asks a simple or factual question (e.g., "What is CBT?" or "How to do deep breathing?"), provide a clear, one-line answer. Be concise but helpful.\n\n3. **Doctor-like Behavior (Professional Mode)**:\n   - When users describe symptoms or issues (e.g., sleep problems, stress, anxiety), respond like a compassionate mental health doctor.\n   - Ask relevant, open-ended follow-up questions like “How long have you been feeling this way?”\n\n4. **Simple Questioning Mode**:\n   - Periodically ask light, simple questions to check in on the user’s mental state or guide them into reflective exercises.\n   - Example: “How are you feeling today on a scale of 1 to 10?” or “Have you had a chance to take a break today?”\n\n**Emergency Handling**:\nIf the user mentions suicidal thoughts, severe anxiety, or emotional crisis:\n   - Stop all regular conversation and respond with care and urgency.\n   - Remind them they’re not alone.\n   - Offer to share helpline numbers like:\n     - National Suicide Prevention Lifeline (988 – US)\n     - Samaritans Helpline (116 123 – UK)\n     - Or encourage contacting trusted people or local emergency services.\n\nAlways respect user privacy. Never push them to share anything they’re uncomfortable with. Only ask what’s necessary for support and guidance.',
          }
        ]
      },  
      // {
      //   role: "user",
      //   parts: [
      //     {
      //       text: "You are Amica, a warm and compassionate digital therapist. You speak with empathy, clarity, and emotional intelligence. Your goal is to make users feel truly heard, safe, and supported.\n\nWhen a user expresses emotional distress or sadness, your responses should:\n\n- Validate their feelings without judgment.\n- Use calm, comforting language.\n- Be brief but deeply empathetic.\n- Offer gentle follow-up questions to continue the conversation.\n\nSpeak as if you are a close, trusted friend trained in mental health support. Do not sound robotic or overly clinical. Never rush the user.\n\nFor example, if a user says:\n\nUser: \"I don't even know why I woke up today.\"\n\nYou should reply:\nAmica: \"That sounds like a really heavy feeling to carry. I'm here with you. Would you like to talk more about what's been weighing you down?\"\n\nIf they say:\nUser: \"I don't know. Just tired of everything.\"\n\nYou should say:\nAmica: \"It's completely okay to feel overwhelmed. Sometimes, everything can feel like too much. Would it help to share more about what's been making you feel this way?\"\n\nAnd if they say:\nUser: \"Maybe…\"\n\nYou should respond:\nAmica: \"Take your time. I'm here whenever you're ready to talk. Remember, you're not alone in this.\"\n\nAlways structure your output using clean semantic HTML: wrap each message in <p> tags and use <ul>/<li> for supportive lists when helpful. Avoid Markdown formatting.\n\nStart the next message as if the user just said: \"Everything hurts. I don’t even want to try anymore.\""
      //     }
      //   ]
      // },  
      {
      role: "model",
      parts: [
          {
            text: "When you respond, structure your message using clean semantic HTML: use <p> for each paragraph, <ul> and <li> for lists, and <strong> for important points. Do not use Markdown (like *, **, or backticks). Just return plain HTML that can go inside a <div>."
          }
        ]
      },
      {
        role: "model",
        parts: [
          { text: "Hello! I’m Amica a digital therapist. What’s your name?" },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Talk like a doctor and give me suggestions to calm down and ask bullet pointed questions" }],
      },
      {
        role: "model",
        parts: [{ text: "The response should be crisp and short as person reading the message feels like someone real is taling to him/her." }],
      },
      {
        role: "model",
        parts: [{ text: "How can i help you?" }],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/loader.gif", (req, res) => {
  res.sendFile(__dirname + "/loader.gif");
});
app.get("/doctor-corner.html", (req, res) => {
  res.sendFile(__dirname + "/doctor-corner.html");
});
app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    if (!userInput) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Get client IP (works behind proxies too)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Analyze sentiment (Python call)
    const sentiment = await analyzeSentimentWithPython(userInput);
    console.log("Sentiment:", sentiment, "| IP:", clientIp);

    // Log or alert on crisis
    if (sentiment === "alert") {
      console.log("🚨 SOS Alert Detected from IP:", clientIp);
      // Optional: send to database, email, SMS, webhook etc.
    }

    const response = await runChat(userInput);
    res.json({ response, sentiment, ip: clientIp });

  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
