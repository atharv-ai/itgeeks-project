import { useState } from "react"
import { Receipt, CheckCircle2, RotateCcw, Users, ArrowLeft } from "lucide-react"
import { UploadView } from "@/components/UploadView"
import { ReviewView } from "@/components/ReviewView"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Bill } from "@/types"

type AppPhase = "upload" | "review" | "assignment"

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [billData, setBillData] = useState<Bill | null>(null)
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

  const handleReset = () => {
    setSessionId(null)
    setBillData(null)
    setPhase("upload")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 hidden sm:inline">Backend Connected</span>
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

        {/* Phase 2: Review View (renders if bill data exists) */}
        {phase === "review" && billData && sessionId && (
          <ReviewView
            initialBill={billData}
            sessionId={sessionId}
            onConfirmAccuracy={handleConfirmAccuracy}
            onBackToUpload={handleReset}
          />
        )}

        {/* Phase 3: Assignment Phase */}
        {phase === "assignment" && billData && sessionId && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-xl text-white">Bill Verified — Assignment Phase</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 font-mono text-xs">
                    Session ID: <span className="text-slate-200">{sessionId}</span>
                  </CardDescription>
                </div>
                <Badge variant="success" className="gap-1 px-3 py-1">
                  Accuracy Confirmed
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">Ready to Assign Members</h4>
                    <p className="text-xs text-slate-300">
                      You have verified {billData.items.length} line items totaling{" "}
                      <span className="font-bold text-white font-mono">${billData.total.toFixed(2)}</span>. In the next step, you can add friends and assign who shared each item.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPhase("review")}
                    className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Edit Verified Items
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
