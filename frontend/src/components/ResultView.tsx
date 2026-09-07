import React, { useState } from "react"
import type { CalculateResponse } from "@/types"

interface ResultViewProps {
  result: CalculateResponse
  onBackToAssignment: () => void
  onStartOver: () => void
}

/* ── SVG Icons ─────────────────────────────── */
function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function BackIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
}
function SparkleIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 9L20 10.5L13.5 12L12 19L10.5 12L4 10.5L10.5 9Z"/></svg>
}

/* ── Person color palettes ─────────────────── */
const THEMES = [
  { accent: "#818cf8", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.22)",  total: "#a5b4fc" },
  { accent: "#ec4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.22)",  total: "#f9a8d4" },
  { accent: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.22)",   total: "#86efac" },
  { accent: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.22)",   total: "#fde047" },
  { accent: "#0ea5e9", bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.22)",  total: "#7dd3fc" },
  { accent: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.22)",  total: "#fdba74" },
]

export function ResultView({ result, onBackToAssignment, onStartOver }: ResultViewProps) {
  const [copiedMember, setCopiedMember] = useState<string | null>(null)

  const handleCopy = (member: string, total: number, items: string) => {
    navigator.clipboard.writeText(
      `Hey ${member}! Your share of the bill is $${total.toFixed(2)}.\nItems: ${items}`
    )
    setCopiedMember(member)
    setTimeout(() => setCopiedMember(null), 2000)
  }

  const S = {
    card: { borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" },
    sumBox: { borderRadius: 12, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", textAlign: "center" as const },
  }

  return (
    <div className="fade-up" style={{ width: "100%", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Summary header ── */}
      <div style={S.card}>
        <div style={{ padding: "22px 26px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "var(--success-bg)", border: "1px solid rgba(34,211,164,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--success)"
                }}>
                  <CheckIcon />
                </div>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
                  Final split breakdown
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                All items, taxes, tips &amp; discounts calculated proportionally.
              </p>
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 99,
              background: "rgba(255,178,50,0.1)", border: "1px solid rgba(255,178,50,0.25)",
              color: "var(--brand)", fontSize: 12, fontWeight: 700
            }}>
              <SparkleIcon />
              100% Reconciled
            </div>
          </div>

          {/* Summary stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
            <div style={S.sumBox}>
              <div style={{ ...S.label, marginBottom: 6 }}>Subtotal</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
                ${result.total_subtotal.toFixed(2)}
              </div>
            </div>
            <div style={S.sumBox}>
              <div style={{ ...S.label, marginBottom: 6 }}>Taxes</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
                ${result.total_taxes.toFixed(2)}
              </div>
            </div>
            <div style={S.sumBox}>
              <div style={{ ...S.label, marginBottom: 6 }}>Tip / Service</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
                ${result.total_service_charge.toFixed(2)}
              </div>
            </div>
            <div style={S.sumBox}>
              <div style={{ ...S.label, marginBottom: 6 }}>Discounts</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
                −${result.total_discounts.toFixed(2)}
              </div>
            </div>
            <div style={{
              ...S.sumBox,
              background: "rgba(34,211,164,0.07)",
              borderColor: "rgba(34,211,164,0.3)"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--success)", marginBottom: 6 }}>
                Grand Total
              </div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 22, color: "var(--success)" }}>
                ${result.grand_total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "14px 26px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap"
        }}>
          <button className="ss-btn-ghost" onClick={onBackToAssignment} style={{ fontSize: 12 }}>
            <BackIcon /> Adjust assignments
          </button>
          <button className="ss-btn-ghost" onClick={onStartOver} style={{ fontSize: 12 }}>
            <RefreshIcon /> Scan another
          </button>
        </div>
      </div>

      {/* ── Individual receipt cards ── */}
      <div>
        <h3 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Individual receipts — {result.breakdown.length} member{result.breakdown.length !== 1 ? "s" : ""}
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14
        }}>
          {result.breakdown.map((person, idx) => {
            const theme = THEMES[idx % THEMES.length]
            const itemsSummary = person.assigned_items
              .map(i => `${i.name} ($${i.amount.toFixed(2)})`)
              .join(", ")
            const isCopied = copiedMember === person.member

            return (
              <div
                key={person.member}
                className="fade-up"
                style={{
                  animationDelay: `${idx * 0.07}s`,
                  borderRadius: 20, background: "var(--bg-card)",
                  border: `1px solid ${theme.border}`,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)"
                  e.currentTarget.style.boxShadow = `0 12px 40px ${theme.bg}`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: theme.bg, border: `2px solid ${theme.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 18,
                      color: theme.accent
                    }}>
                      {person.member.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                        {person.member}
                      </div>
                      <div style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                        {(person.subtotal_ratio * 100).toFixed(1)}% of subtotal
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(person.member, person.total, itemsSummary)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 7,
                      background: isCopied ? "var(--success-bg)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isCopied ? "rgba(34,211,164,0.3)" : "var(--border)"}`,
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                      color: isCopied ? "var(--success)" : "var(--text-muted)",
                      transition: "all 0.15s"
                    }}
                  >
                    {isCopied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Share</>}
                  </button>
                </div>

                {/* Items list */}
                <div style={{ padding: "14px 18px", flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                    Assigned items ({person.assigned_items.length})
                  </div>

                  <div style={{
                    borderRadius: 10, background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)", overflow: "hidden"
                  }}>
                    {person.assigned_items.length === 0 ? (
                      <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        No items assigned
                      </div>
                    ) : (
                      person.assigned_items.map((item, iIdx) => (
                        <div key={iIdx} style={{
                          padding: "8px 12px",
                          borderTop: iIdx > 0 ? "1px solid var(--border)" : "none",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: theme.accent, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.name}
                            </span>
                            {item.shares > 1 && (
                              <span style={{
                                fontFamily: "'Space Mono'", fontSize: 9, flexShrink: 0,
                                padding: "1px 5px", borderRadius: 4,
                                background: "rgba(255,178,50,0.08)", border: "1px solid rgba(255,178,50,0.18)",
                                color: "var(--brand)"
                              }}>
                                1/{item.shares}
                              </span>
                            )}
                          </div>
                          <span style={{ fontFamily: "'Space Mono'", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Breakdown rows */}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      { label: "Base items",            value: `$${person.base_item_cost.toFixed(2)}`,    prefix: "" },
                      { label: `Tax (${(person.subtotal_ratio*100).toFixed(1)}%)`, value: `+$${person.tax_contribution.toFixed(2)}`,  prefix: "+" },
                      { label: `Tip (${(person.subtotal_ratio*100).toFixed(1)}%)`, value: `+$${person.tip_contribution.toFixed(2)}`,  prefix: "+" },
                      ...(person.discount_contribution > 0 ? [{ label: "Discount share", value: `-$${person.discount_contribution.toFixed(2)}`, prefix: "-" }] : []),
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                        <span style={{
                          fontFamily: "'Space Mono'", fontWeight: 600,
                          color: row.prefix === "-" ? "var(--success)" : "var(--text-secondary)"
                        }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tear-off total */}
                <div style={{
                  borderTop: "1px dashed rgba(255,255,255,0.1)",
                  padding: "12px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: theme.bg
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.accent }}>
                    Total owed
                  </span>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 26, fontWeight: 800, color: theme.total, letterSpacing: "-0.02em" }}>
                    ${person.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
