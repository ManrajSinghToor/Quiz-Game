import nodemailer from "nodemailer";

const appPassword = "nnuntxvsebtddehu";

const candidateEmails = [
  "manrajtoorsingh@gmail.com",
  "manrajtoor22@gmail.com",
  "manrajsinghtoor@gmail.com",
  "manrajsingh@gmail.com"
];

async function testGmailSMTP() {
  for (const userEmail of candidateEmails) {
    console.log(`Testing SMTP authentication for ${userEmail}...`);
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: userEmail,
          pass: appPassword
        }
      });

      await transporter.verify();
      console.log(`\nSUCCESS! Valid Gmail SMTP Account: ${userEmail}`);
      return userEmail;
    } catch (err) {
      console.log(`Failed for ${userEmail}: ${err.message}`);
    }
  }
  return null;
}

testGmailSMTP();
