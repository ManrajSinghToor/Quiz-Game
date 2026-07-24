import { sendOtpEmail } from "../services/emailService.js";

async function testOfficialRajGaming() {
  console.log("Testing email dispatch to officialrajgaming@gmail.com...");
  try {
    const result = await sendOtpEmail("officialrajgaming@gmail.com", "Manraj Singh", "948201");
    console.log("SUCCESS:", result);
  } catch (err) {
    console.error("ERROR CAUGHT:", err);
  }
}

testOfficialRajGaming();
