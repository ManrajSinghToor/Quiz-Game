import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

async function testFastFallback() {
  const start = Date.now();
  console.log("Starting quick question generation test...");

  let questions = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[Gemini] Attempting ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout 3s")), 3000)
      );

      const prompt = `Generate 5 multiple choice questions for subject Operating System. Return JSON array of objects with question, options (array of 4 strings), correctAnswer (0-3).`;

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      const text = result.response.text();
      questions = JSON.parse(text);
      console.log(`[Gemini SUCCESS (${modelName})]: Loaded in ${Date.now() - start}ms`);
      break;
    } catch (err) {
      console.warn(`[Gemini Fast Fail (${modelName})]: ${err.message.substring(0, 100)} (took ${Date.now() - start}ms)`);
      if (err.message.includes("429") || err.message.includes("Quota")) {
        console.log("Quota exceeded, stopping Gemini attempts immediately.");
        break; // Fast fail on 429 quota so user doesn't wait!
      }
    }
  }

  if (!questions) {
    console.log(`[Fast Local Fallback] Loaded questions in ${Date.now() - start}ms TOTAL!`);
  }
}

testFastFallback();
