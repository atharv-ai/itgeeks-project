import { useState } from "react"
import type { Bill, LineItem } from "@/types"

interface ReviewViewProps {
  initialBill: Bill
  sessionId: string
  onConfirmAccuracy: (verifiedBill: Bill) => void
  onBackToUpload: () => void
}

/* ── Inline SVG icons ──────────────────────────── */
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}
function ArrowRightIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
}
function BackIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function WarningIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function HelpIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}

/* ── Inline input ─────────────────────────────── */
function FieldInput({
  type = "text", value, onChange, placeholder, className = "", style = {}
}: {
  type?: string
  value: string | number
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`ss-input ${className}`}
      style={style}
    />
  )
}

export function ReviewView({ initialBill, sessionId, onConfirmAccuracy, onBackToUpload }: ReviewViewProps) {
  const [items, setItems]               = useState<LineItem[]>(initialBill.items || [])
  const [taxes, setTaxes]               = useState<number>(initialBill.taxes || 0)
  const [serviceCharge, setServiceCharge] = useState<number>(initialBill.service_charge || 0)
  const [discounts, setDiscounts]       = useState<number>(initialBill.discounts || 0)

  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  const computedTotal    = Math.max(0, computedSubtotal + taxes + serviceCharge - discounts)
  const lowConfCount     = items.filter(i => (i.confidence_score ?? 1.0) < 0.8).length

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const curr = { ...next[index] }
      if (field === "name")     curr.name = String(value)
      if (field === "quantity") curr.quantity = parseFloat(String(value)) || 0
      if (field === "price")    curr.price = parseFloat(String(value)) || 0
      curr.confidence_score = 1.0
      next[index] = curr
      return next
    })
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: "New Item", quantity: 1, price: 0, confidence_score: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    onConfirmAccuracy({
      items,
      subtotal: Math.round(computedSubtotal * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      service_charge: Math.round(serviceCharge * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      total: Math.round(computedTotal * 100) / 100,
      overall_confidence: lowConfCount === 0 ? 1.0 : initialBill.overall_confidence,
    })
  }

  const S = {
    card: {
      borderRadius: 20, background: "var(--bg-card)",
      border: "1px solid var(--border)", overflow: "hidden"
    } as React.CSSProperties,
    cardHeader: {
      padding: "20px 24px", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12
    },
    section: { padding: "20px 24px" } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" },
    tableHead: {
      display: "grid", gridTemplateColumns: "1fr 80px 100px 36px",
      gap: 8, padding: "8px 12px",
      background: "rgba(255,255,255,0.02)", borderRadius: 8,
      marginBottom: 6
    },
    thCell: { fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-muted)", textTransform: "uppercase" as const },
    row: (isLow: boolean): React.CSSProperties => ({
      display: "grid", gridTemplateColumns: "1fr 80px 100px 36px",
      gap: 8, padding: "6px 8px", borderRadius: 10, alignItems: "center",
      border: `1px solid ${isLow ? "rgba(245,158,11,0.4)" : "transparent"}`,
      background: isLow ? "rgba(245,158,11,0.04)" : "transparent",
      transition: "background 0.15s"
    }),
    totalsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
      gap: 10
    } as React.CSSProperties,
    totalBox: {
      borderRadius: 12, border: "1px solid var(--border)",
      background: "rgba(255,255,255,0.02)", padding: "12px 14px"
    } as React.CSSProperties,
  }

  return (
    <div className="fade-up" style={{ width: "100%", maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header card ── */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Review extracted items
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Space Mono'" }}>
              session {sessionId.slice(-8)}
            </p>
          </div>

          {lowConfCount > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, background: "var(--warning-bg)",
              border: "1px solid rgba(245,158,11,0.3)", color: "var(--warning)"
            }}>
              <WarningIcon />
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {lowConfCount} item{lowConfCount > 1 ? "s" : ""} need review
              </span>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, background: "var(--success-bg)",
              border: "1px solid rgba(34,211,164,0.3)", color: "var(--success)"
            }}>
              <CheckIcon />
              <span style={{ fontSize: 12, fontWeight: 600 }}>All high confidence</span>
            </div>
          )}
        </div>

        {/* Hint */}
        <div style={{
          padding: "12px 24px",
          display: "flex", alignItems: "flex-start", gap: 10,
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.01)"
        }}>
          <span style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }}><HelpIcon /></span>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-primary)" }}>Edit freely.</strong> Items with{" "}
            <span style={{ color: "var(--warning)", fontWeight: 600 }}>amber borders</span> have AI confidence below 80%.
            Click any field to correct it.
          </p>
        </div>

        {/* Items table */}
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={S.label}>Line items ({items.length})</span>
            <button
              className="ss-btn-ghost"
              onClick={handleAddItem}
              style={{ height: 30, fontSize: 12, padding: "0 12px", gap: 5, color: "var(--brand)", borderColor: "rgba(255,178,50,0.25)" }}
            >
              <PlusIcon /> Add item
            </button>
          </div>

          {/* Desktop table header */}
          <div style={S.tableHead} className="hidden-mobile">
            <div style={S.thCell}>Item</div>
            <div style={{ ...S.thCell, textAlign: "center" }}>Qty</div>
            <div style={{ ...S.thCell, textAlign: "right" }}>Price</div>
            <div style={S.thCell} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {items.map((item, index) => {
              const confidence = item.confidence_score ?? 1.0
              const isLow = confidence < 0.8
              return (
                <div key={index} style={S.row(isLow)}>
                  {/* Name */}
                  <div style={{ position: "relative" }}>
                    <FieldInput
                      value={item.name}
                      onChange={v => handleItemChange(index, "name", v)}
                      placeholder="Item name"
                      style={{
                        borderColor: isLow ? "rgba(245,158,11,0.5)" : undefined,
                        paddingRight: isLow ? 30 : undefined
                      }}
                    />
                    {isLow && (
                      <span style={{
                        position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                        color: "var(--warning)"
                      }} title={`${(confidence * 100).toFixed(0)}% confidence`}>
                        <WarningIcon />
                      </span>
                    )}
                  </div>

                  {/* Qty */}
                  <FieldInput
                    type="number"
                    value={item.quantity}
                    onChange={v => handleItemChange(index, "quantity", v)}
                    style={{ textAlign: "center" }}
                  />

                  {/* Price */}
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                      fontFamily: "'Space Mono'", fontSize: 12, color: "var(--text-muted)"
                    }}>$</span>
                    <FieldInput
                      type="number"
                      value={item.price}
                      onChange={v => handleItemChange(index, "price", v)}
                      style={{ textAlign: "right", paddingLeft: 22, fontFamily: "'Space Mono'" }}
                    />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "none", border: "1px solid transparent",
                      cursor: "pointer", color: "var(--text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "var(--danger-bg)"
                      e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"
                      e.currentTarget.style.color = "var(--danger)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "none"
                      e.currentTarget.style.borderColor = "transparent"
                      e.currentTarget.style.color = "var(--text-muted)"
                    }}
                    title="Remove item"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 24px" }} />

        {/* Totals */}
        <div style={S.section}>
          <span style={{ ...S.label, display: "block", marginBottom: 12 }}>Adjustments &amp; totals</span>
          <div style={S.totalsGrid}>
            {/* Subtotal (read-only) */}
            <div style={S.totalBox}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Subtotal</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
                ${computedSubtotal.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>auto-computed</div>
            </div>

            {/* Taxes */}
            <div style={S.totalBox}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Taxes ($)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "'Space Mono'", fontSize: 11, color: "var(--text-muted)" }}>$</span>
                <input type="number" min="0" step="0.01" value={taxes}
                  onChange={e => setTaxes(parseFloat(e.target.value) || 0)}
                  className="ss-input" style={{ paddingLeft: 22, fontFamily: "'Space Mono'", textAlign: "right", height: 36 }}
                />
              </div>
            </div>

            {/* Tip */}
            <div style={S.totalBox}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Tip / Service ($)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "'Space Mono'", fontSize: 11, color: "var(--text-muted)" }}>$</span>
                <input type="number" min="0" step="0.01" value={serviceCharge}
                  onChange={e => setServiceCharge(parseFloat(e.target.value) || 0)}
                  className="ss-input" style={{ paddingLeft: 22, fontFamily: "'Space Mono'", textAlign: "right", height: 36 }}
                />
              </div>
            </div>

            {/* Discounts */}
            <div style={S.totalBox}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Discounts ($)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "'Space Mono'", fontSize: 11, color: "var(--text-muted)" }}>$</span>
                <input type="number" min="0" step="0.01" value={discounts}
                  onChange={e => setDiscounts(parseFloat(e.target.value) || 0)}
                  className="ss-input" style={{ paddingLeft: 22, fontFamily: "'Space Mono'", textAlign: "right", height: 36 }}
                />
              </div>
            </div>

            {/* Grand total */}
            <div style={{
              ...S.totalBox,
              background: "rgba(34,211,164,0.06)",
              borderColor: "rgba(34,211,164,0.25)"
            }}>
              <div style={{ fontSize: 11, color: "var(--success)", marginBottom: 4, fontWeight: 600 }}>Grand Total</div>
              <div style={{ fontFamily: "'Space Mono'", fontWeight: 700, fontSize: 24, color: "var(--success)" }}>
                ${computedTotal.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: "rgba(34,211,164,0.6)", marginTop: 2 }}>subtotal + tax + tip − disc</div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap"
        }}>
          <button className="ss-btn-ghost" onClick={onBackToUpload}>
            <BackIcon /> Re-upload photo
          </button>
          <button
            className="ss-btn-primary"
            onClick={handleConfirm}
            style={{ height: 46, padding: "0 28px", fontSize: 14 }}
          >
            Confirm &amp; Assign items <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
