import React, { useState } from "react"
import type { Bill, CalculateResponse } from "@/types"
import { apiFetch } from "@/lib/api"

interface AssignmentViewProps {
  bill: Bill
  sessionId: string
  onCalculateComplete: (result: CalculateResponse, payerName: string, payerUpiId: string) => void
  onBackToReview: () => void
}



/* ── SVG Icons ──────────────────────────────── */
function UsersIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function UserPlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
}
function XIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function CheckIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function BackIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function CalcIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>
}
function SpinnerIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }}/></svg>
}
function AlertIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}

/* ── Member color themes ─────────────────────── */
const MEMBER_COLORS = [
  { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.35)",  text: "#a5b4fc", dot: "#818cf8" },
  { bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.32)",  text: "#f9a8d4", dot: "#ec4899" },
  { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.32)",   text: "#86efac", dot: "#22c55e" },
  { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.32)",   text: "#fde047", dot: "#eab308" },
  { bg: "rgba(14,165,233,0.12)",  border: "rgba(14,165,233,0.32)",  text: "#7dd3fc", dot: "#0ea5e9" },
  { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.32)",  text: "#fdba74", dot: "#f97316" },
]

export function AssignmentView({ bill, sessionId: _sessionId, onCalculateComplete, onBackToReview }: AssignmentViewProps) {
  const [members, setMembers]           = useState<string[]>(["Alice", "Bob"])
  const [newMemberName, setNewMemberName] = useState("")
  const [assignments, setAssignments]   = useState<Record<number, string[]>>(() => {
    const init: Record<number, string[]> = {}
    bill.items.forEach((_, idx) => { init[idx] = [] })
    return init
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [payerName, setPayerName]       = useState("")
  const [payerUpiId, setPayerUpiId]     = useState("")

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMemberName.trim()
    if (!trimmed) return
    if (members.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the list.`)
      return
    }
    setMembers(prev => [...prev, trimmed])
    setNewMemberName("")
    setError(null)
  }

  const handleRemoveMember = (name: string) => {
    if (members.length <= 1) { setError("You need at least one member."); return }
    setMembers(prev => prev.filter(m => m !== name))
    setAssignments(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(key => {
        next[Number(key)] = (next[Number(key)] || []).filter(m => m !== name)
      })
      return next
    })
  }

  const toggleMemberForItem = (itemIdx: number, memberName: string) => {
    setAssignments(prev => {
      const curr = prev[itemIdx] || []
      return {
        ...prev,
        [itemIdx]: curr.includes(memberName)
          ? curr.filter(m => m !== memberName)
          : [...curr, memberName]
      }
    })
  }

  const handleSelectAllForItem = (itemIdx: number) => {
    setAssignments(prev => {
      const curr = prev[itemIdx] || []
      const allSelected = curr.length === members.length
      return { ...prev, [itemIdx]: allSelected ? [] : [...members] }
    })
  }

  const handleCalculateSplit = async () => {
    setError(null)
    if (members.length === 0) { setError("Please add at least one member."); return }
    const unassigned = bill.items.filter((_, idx) => !assignments[idx]?.length).length
    if (unassigned > 0) {
      setError(`${unassigned} item${unassigned > 1 ? "s are" : " is"} not assigned yet. Assign all items first.`)
      return
    }

    setIsCalculating(true)
    try {
      const formattedAssignments: Record<string, string[]> = {}
      Object.entries(assignments).forEach(([idx, list]) => { formattedAssignments[idx] = list })
      const payload = { bill, members, item_assignments: formattedAssignments, session_id: _sessionId }
      const response = await apiFetch("/api/calculate", {
        method: "POST",
        json: payload,
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error ${response.status}`)
      }
      const data: CalculateResponse = await response.json()
      onCalculateComplete(data, payerName, payerUpiId)
    } catch (err: any) {
      setError(err.message || "Failed to calculate. Check that the backend is running.")
    } finally {
      setIsCalculating(false)
    }
  }

  const totalAssigned = bill.items.filter((_, idx) => assignments[idx]?.length > 0).length
  const assignedFraction = bill.items.length > 0 ? totalAssigned / bill.items.length : 0

  const S = {
    card: { borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" } as React.CSSProperties,
    section: { padding: "20px 24px" } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" },
  }

  return (
    <div className="fade-up" style={{ width: "100%", maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Progress header ── */}
      <div style={S.card}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                Assign items to members
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                Select who had each item — shared items split evenly
              </p>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 8,
              background: "rgba(255,178,50,0.08)", border: "1px solid rgba(255,178,50,0.2)",
              fontFamily: "'Space Mono'", fontSize: 13, fontWeight: 700, color: "var(--brand)"
            }}>
              Total: ${bill.total.toFixed(2)}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={S.label}>Items assigned</span>
              <span style={{ fontFamily: "'Space Mono'", fontSize: 11, color: totalAssigned === bill.items.length ? "var(--success)" : "var(--text-muted)" }}>
                {totalAssigned}/{bill.items.length}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${assignedFraction * 100}%`,
                background: assignedFraction === 1
                  ? "var(--success)"
                  : "linear-gradient(90deg, var(--brand), #ff6b32)",
                transition: "width 0.35s cubic-bezier(0.22,1,0.36,1)"
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Members panel ── */}
      <div style={S.card}>
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ color: "var(--brand)" }}><UsersIcon /></span>
            <span style={S.label}>Group members ({members.length})</span>
          </div>

          {/* Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {members.map((member, idx) => {
              const c = MEMBER_COLORS[idx % MEMBER_COLORS.length]
              return (
                <div key={member} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 10px 6px 8px",
                  borderRadius: 99, border: `1px solid ${c.border}`, background: c.bg,
                  fontWeight: 600, fontSize: 13, color: c.text
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                  {member}
                  <button
                    onClick={() => handleRemoveMember(member)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: c.text, opacity: 0.6, padding: 2, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: 4, transition: "opacity 0.15s"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                    title={`Remove ${member}`}
                  >
                    <XIcon />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add member form */}
          <form onSubmit={handleAddMember} style={{ display: "flex", gap: 8, maxWidth: 340 }}>
            <input
              className="ss-input"
              type="text"
              placeholder="Add a name (e.g. Charlie)"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              style={{ flex: 1, height: 38 }}
            />
            <button type="submit" className="ss-btn-primary" style={{ height: 38, padding: "0 14px", flexShrink: 0 }}>
              <UserPlusIcon /> Add
            </button>
          </form>
        </div>
      </div>

      {/* ── Who Paid? panel ── */}
      <div style={S.card}>
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>💳</span>
            <span style={S.label}>Who paid the bill?</span>
            <span style={{
              marginLeft: 4, fontSize: 10, fontWeight: 600, padding: "2px 7px",
              borderRadius: 99, background: "rgba(255,178,50,0.1)",
              border: "1px solid rgba(255,178,50,0.2)", color: "var(--brand)"
            }}>Optional</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
            Set this to generate instant UPI payment QR codes so others can pay the person who covered the bill.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}>
              <label style={{ ...S.label, display: "block", marginBottom: 6 }}>Paid by</label>
              <select
                className="ss-input"
                value={payerName}
                onChange={e => setPayerName(e.target.value)}
                style={{ width: "100%", height: 38 }}
              >
                <option value="">— No one selected —</option>
                {members.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <label style={{ ...S.label, display: "block", marginBottom: 6 }}>UPI / Payment ID</label>
              <input
                className="ss-input"
                type="text"
                placeholder="e.g. alice@upi or +91-9876543210"
                value={payerUpiId}
                onChange={e => setPayerUpiId(e.target.value)}
                style={{ width: "100%", height: 38 }}
              />
            </div>
          </div>
          {payerName && payerUpiId && (
            <div style={{
              marginTop: 12, padding: "8px 12px", borderRadius: 8,
              background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
              fontSize: 12, color: "var(--success)", fontWeight: 500
            }}>
              ✓ QR codes will appear in results — others can scan to pay <strong>{payerName}</strong> instantly.
            </div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fade-up" style={{
          borderRadius: 12, background: "var(--danger-bg)",
          border: "1px solid rgba(248,113,113,0.25)",
          padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10,
          color: "var(--danger)"
        }}>
          <AlertIcon />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── Item assignment list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bill.items.map((item, idx) => {
          const assigned = assignments[idx] || []
          const numAssigned = assigned.length
          const perPerson = numAssigned > 0 ? item.price / numAssigned : 0
          const isAllSelected = numAssigned === members.length
          const isUnassigned = numAssigned === 0

          return (
            <div
              key={idx}
              className="fade-up"
              style={{
                animationDelay: `${idx * 0.04}s`,
                borderRadius: 16, background: "var(--bg-card)",
                border: `1px solid ${isUnassigned ? "rgba(245,158,11,0.35)" : "var(--border)"}`,
                padding: "14px 18px",
                transition: "border-color 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: "'Space Mono'", fontSize: 10, color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4,
                    border: "1px solid var(--border)", flexShrink: 0
                  }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{item.name}</span>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                      ×{item.quantity}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                    ${item.price.toFixed(2)}
                  </span>
                  {numAssigned > 0 && (
                    <span style={{
                      fontFamily: "'Space Mono'", fontSize: 11,
                      padding: "3px 8px", borderRadius: 6,
                      background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
                      color: "#c4b5fd"
                    }}>
                      ${perPerson.toFixed(2)}/person
                    </span>
                  )}
                  <button
                    onClick={() => handleSelectAllForItem(idx)}
                    style={{
                      background: isAllSelected ? "rgba(255,178,50,0.1)" : "none",
                      border: `1px solid ${isAllSelected ? "rgba(255,178,50,0.3)" : "var(--border)"}`,
                      borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                      fontSize: 11, fontWeight: 600,
                      color: isAllSelected ? "var(--brand)" : "var(--text-muted)",
                      transition: "all 0.15s"
                    }}
                  >
                    {isAllSelected ? "Clear" : "All"}
                  </button>
                </div>
              </div>

              {/* Member toggles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {members.map((member, mIdx) => {
                  const isSelected = assigned.includes(member)
                  const c = MEMBER_COLORS[mIdx % MEMBER_COLORS.length]
                  return (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleMemberForItem(idx, member)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                        fontWeight: 600, fontSize: 12,
                        background: isSelected ? c.bg : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isSelected ? c.border : "var(--border)"}`,
                        color: isSelected ? c.text : "var(--text-muted)",
                        transition: "all 0.15s",
                        transform: isSelected ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid ${isSelected ? c.dot : "rgba(255,255,255,0.15)"}`,
                        background: isSelected ? c.dot : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 0.15s"
                      }}>
                        {isSelected && <span style={{ color: "#08080e" }}><CheckIcon /></span>}
                      </span>
                      {member}
                    </button>
                  )
                })}
              </div>

              {isUnassigned && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--warning)", fontWeight: 500 }}>
                  ⚠ Assign this item to at least one person
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, flexWrap: "wrap", paddingTop: 4
      }}>
        <button className="ss-btn-ghost" onClick={onBackToReview}>
          <BackIcon /> Back to review
        </button>
        <button
          className="ss-btn-primary"
          onClick={handleCalculateSplit}
          disabled={isCalculating}
          style={{ height: 46, padding: "0 28px", fontSize: 14 }}
        >
          {isCalculating ? (
            <><SpinnerIcon /> Calculating...</>
          ) : (
            <><CalcIcon /> Calculate split</>
          )}
        </button>
      </div>
    </div>
  )
}
