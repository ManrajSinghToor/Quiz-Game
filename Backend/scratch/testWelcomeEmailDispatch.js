import { sendWelcomeEmail } from "../services/emailService.js";
import dotenv from "dotenv";

dotenv.config();

async function testWelcomeEmail() {
  console.log("=== Testing Welcome Email Dispatch ===");
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS Present:", !!process.env.SMTP_PASS);
  console.log("RESEND_API_KEY Present:", !!process.env.RESEND_API_KEY);

  const testRecipient = "manrajtoorsingh@gmail.com";
  const testName = "Manraj Singh";

  try {
    const success = await sendWelcomeEmail(testRecipient, testName);
    console.log("Welcome Email Dispatch Result:", success);
  } catch (err) {
    console.error("Welcome Email Dispatch Failed Error:", err.message);
  }
}

testWelcomeEmail();
