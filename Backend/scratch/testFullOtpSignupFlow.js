import { verifyEmailDomain, sendOtpEmail } from "../services/emailService.js";

async function testOtpFlow() {
  console.log("=== Testing 6-Digit Email OTP Verification Flow ===");

  const testEmail = "manrajtoorsingh@gmail.com";
  const testName = "Manraj";
  const otpCode = "584920";

  console.log(`\n1. Validating format & domain for: ${testEmail}...`);
  const domainResult = await verifyEmailDomain(testEmail);
  console.log("Domain Check:", domainResult);

  if (domainResult.isValid) {
    console.log(`\n2. Sending 6-digit OTP code '${otpCode}' to real email inbox ${testEmail}...`);
    try {
      const sent = await sendOtpEmail(testEmail, testName, otpCode);
      console.log("OTP Email Sent Status:", sent);
    } catch (err) {
      console.error("OTP Dispatch Error:", err.message);
    }
  }
}

testOtpFlow();
