import { sendWelcomeEmail } from "../services/emailService.js";
import dotenv from "dotenv";

dotenv.config();

async function testRealDelivery() {
  console.log("=== Testing Real Email Delivery to officialrajgaming@gmail.com ===");
  try {
    const res = await sendWelcomeEmail("officialrajgaming@gmail.com", "Manraj");
    console.log("Delivery Result:", res);
  } catch (err) {
    console.error("Delivery Error:", err.message);
  }
}

testRealDelivery();
