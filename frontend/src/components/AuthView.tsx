import React, { useState } from "react"
import { apiFetch } from "@/lib/api"
import { setToken, setStoredEmail } from "@/lib/auth"

interface AuthViewProps {
  onAuthSuccess: (token: string, email: string) => void
}

/* ── Inline SVG icons ─────────────────────────────────────────── */
function ReceiptIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }} />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

type AuthMode = "login" | "register"

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchMode = (m: AuthMode) => {
    setMode(m)
    setError(null)
    setEmail("")
    setPassword("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError("Please enter your email address."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }

    setIsLoading(true)
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
      const res = await apiFetch(endpoint, { method: "POST", json: { email: email.trim(), password } })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || `Error ${res.status}`)
      }

      const token: string = data.access_token
      setToken(token)
      setStoredEmail(email.trim())
      onAuthSuccess(token, email.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", position: "relative"
    }}>
      {/* Ambient glow orbs */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,178,50,0.09) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: 16,
            background: "var(--brand)", color: "#08080e", marginBottom: 14,
            boxShadow: "0 8px 32px rgba(255,178,50,0.3)"
          }}>
            <ReceiptIcon />
          </div>
          <h1 style={{ margin: "0 0 6px", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
            SplitSnap
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            AI-powered bill splitting — no arguments.
          </p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 22, background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          overflow: "hidden"
        }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "4px" }}>
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "9px 0", border: "none", borderRadius: 12,
                  cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.01em",
                  transition: "all 0.2s",
                  background: mode === m ? "rgba(255,178,50,0.12)" : "transparent",
                  color: mode === m ? "var(--brand)" : "var(--text-muted)",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "28px 28px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  <MailIcon />
                </span>
                <input
                  id="auth-email"
                  className="ss-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 36, height: 44 }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                Password {mode === "register" && <span style={{ fontWeight: 500, textTransform: "none", color: "var(--text-muted)" }}>(min 6 chars)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  <LockIcon />
                </span>
                <input
                  id="auth-password"
                  className="ss-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 36, paddingRight: 40, height: 44 }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4
                  }}
                  tabIndex={-1}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="fade-up" style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                padding: "10px 12px", borderRadius: 10, marginBottom: 18,
                background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.25)",
                color: "var(--danger)", fontSize: 13, fontWeight: 500
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><AlertIcon /></span>
                {error}
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              className="ss-btn-primary"
              disabled={isLoading}
              style={{ width: "100%", height: 48, fontSize: 15, borderRadius: 14 }}
            >
              {isLoading ? (
                <><SpinnerIcon />{mode === "login" ? "Signing in…" : "Creating account…"}</>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--text-muted)", fontFamily: "'Space Mono'" }}>
          Powered by Gemini 2.5 Flash · SplitSnap © 2026
        </p>
      </div>
    </div>
  )
}
