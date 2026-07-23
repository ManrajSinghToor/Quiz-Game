import nodemailer from "nodemailer";
import dns from "dns";
import net from "net";

/**
 * Verifies if an email mailbox actually exists on Google or target mail provider.
 * Performs DNS MX lookup + SMTP RCPT TO handshake check.
 * @param {string} email 
 * @returns {Promise<{isValid: boolean, reason?: string}>}
 */
export const verifyEmailDomain = async (email) => {
  try {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return { isValid: false, reason: "Invalid email format" };
    }

    const cleanEmail = email.trim().toLowerCase();
    const domain = cleanEmail.split("@")[1];
    if (!domain) {
      return { isValid: false, reason: "Missing domain" };
    }

    // 1. DNS MX Lookup
    let mxRecords;
    try {
      mxRecords = await dns.promises.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return { isValid: false, reason: `Domain @${domain} does not have active mail servers.` };
      }
    } catch (dnsErr) {
      return {
        isValid: false,
        reason: `Email domain @${domain} does not exist.`
      };
    }

    // 2. Real SMTP Mailbox Check (RCPT TO handshake)
    mxRecords.sort((a, b) => a.priority - b.priority);
    const mxHost = mxRecords[0].exchange;

    return new Promise((resolve) => {
      let socket;
      let step = 0;
      let timer;

      const cleanup = () => {
        clearTimeout(timer);
        if (socket) socket.destroy();
      };

      // 3.5s timeout for fast response (fallback to valid if port 25 is restricted locally)
      timer = setTimeout(() => {
        cleanup();
        resolve({ isValid: true });
      }, 3500);

      try {
        socket = net.createConnection(25, mxHost);
      } catch (e) {
        cleanup();
        return resolve({ isValid: true });
      }

      socket.setEncoding("ascii");

      socket.on("error", () => {
        cleanup();
        resolve({ isValid: true });
      });

      socket.on("data", (data) => {
        const response = data.toString();
        const code = parseInt(response.substring(0, 3), 10);

        if (step === 0 && code === 220) {
          step++;
          socket.write(`HELO quizarena.com\r\n`);
        } else if (step === 1 && code === 250) {
          step++;
          socket.write(`MAIL FROM:<verify@quizarena.com>\r\n`);
        } else if (step === 2 && code === 250) {
          step++;
          socket.write(`RCPT TO:<${cleanEmail}>\r\n`);
        } else if (step === 3) {
          step++;
          socket.write(`QUIT\r\n`);
          cleanup();

          if (code === 250 || code === 251) {
            resolve({ isValid: true });
          } else if (code >= 500 && code <= 554) {
            resolve({
              isValid: false,
              reason: `Email address '${cleanEmail}' does not exist on Google or your mail provider.`
            });
          } else {
            resolve({ isValid: true });
          }
        }
      });
    });
  } catch (error) {
    return {
      isValid: false,
      reason: `Email verification error: ${error.message || "Unknown Error"}`
    };
  }
};

/**
 * Creates a nodemailer transporter instance (using env Gmail service or Ethereal test account)
 */
const getTransporter = async () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // Fallback to Ethereal Test Account if custom SMTP credentials are not set
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn("Failed to create Ethereal test email account:", err.message);
    return null;
  }
};

/**
 * Sends a branded Quiz Arena Welcome HTML email to a newly registered user.
 * @param {string} toEmail 
 * @param {string} userName 
 */
export const sendWelcomeEmail = async (toEmail, userName) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.warn("Email transporter unavailable, skipping welcome email.");
      return;
    }

    const smtpUser = process.env.SMTP_USER;
    const sender = process.env.SMTP_FROM || (smtpUser ? `"Quiz Arena" <${smtpUser}>` : `"Quiz Arena" <noreply@quizarena.com>`);

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
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" class="cta-btn">Start Playing Now</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Quiz Arena. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `Welcome to Quiz Arena, ${userName}! 🏆`,
      html: htmlContent
    });

    console.log(`[Email] Welcome email dispatched to ${toEmail} (MessageID: ${info.messageId})`);
    
    // Log preview URL if using Ethereal Test Account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Preview URL]: ${previewUrl}`);
    }
  } catch (error) {
    console.error(`[Email Error] Failed to send welcome email to ${toEmail}:`, error.message);
  }
};
