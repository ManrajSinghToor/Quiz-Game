import { useState, useEffect } from "react";
import { BrainCircuit, Eye, EyeOff, ArrowRight, Check, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBase } from "../lib/utils";
import AnimatedBackground from "@/components/AnimatedBackground";

const Signup = () => {
  const navigate = useNavigate();
  const { user, loading, login: authLogin } = useAuth();

  const [step, setStep] = useState(1); // 1: Details, 2: OTP Verification
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!loading && user && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(formData.password) },
  ];

  // Step 1: Send OTP to user's real email address
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");

    const isPasswordValid = passwordRequirements.every((req) => req.met);
    if (!isPasswordValid) {
      setError("Please ensure password meets all security requirements.");
      setIsLoading(false);
      return;
    }

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to send verification code");
        setIsLoading(false);
        return;
      }

      setInfoMessage(`Verification code sent to ${formData.email}. Please check your inbox.`);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError("");
    setInfoMessage("");

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to resend code");
      } else {
        setInfoMessage(`New verification code sent to ${formData.email}!`);
        setResendTimer(60);
      }
    } catch (err) {
      setError("Failed to resend code. Please check connection.");
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.trim().length !== 6) {
      setError("Please enter the full 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Auto login on successful registration
      if (data.token && data.user) {
        authLogin(data.token, data.user);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-split">
      <div className="auth-deco gradient-accent">
        <div className="auth-deco-orb animate-float" style={{ top: "5rem", right: "2.5rem", width: "6rem", height: "6rem" }} />
        <div className="auth-deco-orb animate-float-delayed" style={{ bottom: "5rem", left: "2.5rem", width: "8rem", height: "8rem", background: "hsla(0, 0%, 100%, 0.05)" }} />
        <div className="auth-deco-orb animate-float-slow" style={{ top: "33%", left: "5rem", width: "4rem", height: "4rem" }} />
        <div className="auth-deco-content">
          <h2>Join the Arena!</h2>
          <p>Create your verified account and start competing with students and aspirants from around the world.</p>
          <div className="auth-feature-list">
            {[
              "100% Verified Real Email Accounts",
              "Test your knowledge with challenging quizzes",
              "Compete in real-time 1v1 multiplayer battles",
              "Track progress and climb the leaderboard",
            ].map((feature) => (
              <div key={feature} className="auth-feature-item">
                <div className="auth-feature-check"><Check /></div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <AnimatedBackground variant="mesh" />
        <div className="auth-form-wrapper animate-fade-in">
          <div className="auth-logo">
            <Link to="/">
              <div className="auth-logo-icon gradient-primary">
                <BrainCircuit style={{ width: "1.75rem", height: "1.75rem", color: "var(--primary-foreground)" }} />
              </div>
              <span className="logo-text" style={{ fontSize: "1.5rem" }}>QuizArena</span>
            </Link>
            <h1 className="auth-title">{step === 1 ? "Create an account" : "Verify Email Code"}</h1>
            <p className="auth-subtitle">
              {step === 1 ? "Enter your details to receive your 6-digit verification code" : `Enter the 6-digit code sent to ${formData.email}`}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius)", background: "hsla(0, 70%, 50%, 0.15)", border: "1px solid hsla(0, 70%, 50%, 0.3)", color: "var(--accent)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius)", background: "hsla(160, 80%, 45%, 0.15)", border: "1px solid hsla(160, 80%, 45%, 0.3)", color: "var(--success)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {infoMessage}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="form-group">
                <label className="label" htmlFor="name">Full Name</label>
                <input id="name" type="text" placeholder="John Doe" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input" />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="email">Email Address</label>
                <input id="email" type="email" placeholder="you@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="input" />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required className="input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-toggle">
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <div className="password-reqs">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="password-req">
                      <div className={`password-req-dot ${req.met ? "met" : "unmet"}`}>{req.met && <Check />}</div>
                      <span style={{ color: req.met ? "var(--foreground)" : "var(--muted-foreground)" }}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-gradient btn-lg btn-full" disabled={isLoading}>
                {isLoading ? "Sending verification code..." : <><span>Get Verification Code</span> <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="auth-form animate-scale-in">
              <div className="form-group" style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "hsla(250, 90%, 65%, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                  <KeyRound style={{ width: 28, height: 28, color: "var(--primary)" }} />
                </div>
                <label className="label" htmlFor="otp" style={{ fontSize: "1rem", fontWeight: 700 }}>6-Digit Code</label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                  required
                  className="input"
                  style={{
                    fontSize: "1.75rem",
                    letterSpacing: "0.5rem",
                    textAlign: "center",
                    fontWeight: 800,
                    padding: "0.75rem",
                    color: "var(--primary)"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <ArrowLeft style={{ width: "0.9rem", height: "0.9rem" }} /> Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isResending}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendTimer > 0 ? "var(--muted-foreground)" : "var(--primary)",
                    cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontWeight: 600
                  }}
                >
                  <RefreshCw style={{ width: "0.9rem", height: "0.9rem" }} className={isResending ? "animate-spin" : ""} />
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
                </button>
              </div>

              <button type="submit" className="btn btn-gradient btn-lg btn-full" disabled={isLoading}>
                {isLoading ? "Verifying & Registering..." : <><span>Verify & Create Account</span> <Check style={{ width: "1.25rem", height: "1.25rem" }} /></>}
              </button>
            </form>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
