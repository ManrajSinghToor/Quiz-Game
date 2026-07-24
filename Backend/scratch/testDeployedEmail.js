import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log("Testing SMTP User:", smtpUser);
  console.log("Testing SMTP Pass Present:", Boolean(smtpPass));

  // Test 1: Service Gmail
  try {
    console.log("\n1. Testing with service: 'gmail'...");
    const transporter1 = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass.replace(/\s+/g, "") }
    });
    const info1 = await transporter1.sendMail({
      from: `"Quiz Arena Test" <${smtpUser}>`,
      to: smtpUser,
      subject: "Quiz Arena Deployment Test 1",
      text: "Test 1 successful!"
    });
    console.log("Test 1 SUCCESS! MessageId:", info1.messageId);
  } catch (err) {
    console.error("Test 1 FAILED:", err.message);
  }

  // Test 2: Direct Host smtp.gmail.com port 465 SSL
  try {
    console.log("\n2. Testing with host: 'smtp.gmail.com', port: 465, secure: true...");
    const transporter2 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass.replace(/\s+/g, "") },
      tls: { rejectUnauthorized: false }
    });
    const info2 = await transporter2.sendMail({
      from: `"Quiz Arena Test" <${smtpUser}>`,
      to: smtpUser,
      subject: "Quiz Arena Deployment Test 2",
      text: "Test 2 successful!"
    });
    console.log("Test 2 SUCCESS! MessageId:", info2.messageId);
  } catch (err) {
    console.error("Test 2 FAILED:", err.message);
  }
}

testEmail();
