import dns from "dns";
import net from "net";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Checks if a specific email mailbox exists via SMTP RCPT TO handshake.
 * @param {string} email 
 * @returns {Promise<{isValid: boolean, reason?: string}>}
 */
export const verifyMailboxExists = async (email) => {
  if (!email || !email.includes("@")) {
    return { isValid: false, reason: "Invalid email format" };
  }

  const domain = email.split("@")[1].trim().toLowerCase();

  // 1. DNS MX Lookup
  let mxRecords;
  try {
    mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, reason: `Domain @${domain} has no mail servers.` };
    }
  } catch (err) {
    return { isValid: false, reason: `Domain @${domain} does not exist.` };
  }

  // Sort MX by priority
  mxRecords.sort((a, b) => a.priority - b.priority);
  const mxHost = mxRecords[0].exchange;

  // 2. SMTP RCPT TO Check (for Gmail & major providers)
  return new Promise((resolve) => {
    let socket;
    let step = 0;
    let timer;

    const cleanup = () => {
      clearTimeout(timer);
      if (socket) socket.destroy();
    };

    timer = setTimeout(() => {
      cleanup();
      // If SMTP port 25 is blocked by ISP (common on residential networks), fallback to MX domain validity
      resolve({ isValid: true, note: "SMTP timeout fallback (ISP port 25 restricted)" });
    }, 4000);

    try {
      socket = net.createConnection(25, mxHost);
    } catch (e) {
      cleanup();
      return resolve({ isValid: true });
    }

    socket.setEncoding("ascii");

    socket.on("error", (err) => {
      cleanup();
      // Fallback if port 25 is blocked locally
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
        socket.write(`MAIL FROM:<check@quizarena.com>\r\n`);
      } else if (step === 2 && code === 250) {
        step++;
        socket.write(`RCPT TO:<${email}>\r\n`);
      } else if (step === 3) {
        step++;
        socket.write(`QUIT\r\n`);
        cleanup();

        if (code === 250 || code === 251) {
          resolve({ isValid: true });
        } else if (code >= 500 && code <= 554) {
          resolve({ isValid: false, reason: `Email address @${domain} does not exist or mailbox was rejected by Google/mail provider.` });
        } else {
          resolve({ isValid: true });
        }
      }
    });
  });
};

async function runTest() {
  console.log("=== Testing Mailbox Verification ===");
  const test1 = await verifyMailboxExists("manrajtoorsingh@gmail.com");
  console.log("manrajtoorsingh@gmail.com ->", test1);

  const test2 = await verifyMailboxExists("nonexistent_user_9999999_test@gmail.com");
  console.log("nonexistent_user_9999999_test@gmail.com ->", test2);

  console.log("\n=== Testing Nodemailer Transport Connection ===");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log("Gmail Transporter is VERIFIED and READY!");
  } catch (err) {
    console.error("Gmail Transporter Error:", err);
  }
}

runTest();
