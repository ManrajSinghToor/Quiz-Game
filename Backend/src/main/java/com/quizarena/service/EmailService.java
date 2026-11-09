package com.quizarena.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Year;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class EmailService {

    private static final Set<String> DISPOSABLE_DOMAINS = new HashSet<>(Arrays.asList(
            "tempmail.com", "guerrillamail.com", "10minutemail.com", "mailinator.com",
            "throwaway.com", "yopmail.com", "dispostable.com", "trashmail.com",
            "sharklasers.com", "getairmail.com", "temp-mail.org", "fakeinbox.com",
            "mailnesia.com", "maildrop.cc", "emailondeck.com", "crazymailing.com"
    ));

    private static final Set<String> TRUSTED_DOMAINS = new HashSet<>(Arrays.asList(
            "gmail.com", "googlemail.com", "yahoo.com", "outlook.com",
            "hotmail.com", "live.com", "icloud.com", "proton.me", "protonmail.com"
    ));

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final HttpClient httpClient;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private int smtpPort;

    @Value("${spring.mail.username:manrajtoorsingh@gmail.com}")
    private String smtpUser;

    @Value("${spring.mail.password:}")
    private String smtpPass;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${app.frontend-url:https://quiz-game-six-blue.vercel.app}")
    private String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
    }

    public static class DomainVerificationResult {
        private final boolean valid;
        private final String reason;

        public DomainVerificationResult(boolean valid, String reason) {
            this.valid = valid;
            this.reason = reason;
        }

        public boolean isValid() {
            return valid;
        }

        public String getReason() {
            return reason;
        }
    }

    public DomainVerificationResult verifyEmailDomain(String email) {
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            return new DomainVerificationResult(false, "Please enter a valid email address format (e.g. user@example.com).");
        }

        String cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return new DomainVerificationResult(false, "Invalid email structure.");
        }

        String[] parts = cleanEmail.split("@");
        if (parts.length != 2) {
            return new DomainVerificationResult(false, "Invalid email format.");
        }

        String username = parts[0];
        String domain = parts[1];
        if (username.isEmpty() || domain.isEmpty()) {
            return new DomainVerificationResult(false, "Missing email username or domain.");
        }

        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return new DomainVerificationResult(false, "Temporary or disposable email domains are not allowed.");
        }

        if (TRUSTED_DOMAINS.contains(domain)) {
            return new DomainVerificationResult(true, null);
        }

        // DNS MX Record lookup for other domains
        DirContext ictx = null;
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            ictx = new InitialDirContext(env);
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");
            if (attr == null || attr.size() == 0) {
                return new DomainVerificationResult(false, "Email domain @" + domain + " does not have active mail servers.");
            }
        } catch (Exception e) {
            System.out.println("[DNS Warning] Could not resolve MX for @" + domain + ": " + e.getMessage());
        } finally {
            if (ictx != null) {
                try {
                    ictx.close();
                } catch (Exception ignored) {
                }
            }
        }

        return new DomainVerificationResult(true, null);
    }

    private JavaMailSenderImpl createSender(String host, int port, String user, String pass, boolean useSsl) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(user);
        sender.setPassword(pass != null ? pass.replace(" ", "") : "");
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.connectiontimeout", "4000");
        props.put("mail.smtp.timeout", "4000");
        props.put("mail.smtp.writetimeout", "4000");

        if (useSsl || port == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", String.valueOf(port));
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
            props.put("mail.smtp.starttls.enable", "false");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.enable", "false");
        }

        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.transport.protocol", "smtp");

        return sender;
    }

    public boolean sendEmailMessage(String toEmail, String userName, String subject, String htmlContent) {
        String cleanUser = (smtpUser != null && !smtpUser.trim().isEmpty()) ? smtpUser.trim() : "manrajtoorsingh@gmail.com";
        String cleanPass = smtpPass != null ? smtpPass.trim() : "";

        // 1. Resend HTTPS API (if configured)
        if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            try {
                System.out.println("[Email Dispatch] Resend HTTPS API to " + toEmail + "...");
                String payload = String.format(
                        "{\"from\":\"Quiz Arena <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":%s}",
                        toEmail,
                        escapeJson(subject),
                        quoteJson(htmlContent)
                );
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.resend.com/emails"))
                        .header("Authorization", "Bearer " + resendApiKey.trim())
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(5))
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    System.out.println("[Email SUCCESS (Resend HTTPS)]: Delivered to " + toEmail);
                    return true;
                }
            } catch (Exception e) {
                System.err.println("[Resend API Error]: " + e.getMessage());
            }
        }

        // 2. Brevo HTTPS API (if configured)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            try {
                System.out.println("[Email Dispatch] Brevo HTTPS API to " + toEmail + "...");
                String payload = String.format(
                        "{\"sender\":{\"name\":\"Quiz Arena\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\",\"name\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":%s}",
                        cleanUser,
                        toEmail,
                        escapeJson(userName != null ? userName : "Player"),
                        escapeJson(subject),
                        quoteJson(htmlContent)
                );
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                        .header("api-key", brevoApiKey.trim())
                        .header("Content-Type", "application/json")
                        .header("accept", "application/json")
                        .timeout(Duration.ofSeconds(5))
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    System.out.println("[Email SUCCESS (Brevo HTTPS)]: Delivered to " + toEmail);
                    return true;
                }
            } catch (Exception e) {
                System.err.println("[Brevo API Error]: " + e.getMessage());
            }
        }

        // 3. Try Spring Boot Autowired MailSender (if available)
        JavaMailSender springSender = mailSenderProvider != null ? mailSenderProvider.getIfAvailable() : null;
        if (springSender != null) {
            try {
                System.out.println("[Email Dispatch] Primary Spring MailSender to " + toEmail + "...");
                MimeMessage message = springSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(cleanUser, "Quiz Arena");
                helper.setReplyTo(cleanUser);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim(), htmlContent);

                springSender.send(message);
                System.out.println("[Email SUCCESS (Primary Spring MailSender)]: Sent to " + toEmail);
                return true;
            } catch (Exception e) {
                System.out.println("[Primary MailSender Warning]: " + e.getMessage() + ". Attempting direct multi-port fallback...");
            }
        }

        // 4. Try Port 587 STARTTLS (Gmail default)
        try {
            System.out.println("[Email Dispatch] Direct Port 587 STARTTLS to " + toEmail + "...");
            JavaMailSenderImpl sender587 = createSender(smtpHost, 587, cleanUser, cleanPass, false);
            MimeMessage message = sender587.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(cleanUser, "Quiz Arena");
            helper.setReplyTo(cleanUser);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim(), htmlContent);

            sender587.send(message);
            System.out.println("[Email SUCCESS (Port 587 STARTTLS)]: Sent to " + toEmail);
            return true;
        } catch (Exception e587) {
            System.out.println("[Port 587 Warning]: " + e587.getMessage() + ". Attempting Port 465 SSL fallback...");
        }

        // 5. Try Port 465 SSL fallback
        try {
            System.out.println("[Email Dispatch] Direct Port 465 SSL to " + toEmail + "...");
            JavaMailSenderImpl sender465 = createSender(smtpHost, 465, cleanUser, cleanPass, true);
            MimeMessage message = sender465.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(cleanUser, "Quiz Arena");
            helper.setReplyTo(cleanUser);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim(), htmlContent);

            sender465.send(message);
            System.out.println("[Email SUCCESS (Port 465 SSL)]: Sent to " + toEmail);
            return true;
        } catch (Exception e465) {
            System.err.println("[SMTP All Fallbacks Failed]: " + e465.getMessage());
            throw new RuntimeException("Email delivery failed: " + (e465.getMessage() != null ? e465.getMessage() : "SMTP authentication/connection error"), e465);
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String htmlContent = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
                + "<style>"
                + "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }"
                + ".container { max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
                + ".header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }"
                + ".header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }"
                + ".body { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; }"
                + ".greeting { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }"
                + ".status-badge { display: inline-block; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #4ade80; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }"
                + ".feature-box { background: rgba(255,255,255,0.04); border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0; }"
                + ".feature-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; }"
                + ".cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; margin-top: 20px; text-align: center; }"
                + ".footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }"
                + "</style></head><body>"
                + "<div class=\"container\">"
                + "<div class=\"header\"><h1>🏆 Welcome to Quiz Arena!</h1></div>"
                + "<div class=\"body\">"
                + "<div class=\"status-badge\">🎉 Signup Successful</div>"
                + "<div class=\"greeting\">Hi " + (userName != null ? userName : "Player") + ",</div>"
                + "<p>Your account has been successfully created! Welcome to <strong>Quiz Arena</strong> – your ultimate platform for testing knowledge, tracking streaks, and competing in real-time trivia battles.</p>"
                + "<div class=\"feature-box\">"
                + "<div class=\"feature-item\"><span>📚 <strong>16 Diverse Subjects:</strong> Tech, CS, Physics, Math, Chemistry, Biology & Aptitude.</span></div>"
                + "<div class=\"feature-item\"><span>👑 <strong>Daily Challenge:</strong> Unique theme every day with 2x XP and streak rewards.</span></div>"
                + "<div class=\"feature-item\"><span>⚔️ <strong>Battle Mode:</strong> Real-time 1v1 multiplayer duels against global opponents.</span></div>"
                + "</div>"
                + "<p>Ready to jump into your first quiz?</p>"
                + "<div style=\"text-align: center;\"><a href=\"" + frontendUrl + "\" class=\"cta-btn\">Start Playing Now</a></div>"
                + "</div>"
                + "<div class=\"footer\"><p>© " + Year.now().getValue() + " Quiz Arena. All rights reserved.</p></div>"
                + "</div></body></html>";

        try {
            sendEmailMessage(toEmail, userName, "Welcome to Quiz Arena – Signup Successful! 🏆", htmlContent);
        } catch (Exception e) {
            System.err.println("[Background Welcome Email Warning]: " + e.getMessage());
        }
    }

    public void sendOtpEmail(String toEmail, String userName, String otpCode) {
        String htmlContent = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
                + "<style>"
                + "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }"
                + ".container { max-width: 550px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
                + ".header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 28px 24px; text-align: center; color: #ffffff; }"
                + ".header h1 { margin: 0; font-size: 24px; font-weight: 800; }"
                + ".body { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; text-align: center; }"
                + ".greeting { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; text-align: left; }"
                + ".otp-card { background: rgba(99, 102, 241, 0.12); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }"
                + ".otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #818cf8; margin: 8px 0; }"
                + ".footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }"
                + "</style></head><body>"
                + "<div class=\"container\">"
                + "<div class=\"header\"><h1>🔐 Quiz Arena Email Verification</h1></div>"
                + "<div class=\"body\">"
                + "<div class=\"greeting\">Hi " + (userName != null ? userName : "Player") + ",</div>"
                + "<p>Please enter the 6-digit verification code below to complete your registration and verify your email address:</p>"
                + "<div class=\"otp-card\">"
                + "<div style=\"font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;\">Your 6-Digit Verification Code</div>"
                + "<div class=\"otp-code\">" + otpCode + "</div>"
                + "<div style=\"font-size: 12px; color: #94a3b8; margin-top: 4px;\">Expires in 10 minutes</div>"
                + "</div>"
                + "<p style=\"font-size: 13px; color: #94a3b8;\">If you did not request this code, you can safely ignore this email.</p>"
                + "</div>"
                + "<div class=\"footer\"><p>© " + Year.now().getValue() + " Quiz Arena. All rights reserved.</p></div>"
                + "</div></body></html>";

        // Print backup code to server console for local dev convenience
        System.out.println("=================================================");
        System.out.println("[DEV OTP CODE]: " + otpCode + " (for " + toEmail + ")");
        System.out.println("=================================================");

        sendEmailMessage(toEmail, userName, otpCode + " is your Quiz Arena Verification Code 🔐", htmlContent);
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String resetCode) {
        String htmlContent = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
                + "<style>"
                + "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }"
                + ".container { max-width: 550px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
                + ".header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 28px 24px; text-align: center; color: #ffffff; }"
                + ".header h1 { margin: 0; font-size: 24px; font-weight: 800; }"
                + ".body { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; text-align: center; }"
                + ".greeting { font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; text-align: left; }"
                + ".otp-card { background: rgba(239, 68, 68, 0.12); border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }"
                + ".otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f87171; margin: 8px 0; }"
                + ".footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }"
                + "</style></head><body>"
                + "<div class=\"container\">"
                + "<div class=\"header\"><h1>🔑 Password Reset Code</h1></div>"
                + "<div class=\"body\">"
                + "<div class=\"greeting\">Hi " + (userName != null ? userName : "Player") + ",</div>"
                + "<p>We received a request to reset your Quiz Arena password. Please use the 6-digit verification code below to reset your password:</p>"
                + "<div class=\"otp-card\">"
                + "<div style=\"font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px;\">Password Reset Verification Code</div>"
                + "<div class=\"otp-code\">" + resetCode + "</div>"
                + "<div style=\"font-size: 12px; color: #94a3b8; margin-top: 4px;\">Expires in 10 minutes</div>"
                + "</div>"
                + "<p style=\"font-size: 13px; color: #94a3b8;\">If you did not request a password reset, please ignore this email or contact support.</p>"
                + "</div>"
                + "<div class=\"footer\"><p>© " + Year.now().getValue() + " Quiz Arena. All rights reserved.</p></div>"
                + "</div></body></html>";

        System.out.println("=================================================");
        System.out.println("[DEV RESET CODE]: " + resetCode + " (for " + toEmail + ")");
        System.out.println("=================================================");

        try {
            sendEmailMessage(toEmail, userName, resetCode + " is your Quiz Arena Password Reset Code 🔑", htmlContent);
        } catch (Exception e) {
            System.err.println("[Password reset email dispatch error]: " + e.getMessage());
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String quoteJson(String s) {
        if (s == null) return "\"\"";
        return "\"" + escapeJson(s) + "\"";
    }
}
