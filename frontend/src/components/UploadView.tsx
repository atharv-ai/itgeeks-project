import { useState, useRef } from "react"
import type { Bill, ExtractResponse, SelectedFile } from "@/types"

interface UploadViewProps {
  onScanComplete: (sessionId: string, data: Bill) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

/* ── Mini icon components ──────────────────────── */
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }} />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
      <path d="M19 2 L19.75 5 L22.75 5.75 L19.75 6.5 L19 9.5 L18.25 6.5 L15.25 5.75 L18.25 5 Z" opacity="0.7" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export function UploadView({ onScanComplete }: UploadViewProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging]       = useState(false)
  const [isScanning, setIsScanning]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | File[]) => {
    setError(null)
    const newSelected: SelectedFile[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        newSelected.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })
      }
    })
    if (newSelected.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP) or PDF receipts.")
      return
    }
    setSelectedFiles((prev) => [...prev, ...newSelected])
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl)
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleScanBill = async () => {
    if (selectedFiles.length === 0) { setError("Please add at least one receipt image."); return }
    setIsScanning(true)
    setError(null)
    try {
      const formData = new FormData()
      selectedFiles.forEach(({ file }) => formData.append("files", file))
      formData.append("session_name", `Bill - ${new Date().toLocaleDateString()}`)
      const response = await fetch(`${API_BASE_URL}/api/extract`, { method: "POST", body: formData })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server returned status ${response.status}`)
      }
      const data: ExtractResponse = await response.json()
      onScanComplete(data.session_id, data.extracted_data)
    } catch (err: any) {
      setError(err.message || "Failed to scan receipt. Please ensure backend is running.")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="fade-up">
      {/* ── Drop zone ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        style={{
          position: "relative",
          borderRadius: 20,
          border: `2px dashed ${isDragging ? "var(--brand)" : "rgba(255,255,255,0.12)"}`,
          background: isDragging
            ? "var(--brand-dim)"
            : "rgba(255,255,255,0.018)",
          padding: "48px 32px",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", textAlign: "center",
          cursor: isScanning ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          overflow: "hidden"
        }}
      >
        {/* Animated corner dots */}
        {[["0", "0"], ["0", "auto"], ["auto", "0"], ["auto", "auto"]].map(([t, r], i) => (
          <div key={i} aria-hidden style={{
            position: "absolute", top: t === "0" ? 12 : "auto", bottom: t === "auto" ? 12 : "auto",
            left: r === "0" ? 12 : "auto", right: r === "auto" ? 12 : "auto",
            width: 6, height: 6, borderRadius: "50%",
            background: isDragging ? "var(--brand)" : "rgba(255,255,255,0.15)",
            transition: "all 0.2s"
          }} />
        ))}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files) }}
        />

        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: isDragging ? "var(--brand-dim)" : "rgba(255,178,50,0.08)",
          border: `1px solid ${isDragging ? "rgba(255,178,50,0.5)" : "rgba(255,178,50,0.15)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--brand)", marginBottom: 16,
          transition: "all 0.2s",
          transform: isDragging ? "scale(1.1)" : "scale(1)"
        }}>
          <UploadIcon />
        </div>

        <p style={{ fontWeight: 600, fontSize: 17, margin: "0 0 6px", color: "var(--text-primary)" }}>
          {isDragging ? "Drop it here!" : "Drag your receipt here"}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          or click to browse — JPG, PNG, WEBP, PDF supported
        </p>

        <div style={{ display: "flex", gap: 6 }}>
          {["JPG", "PNG", "WEBP", "PDF"].map(fmt => (
            <span key={fmt} style={{
              fontFamily: "'Space Mono'", fontSize: 10, fontWeight: 700,
              padding: "3px 8px", borderRadius: 5,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)", letterSpacing: "0.05em"
            }}>{fmt}</span>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fade-up" style={{
          marginTop: 12, borderRadius: 12,
          background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.25)",
          padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10,
          color: "var(--danger)"
        }}>
          <AlertIcon />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* ── File Previews ── */}
      {selectedFiles.length > 0 && (
        <div className="fade-up" style={{
          marginTop: 16, borderRadius: 18,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          padding: 16, display: "flex", flexDirection: "column", gap: 14
        }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {selectedFiles.length} {selectedFiles.length === 1 ? "image" : "images"} ready
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              disabled={isScanning}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "var(--brand)", fontWeight: 600, fontFamily: "'Space Grotesk'"
              }}
            >
              + Add more
            </button>
          </div>

          {/* Thumbnails */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
            {selectedFiles.map(({ id, file, previewUrl }) => (
              <div key={id} style={{
                position: "relative", borderRadius: 12,
                overflow: "hidden", aspectRatio: "4/3",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)"
              }}>
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Hover overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(8,8,14,0.65)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: 0,
                  transition: "opacity 0.15s"
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(id, previewUrl) }}
                    disabled={isScanning}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--danger-bg)", border: "1px solid rgba(248,113,113,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "var(--danger)"
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
                {/* File name */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  padding: "10px 6px 5px"
                }}>
                  <p style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Scan button */}
          <button
            className="ss-btn-primary"
            onClick={handleScanBill}
            disabled={isScanning || selectedFiles.length === 0}
            style={{ width: "100%", height: 50, fontSize: 15, borderRadius: 14 }}
          >
            {isScanning ? (
              <>
                <SpinnerIcon />
                Extracting with Gemini Flash...
              </>
            ) : (
              <>
                <SparkleIcon />
                Scan {selectedFiles.length} receipt{selectedFiles.length > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state CTA */}
      {selectedFiles.length === 0 && !isScanning && (
        <button
          className="ss-btn-primary"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: "100%", height: 50, marginTop: 14, fontSize: 15, borderRadius: 14 }}
        >
          <UploadIcon />
          Choose receipt photos
        </button>
      )}
    </div>
  )
}
