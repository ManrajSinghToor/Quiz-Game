import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testSpeed() {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3-flash-preview"];
  const prompt = `Generate 5 multiple choice questions for subject Operating System. Return JSON array of objects with question, options (array of 4 strings), correctAnswer (0-3).`;

  for (const m of models) {
    const start = Date.now();
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({
        model: m,
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout 6s")), 6000)
      );
      
      const res = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const duration = Date.now() - start;
      const text = res.response.text();
      console.log(`SUCCESS [${m}] in ${duration}ms! Response length: ${text.length}`);
      break;
    } catch (err) {
      console.log(`FAIL [${m}] in ${Date.now() - start}ms: ${err.message}`);
    }
  }
}

testSpeed();
