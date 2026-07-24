import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testAllTransporters() {
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "manrajtoorsingh@gmail.com";
  const smtpPass = (process.env.SMTP_PASS || "lmmtomjitqfkipmy").replace(/\s+/g, "");

  console.log("=== Testing All Gmail Transporter Options ===");
  console.log("User:", smtpUser);

  // Transporter A: host smtp.gmail.com, port 465 (SSL)
  try {
    console.log("\nTrying Option A: smtp.gmail.com:465 (SSL)...");
    const tA = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const infoA = await tA.sendMail({
      from: `"Quiz Arena" <${smtpUser}>`,
      to: "officialrajgaming@gmail.com",
      subject: "Test Option A",
      text: "Testing Option A"
    });
    console.log("Option A SUCCESS! MessageID:", infoA.messageId);
  } catch (err) {
    console.error("Option A FAILED:", err.message);
  }

  // Transporter B: service "gmail"
  try {
    console.log("\nTrying Option B: service 'gmail'...");
    const tB = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const infoB = await tB.sendMail({
      from: `"Quiz Arena" <${smtpUser}>`,
      to: "officialrajgaming@gmail.com",
      subject: "Test Option B",
      text: "Testing Option B"
    });
    console.log("Option B SUCCESS! MessageID:", infoB.messageId);
  } catch (err) {
    console.error("Option B FAILED:", err.message);
  }

  // Transporter C: host smtp.gmail.com, port 587 (STARTTLS)
  try {
    console.log("\nTrying Option C: smtp.gmail.com:587 (TLS)...");
    const tC = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const infoC = await tC.sendMail({
      from: `"Quiz Arena" <${smtpUser}>`,
      to: "officialrajgaming@gmail.com",
      subject: "Test Option C",
      text: "Testing Option C"
    });
    console.log("Option C SUCCESS! MessageID:", infoC.messageId);
  } catch (err) {
    console.error("Option C FAILED:", err.message);
  }
}

testAllTransporters();
