import { verifyEmailDomain, sendWelcomeEmail } from "../services/emailService.js";

async function testMailboxValidation() {
  console.log("=== Testing Real Email Delivery & Mailbox Validation ===");

  const emailsToTest = [
    "manrajtoorsingh@gmail.com",
    "fakeuser12398712391238@gmail.com",
    "test@dispostable.com",
    "invalid-email-format"
  ];

  for (const email of emailsToTest) {
    console.log(`\nTesting Email: ${email}`);
    const check = await verifyEmailDomain(email);
    console.log(`Domain Check Result:`, check);

    if (check.isValid) {
      try {
        console.log(`Attempting email dispatch to ${email}...`);
        const sent = await sendWelcomeEmail(email, "Test Player");
        console.log(`Email Sent Status:`, sent);
      } catch (err) {
        console.log(`Email Dispatch FAILED:`, err.message);
      }
    }
  }
}

testMailboxValidation();
