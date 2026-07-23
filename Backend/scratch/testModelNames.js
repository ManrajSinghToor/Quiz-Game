import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Respond with JSON array of 2 math questions: [{question, options, correctAnswer}]");
    const text = result.response.text();
    console.log(`SUCCESS [${modelName}]:`, text.substring(0, 150));
  } catch (err) {
    console.error(`FAILED [${modelName}]:`, err.message);
  }
}

async function run() {
  await testModel("gemini-2.0-flash");
  await testModel("gemini-1.5-flash");
  await testModel("gemini-2.5-flash");
}
run();
