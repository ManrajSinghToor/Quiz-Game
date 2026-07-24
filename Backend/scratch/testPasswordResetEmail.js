import { sendPasswordResetEmail } from "../services/emailService.js";
import dotenv from "dotenv";

dotenv.config();

async function testResetEmail() {
  console.log("=== Testing Password Reset Email Dispatch ===");
  try {
    const success = await sendPasswordResetEmail("manrajtoorsingh@gmail.com", "Manraj", "849201");
    console.log("Password Reset Email Sent Result:", success);
  } catch (err) {
    console.error("Password Reset Email Error:", err.message);
  }
}

testResetEmail();
