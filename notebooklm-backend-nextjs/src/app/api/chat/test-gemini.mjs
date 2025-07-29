import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = "AIzaSyBWpg2AIo7xy4RYGiIyusY-k5PFvP4q0-0";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "What is the capital of France?" }],
        },
      ],
    });
    const response = await result.response;
    console.log("✅ Gemini Response:", response.text());
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    } else {
      console.error("❌ Unknown error:", error);
    }
  }
}

run();
