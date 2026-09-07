import { useState, useRef } from "react"
import { UploadCloud, Image as ImageIcon, X, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Bill, ExtractResponse, SelectedFile } from "@/types"

interface UploadViewProps {
  onScanComplete: (sessionId: string, data: Bill) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function UploadView({ onScanComplete }: UploadViewProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (id: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl)
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleScanBill = async () => {
    if (selectedFiles.length === 0) {
      setError("Please add at least one receipt image before scanning.")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      selectedFiles.forEach(({ file }) => {
        formData.append("files", file)
      })
      formData.append("session_name", `Bill - ${new Date().toLocaleDateString()}`)

      const response = await fetch(`${API_BASE_URL}/api/extract`, {
        method: "POST",
        body: formData,
      })

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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Drag and Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all duration-200 flex flex-col items-center justify-center text-center backdrop-blur-sm ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 bg-card/50 hover:bg-card/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-200">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Upload receipt photos
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Drag & drop photos here, or click to browse. Multiple photos or multi-page receipts supported.
        </p>

        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs font-normal">JPG</Badge>
          <Badge variant="outline" className="text-xs font-normal">PNG</Badge>
          <Badge variant="outline" className="text-xs font-normal">WEBP</Badge>
          <Badge variant="outline" className="text-xs font-normal">Multi-Page</Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3 text-destructive animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Preview Thumbnails */}
      {selectedFiles.length > 0 && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "Image" : "Images"} Ready
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="text-xs h-7 text-primary hover:text-primary"
              >
                + Add more
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedFiles.map(({ id, file, previewUrl }) => (
                <div
                  key={id}
                  className="relative group rounded-xl overflow-hidden border border-border bg-muted/40 aspect-[4/3] flex items-center justify-center shadow-xs"
                >
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(id, previewUrl)
                      }}
                      disabled={isScanning}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                    <p className="text-[11px] font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-white/70">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scan Button */}
            <div className="pt-2">
              <Button
                onClick={handleScanBill}
                disabled={isScanning || selectedFiles.length === 0}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-md transition-all"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Extracting receipt with Gemini 3.1 Flash Lite...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Scan Bill ({selectedFiles.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
