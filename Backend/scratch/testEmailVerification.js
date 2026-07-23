import { verifyEmailDomain, sendWelcomeEmail } from "../services/emailService.js";

async function test() {
  console.log("=== Testing Email Domain Existence Verification (DNS MX Check) ===");

  const testEmails = [
    "user@gmail.com",
    "student@chitkara.edu.in",
    "player@outlook.com",
    "fakeuser@nonexistent-fake-domain-9999.org"
  ];

  for (const email of testEmails) {
    const result = await verifyEmailDomain(email);
    console.log(`Email: ${email} -> Valid: ${result.isValid} ${result.reason ? `(Reason: ${result.reason})` : ""}`);
  }

  console.log("\n=== Testing Welcome Email Dispatch ===");
  await sendWelcomeEmail("testplayer@gmail.com", "Manraj");
}

test();
