import { useState } from "react"
import { UploadView } from "@/components/UploadView"
import { ReviewView } from "@/components/ReviewView"
import { AssignmentView } from "@/components/AssignmentView"
import { ResultView } from "@/components/ResultView"
import type { Bill, CalculateResponse } from "@/types"

type AppPhase = "upload" | "review" | "assignment" | "result"

const STEPS: { id: AppPhase; label: string; short: string }[] = [
  { id: "upload",     label: "Upload",  short: "01" },
  { id: "review",     label: "Review",  short: "02" },
  { id: "assignment", label: "Assign",  short: "03" },
  { id: "result",     label: "Result",  short: "04" },
]

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  )
}

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [billData, setBillData]   = useState<Bill | null>(null)
  const [splitResult, setSplitResult] = useState<CalculateResponse | null>(null)
  const [phase, setPhase] = useState<AppPhase>("upload")

  const handleScanComplete = (id: string, data: Bill) => {
    setSessionId(id)
    setBillData(data)
    setPhase("review")
  }

  const handleConfirmAccuracy = (verifiedBill: Bill) => {
    setBillData(verifiedBill)
    setPhase("assignment")
  }

  const handleCalculateComplete = (result: CalculateResponse) => {
    setSplitResult(result)
    setPhase("result")
  }

  const handleReset = () => {
    setSessionId(null)
    setBillData(null)
    setSplitResult(null)
    setPhase("upload")
  }

  const phaseIndex = STEPS.findIndex(s => s.id === phase)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* ── Ambient glow orbs ────────────────── */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0
      }}>
        <div style={{
          position: "absolute", top: "-15%", left: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,178,50,0.07) 0%, transparent 70%)",
          filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "0%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          filter: "blur(40px)"
        }} />
      </div>

      {/* ── Navbar ───────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,8,14,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 20px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          {/* Logo */}
          <button
            onClick={handleReset}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer", padding: 0
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#08080e", flexShrink: 0
            }}>
              <ReceiptIcon />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                SplitSnap
              </span>
              <span style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "var(--brand)", opacity: 0.8, letterSpacing: "0.04em" }}>
                AI ✦ Gemini Flash
              </span>
            </div>
          </button>

          {/* Steps pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: 40,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)"
          }}>
            {STEPS.map((step, idx) => {
              const done   = idx < phaseIndex
              const active = idx === phaseIndex
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div
                    className={`step-dot ${active ? "step-dot-active" : done ? "step-dot-done" : "step-dot-idle"}`}
                    title={step.label}
                  >
                    {done ? "✓" : step.short}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ width: 16, height: 1, background: active || done ? "rgba(255,178,50,0.3)" : "var(--border)" }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Live dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sessionId && (
              <span style={{
                fontFamily: "'Space Mono'", fontSize: 10, color: "var(--text-muted)",
                padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)"
              }}>
                #{sessionId.slice(-5)}
              </span>
            )}
            <div className="pulse-dot" style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--success)"
            }} />
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────── */}
      <main style={{
        flex: 1, position: "relative", zIndex: 1,
        maxWidth: 1100, width: "100%", margin: "0 auto",
        padding: "48px 20px"
      }}>
        {phase === "upload" && (
          <div className="fade-up" style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
            {/* Hero text */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px 4px 8px", borderRadius: 40,
                background: "var(--brand-dim)", border: "1px solid rgba(255,178,50,0.2)",
                marginBottom: 20
              }}>
                <span style={{ fontSize: 11, background: "var(--brand)", color: "#08080e", borderRadius: 40, padding: "1px 6px", fontWeight: 700 }}>NEW</span>
                <span style={{ fontSize: 12, color: "var(--brand)", fontFamily: "'Space Mono'" }}>Gemini 2.5 Flash powered extraction</span>
              </div>

              <h1 style={{
                fontFamily: "'Space Grotesk'", fontWeight: 700,
                fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.1,
                letterSpacing: "-0.03em", color: "var(--text-primary)",
                margin: "0 0 14px"
              }}>
                Split any bill,{" "}
                <span className="text-brand-gradient">no arguments.</span>
              </h1>
              <p style={{
                fontSize: 16, color: "var(--text-secondary)", maxWidth: 420,
                margin: "0 auto", lineHeight: 1.7
              }}>
                Snap or upload your receipt. Our AI extracts every line item
                instantly — then you assign and split fairly.
              </p>
            </div>

            <UploadView onScanComplete={handleScanComplete} />

            {/* Feature strip */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 32
            }}>
              {[
                { emoji: "⚡", text: "Sub-second AI scan" },
                { emoji: "✏️", text: "Editable line items" },
                { emoji: "⚖️", text: "Proportional splits" },
              ].map(f => (
                <div key={f.text} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderRadius: 12, background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)"
                }}>
                  <span style={{ fontSize: 18 }}>{f.emoji}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "review" && billData && sessionId && (
          <ReviewView
            initialBill={billData}
            sessionId={sessionId}
            onConfirmAccuracy={handleConfirmAccuracy}
            onBackToUpload={handleReset}
          />
        )}

        {phase === "assignment" && billData && sessionId && (
          <AssignmentView
            bill={billData}
            sessionId={sessionId}
            onCalculateComplete={handleCalculateComplete}
            onBackToReview={() => setPhase("review")}
          />
        )}

        {phase === "result" && splitResult && (
          <ResultView
            result={splitResult}
            onBackToAssignment={() => setPhase("assignment")}
            onStartOver={handleReset}
          />
        )}
      </main>

      {/* ── Footer ───────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "16px 20px",
        textAlign: "center", position: "relative", zIndex: 1
      }}>
        <span style={{ fontFamily: "'Space Mono'", fontSize: 11, color: "var(--text-muted)" }}>
          SplitSnap © 2026 — Built with Gemini Flash
        </span>
      </footer>
    </div>
  )
}

export default App
