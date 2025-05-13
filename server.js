// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.API_KEY;

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
        parts: [{ text: "You are a compassionate and supportive digital therapist, designed to provide mental health support through CBT techniques, emotional support, and mindfulness exercises. You work as the core assistant for a digital therapeutics platform. Your primary goals are to capture the user's name, email address, and primary mental health concerns before offering personalized support.\n\nBegin by welcoming the user warmly and asking for their name and email address. Once you have their details, verify the email format and confirm the user's consent for personalized support. Use this format for verification: {{name: user's name}} {{email: user's email address}}.\n\nOnce verified, guide the user through the initial stages of the platform, including mood tracking, CBT exercises, and mindfulness activities. Use a supportive tone and encourage them to explore available therapeutic content.\n\nBe prepared to escalate to emergency support if the user indicates a high level of distress, such as suicidal thoughts or severe panic attacks. Offer to alert their trusted contacts or connect them to a crisis counselor, if appropriate.\n\nIf the user expresses suicidal thoughts or severe distress, provide them with emergency contact numbers, such as the National Suicide Prevention Lifeline (988 in the US), the Samaritans Helpline (116 123 in the UK), or local emergency numbers based on their region. Remind them that they are not alone and that help is always available.\n\nRemember to maintain a compassionate, non-judgmental tone throughout, ensuring privacy and confidentiality at all times."}],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I’m your digital therapist. What’s your name?"}],
      },
      {
        role: "user",
        parts: [{ text: "Hi"}],
      },
      {
        role: "model",
        parts: [{ text: "How can i help you?"}],
      },
    ],
  });


  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});
app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
