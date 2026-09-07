import { useState } from "react"
import { Receipt } from "lucide-react"
import { UploadView } from "@/components/UploadView"
import { ReviewView } from "@/components/ReviewView"
import { AssignmentView } from "@/components/AssignmentView"
import { ResultView } from "@/components/ResultView"
import { Badge } from "@/components/ui/badge"
import type { Bill, CalculateResponse } from "@/types"

type AppPhase = "upload" | "review" | "assignment" | "result"

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [billData, setBillData] = useState<Bill | null>(null)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SplitSnap AI
              </span>
              <span className="text-[10px] font-mono text-emerald-400 ml-2 px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                Gemini 3.1 Flash Lite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionId && (
              <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-mono">
                Session: {sessionId.slice(-6)}
              </Badge>
            )}

            {/* Stepper Pill Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-400">
              <span className={phase === "upload" ? "text-emerald-400 font-bold" : "text-slate-500"}>1. Upload</span>
              <span>&rsaquo;</span>
              <span className={phase === "review" ? "text-emerald-400 font-bold" : "text-slate-500"}>2. Review</span>
              <span>&rsaquo;</span>
              <span className={phase === "assignment" ? "text-emerald-400 font-bold" : "text-slate-500"}>3. Assign</span>
              <span>&rsaquo;</span>
              <span className={phase === "result" ? "text-emerald-400 font-bold" : "text-slate-500"}>4. Result</span>
            </div>

            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
        {/* Phase 1: Upload View */}
        {phase === "upload" && (
          <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Split Any Bill in Seconds
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                Snap or upload your restaurant receipt photo. Our AI extracts line items, quantities, and taxes with sub-second accuracy.
              </p>
            </div>

            <UploadView onScanComplete={handleScanComplete} />
          </div>
        )}

        {/* Phase 2: Review View */}
        {phase === "review" && billData && sessionId && (
          <ReviewView
            initialBill={billData}
            sessionId={sessionId}
            onConfirmAccuracy={handleConfirmAccuracy}
            onBackToUpload={handleReset}
          />
        )}

        {/* Phase 3: Assignment View */}
        {phase === "assignment" && billData && sessionId && (
          <AssignmentView
            bill={billData}
            sessionId={sessionId}
            onCalculateComplete={handleCalculateComplete}
            onBackToReview={() => setPhase("review")}
          />
        )}

        {/* Phase 4: Result View */}
        {phase === "result" && splitResult && (
          <ResultView
            result={splitResult}
            onBackToAssignment={() => setPhase("assignment")}
            onStartOver={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
