import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testPort587StartTls() {
  const smtpUser = (process.env.SMTP_USER || process.env.SMTP_EMAIL || "manrajtoorsingh@gmail.com").trim();
  const smtpPass = (process.env.SMTP_PASS || "lmmtomjitqfkipmy").replace(/\s+/g, "");

  console.log("=== Testing Gmail Port 587 STARTTLS ===");
  console.log("User:", smtpUser);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS / STARTTLS
      requireTLS: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      family: 4,
      connectionTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"Quiz Arena" <${smtpUser}>`,
      to: "manrajtoorsingh@gmail.com",
      subject: "Test Gmail Port 587 STARTTLS",
      text: "Testing Port 587 STARTTLS delivery"
    });

    console.log("Port 587 STARTTLS SUCCESS! MessageID:", info.messageId);
  } catch (err) {
    console.error("Port 587 STARTTLS Error:", err.message);
  }
}

testPort587StartTls();
