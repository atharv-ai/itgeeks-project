import { useState, useEffect } from "react"
import type { BillSummary } from "@/types"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardViewProps {
  userEmail: string
  onStartNewBill: () => void
  onLogout: () => void
}

/* ── Icons ────────────────────────────────────────────────────── */
function ReceiptIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

/* ── Status chip ──────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  calculated: { bg: "rgba(34,211,164,0.1)",  color: "var(--success)",  label: "Calculated" },
  extracted:  { bg: "rgba(255,178,50,0.1)",  color: "var(--brand)",    label: "Extracted"  },
  created:    { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)", label: "Draft"   },
}
function statusStyle(s: string) {
  return STATUS_STYLES[s] ?? STATUS_STYLES.created
}

/* ── Skeleton card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 18, background: "var(--bg-card)", border: "1px solid var(--border)",
      padding: 20, display: "flex", flexDirection: "column", gap: 12
    }}>
      {[80, 50, 100].map(w => (
        <div key={w} className="shimmer" style={{
          height: 12, borderRadius: 6, width: `${w}%`,
          background: "rgba(255,255,255,0.06)"
        }} />
      ))}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────── */
export function DashboardView({ userEmail, onStartNewBill, onLogout }: DashboardViewProps) {
  const [bills, setBills] = useState<BillSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/bills/history")
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: BillSummary[] = await res.json()
      setBills(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const totalSpent = bills.reduce((s, b) => s + (b.grand_total ?? 0), 0)
  const lastDate = bills[0]?.created_at
    ? new Date(bills[0].created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null

  return (
    <div className="fade-up" style={{ width: "100%", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{
        borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border)",
        padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: "var(--brand-dim)",
              border: "1px solid rgba(255,178,50,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--brand)"
            }}>
              <ReceiptIcon size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                Your Bills
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Space Mono'", marginTop: 1 }}>
                {userEmail}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="ss-btn-primary"
            onClick={onStartNewBill}
            style={{ height: 40, padding: "0 18px", fontSize: 13 }}
            id="dashboard-new-bill"
          >
            <PlusIcon /> New Bill
          </button>
          <button
            className="ss-btn-ghost"
            onClick={onLogout}
            style={{ height: 40, padding: "0 14px", fontSize: 13 }}
            id="dashboard-logout"
          >
            <LogOutIcon /> Logout
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {!loading && bills.length > 0 && (
        <div className="fade-up-delay-1" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12
        }}>
          {[
            { label: "Total Bills", value: bills.length.toString(), icon: <ReceiptIcon />, color: "var(--brand)" },
            { label: "Total Spent", value: `₹${totalSpent.toFixed(2)}`, icon: <TrendUpIcon />, color: "var(--success)" },
            { label: "Last Split", value: lastDate ?? "—", icon: <CalendarIcon />, color: "var(--violet)" },
          ].map(stat => (
            <div key={stat.label} style={{
              borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)",
              padding: "14px 16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: stat.color }}>
                {stat.icon}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section heading ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Bill History
        </h3>
        {!loading && (
          <button
            onClick={fetchHistory}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
              background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
              fontFamily: "'Space Grotesk'", fontWeight: 600, padding: "4px 8px",
              borderRadius: 6, transition: "color 0.15s"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <RefreshIcon /> Refresh
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fade-up" style={{
          borderRadius: 12, background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.25)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, color: "var(--danger)"
        }}>
          <AlertIcon />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && bills.length === 0 && (
        <div className="fade-up" style={{
          borderRadius: 20, border: "2px dashed var(--border)",
          padding: "60px 40px", textAlign: "center"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(255,178,50,0.08)", border: "1px solid rgba(255,178,50,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--brand)", margin: "0 auto 16px"
          }}>
            <ReceiptIcon size={24} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
            No bills yet
          </h3>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
            Snap a receipt and split it in seconds.
          </p>
          <button className="ss-btn-primary" onClick={onStartNewBill} style={{ height: 44, padding: "0 24px" }}>
            <PlusIcon /> Scan your first bill
          </button>
        </div>
      )}

      {/* ── Bill cards grid ── */}
      {!loading && bills.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {bills.map((bill, idx) => {
            const ss = statusStyle(bill.status)
            const date = new Date(bill.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })
            const time = new Date(bill.created_at).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true
            })

            return (
              <Card
                key={bill.session_id}
                className="fade-up"
                style={{
                  animationDelay: `${idx * 0.04}s`,
                  borderRadius: 18, background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default"
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                }}
              >
                <CardHeader style={{ padding: "16px 18px 0" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <CardTitle style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                      {bill.session_name || "Untitled Session"}
                    </CardTitle>
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                      padding: "3px 9px", borderRadius: 99,
                      background: ss.bg, color: ss.color, textTransform: "uppercase"
                    }}>
                      {ss.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent style={{ padding: "12px 18px 18px" }}>
                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                      <CalendarIcon /> {date} · {time}
                    </span>
                    {bill.member_count != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                        <UsersIcon /> {bill.member_count} {bill.member_count === 1 ? "person" : "people"}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,178,50,0.06)", border: "1px solid rgba(255,178,50,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Grand Total
                    </span>
                    <span style={{ fontFamily: "'Space Mono'", fontWeight: 800, fontSize: 18, color: "var(--brand)" }}>
                      {bill.grand_total != null ? `₹${bill.grand_total.toFixed(2)}` : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
