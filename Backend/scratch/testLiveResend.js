async function testResendLiveKey() {
  const resendKey = "re_Nh5V1Mr9_Bg8kQe2MjuQbRHTTuvxFkLTz";
  console.log("Testing Resend API with live key...");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Quiz Arena <onboarding@resend.dev>",
        to: ["officialrajgaming@gmail.com"],
        subject: "Welcome to Quiz Arena! 🏆",
        html: "<h1>Welcome to Quiz Arena!</h1><p>Your account has been created successfully.</p>"
      })
    });
    const data = await res.json();
    console.log("Resend API Status:", res.status);
    console.log("Resend API Response:", data);
  } catch (err) {
    console.error("Resend API Exception:", err.message);
  }
}

testResendLiveKey();
