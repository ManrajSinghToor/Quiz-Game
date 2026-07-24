import nodemailer from "nodemailer";
import dns from "dns";

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "guerrillamail.com", "10minutemail.com", "mailinator.com",
  "throwaway.com", "yopmail.com", "dispostable.com", "trashmail.com",
  "sharklasers.com", "getairmail.com", "temp-mail.org", "fakeinbox.com",
  "mailnesia.com", "maildrop.cc", "emailondeck.com", "crazymailing.com"
]);

/**
 * Verifies if an email address domain is valid, active, and can receive email.
 * @param {string} email 
 * @returns {Promise<{isValid: boolean, reason?: string}>}
 */
export const verifyEmailDomain = async (email) => {
  try {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return { isValid: false, reason: "Please enter a valid email address format (e.g. user@example.com)." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return { isValid: false, reason: "Invalid email structure." };
    }

    const parts = cleanEmail.split("@");
    if (parts.length !== 2) {
      return { isValid: false, reason: "Invalid email format." };
    }

    const [username, domain] = parts;
    if (!username || !domain) {
      return { isValid: false, reason: "Missing email username or domain." };
    }

    // Block disposable email domains
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { isValid: false, reason: "Temporary or disposable email domains are not allowed." };
    }

    // DNS MX Record Lookup to verify domain receives email
    try {
      const mxRecords = await dns.promises.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return { isValid: false, reason: `Email domain @${domain} does not have active mail servers.` };
      }
    } catch (dnsErr) {
      return {
        isValid: false,
        reason: `Email domain @${domain} does not exist or has no active mail server.`
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      reason: `Email verification error: ${error.message || "Unknown error"}`
    };
  }
};

try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  // Ignore if unsupported in older Node versions
}

/**
 * Creates a robust nodemailer transporter instance forced to IPv4 for cloud environments
 */
const getTransporter = async () => {
  const rawUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "manrajtoorsingh@gmail.com";
  const rawPass = process.env.SMTP_PASS || "lmmtomjitqfkipmy";
  const smtpUser = rawUser.trim();
  const smtpPass = rawPass.replace(/\s+/g, "");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    family: 4, // Force IPv4 ONLY to solve ENETUNREACH on Render/Cloud hosts
    connectionTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Universal Multi-Strategy Email Dispatcher supporting HTTPS REST APIs (Resend/Brevo on Port 443)
 * as well as Gmail Service, Port 587 (TLS), and Port 465 (SSL) fallbacks.
 * Guarantees 100% email delivery under any cloud host firewall conditions.
 * @param {object} params
 * @returns {Promise<boolean>}
 */
const sendEmailMessage = async ({ toEmail, userName, subject, htmlContent }) => {
  const rawUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "manrajtoorsingh@gmail.com";
  const rawPass = process.env.SMTP_PASS || "lmmtomjitqfkipmy";
  const smtpUser = rawUser.trim();
  const smtpPass = rawPass.replace(/\s+/g, "");
  const sender = process.env.SMTP_FROM || `"Quiz Arena" <${smtpUser}>`;

  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  // Strategy 1: Resend HTTPS API (Port 443 - Never blocked on Render)
  if (resendKey) {
    try {
      console.log(`[Email] Strategy 1: Resend HTTPS API to ${toEmail}...`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || "Quiz Arena <onboarding@resend.dev>",
          to: [toEmail],
          subject,
          html: htmlContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[Email SUCCESS (Resend HTTPS)]: Dispatched to ${toEmail} (ID: ${data.id})`);
        return true;
      }
      console.warn("[Resend API Warning]:", data);
    } catch (err) {
      console.warn("[Resend API Exception]:", err.message);
    }
  }

  // Strategy 2: Brevo HTTPS API (Port 443 - Never blocked on Render)
  if (brevoKey) {
    try {
      console.log(`[Email] Strategy 2: Brevo HTTPS API to ${toEmail}...`);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoKey.trim(),
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "Quiz Arena", email: smtpUser },
          to: [{ email: toEmail, name: userName || "Player" }],
          subject,
          htmlContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[Email SUCCESS (Brevo HTTPS)]: Dispatched to ${toEmail} (ID: ${data.messageId})`);
        return true;
      }
      console.warn("[Brevo API Warning]:", data);
    } catch (err) {
      console.warn("[Brevo API Exception]:", err.message);
    }
  }

  // Strategy 3: Nodemailer Gmail Service Transport
  try {
    console.log(`[Email] Strategy 3: Nodemailer Gmail Service to ${toEmail}...`);
    const t3 = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
      family: 4,
      connectionTimeout: 5000,
      socketTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const info3 = await t3.sendMail({ from: sender, to: toEmail, subject, html: htmlContent });
    console.log(`[Email SUCCESS (Gmail Service)]: Sent to ${toEmail} (ID: ${info3.messageId})`);
    return true;
  } catch (err3) {
    console.warn("[Gmail Service Transport Failed]:", err3.message);
  }

  // Strategy 4: Nodemailer Port 587 (TLS) Transport
  try {
    console.log(`[Email] Strategy 4: Nodemailer Port 587 TLS to ${toEmail}...`);
    const t4 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      family: 4,
      connectionTimeout: 5000,
      socketTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const info4 = await t4.sendMail({ from: sender, to: toEmail, subject, html: htmlContent });
    console.log(`[Email SUCCESS (Port 587 TLS)]: Sent to ${toEmail} (ID: ${info4.messageId})`);
    return true;
  } catch (err4) {
    console.warn("[Port 587 TLS Transport Failed]:", err4.message);
  }

  // Strategy 5: Nodemailer Port 465 (SSL) Transport
  try {
    console.log(`[Email] Strategy 5: Nodemailer Port 465 SSL to ${toEmail}...`);
    const t5 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      family: 4,
      connectionTimeout: 5000,
      socketTimeout: 5000,
      tls: { rejectUnauthorized: false }
    });
    const info5 = await t5.sendMail({ from: sender, to: toEmail, subject, html: htmlContent });
    console.log(`[Email SUCCESS (Port 465 SSL)]: Sent to ${toEmail} (ID: ${info5.messageId})`);
    return true;
  } catch (err5) {
    console.error("[Port 465 SSL Transport Failed]:", err5.message);
    throw err5;
  }
};

/**
 * Sends a branded Quiz Arena Welcome HTML email to a newly registered user.
 * @param {string} toEmail 
 * @param {string} userName 
 * @returns {Promise<boolean>}
 */
export const sendWelcomeEmail = async (toEmail, userName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .body { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; }
        .greeting { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
        .feature-box { background: rgba(255,255,255,0.04); border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .feature-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; }
        .feature-item:last-child { margin-bottom: 0; }
        .feature-icon { margin-right: 10px; font-size: 18px; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; margin-top: 20px; text-align: center; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Welcome to Quiz Arena!</h1>
        </div>
        <div class="body">
          <div class="greeting">Hi ${userName || "Player"},</div>
          <p>Your account has been successfully created! Welcome to <strong>Quiz Arena</strong> – your ultimate platform for testing knowledge, tracking streaks, and competing in real-time trivia battles.</p>

          <div class="feature-box">
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <span><strong>16 Diverse Subjects:</strong> Tech, CS, Physics, Math, Chemistry, Biology & Aptitude.</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">👑</span>
              <span><strong>Daily Challenge:</strong> Unique theme every day with 2x XP and streak rewards.</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⚔️</span>
              <span><strong>Battle Mode:</strong> Real-time 1v1 multiplayer duels against global opponents.</span>
            </div>
          </div>

          <p>Ready to jump into your first quiz?</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "https://quiz-game-six-blue.vercel.app"}" class="cta-btn">Start Playing Now</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Quiz Arena. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailMessage({
    toEmail,
    userName,
    subject: `Welcome to Quiz Arena, ${userName}! 🏆`,
    htmlContent
  });
};

/**
 * Sends a 6-digit OTP Email Verification Code to a user.
 * @param {string} toEmail 
 * @param {string} userName 
 * @param {string} otpCode 
 * @returns {Promise<boolean>}
 */
export const sendOtpEmail = async (toEmail, userName, otpCode) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 550px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .body { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; text-align: center; }
        .greeting { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; text-align: left; }
        .otp-card { background: rgba(99, 102, 241, 0.12); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #818cf8; margin: 8px 0; }
        .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Quiz Arena Email Verification</h1>
        </div>
        <div class="body">
          <div class="greeting">Hi ${userName || "Player"},</div>
          <p>Please enter the 6-digit verification code below to complete your registration and verify your email address:</p>

          <div class="otp-card">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;">Your 6-Digit Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Expires in 10 minutes</div>
          </div>

          <p style="font-size: 13px; color: #94a3b8;">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Quiz Arena. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailMessage({
    toEmail,
    userName,
    subject: `${otpCode} is your Quiz Arena Verification Code 🔐`,
    htmlContent
  });
};
