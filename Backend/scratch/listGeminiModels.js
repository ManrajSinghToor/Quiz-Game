import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing API key prefix:", apiKey ? apiKey.substring(0, 8) + "..." : "NONE");
  
  const testModels = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  for (const m of testModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        console.log(`AVAILABLE MODEL: ${m}`);
      } else {
        console.log(`NOT AVAILABLE (${m}): ${data.error?.message || res.statusText}`);
      }
    } catch (e) {
      console.log(`ERROR (${m}): ${e.message}`);
    }
  }
}

listModels();
