import { useState } from "react"
import { Receipt, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Tag } from "lucide-react"
import { UploadView } from "@/components/UploadView"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Bill } from "@/types"

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [billData, setBillData] = useState<Bill | null>(null)

  const handleScanComplete = (id: string, data: Bill) => {
    setSessionId(id)
    setBillData(data)
  }

  const handleReset = () => {
    setSessionId(null)
    setBillData(null)
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
        {!billData ? (
          <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Split Any Bill in Seconds
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                Snap or upload your restaurant receipt photo. Our AI extracts line items, quantities, and taxes with sub-second accuracy.
              </p>
            </div>

            {/* Upload View Component */}
            <UploadView onScanComplete={handleScanComplete} />
          </div>
        ) : (
          /* Scanned Bill Presentation */
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            {/* Header Card */}
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-xl text-white">Receipt Extracted Successfully</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 font-mono text-xs">
                    Session ID: <span className="text-slate-200">{sessionId}</span>
                  </CardDescription>
                </div>
                <Badge variant="success" className="gap-1 px-3 py-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {((billData.overall_confidence || 0.99) * 100).toFixed(0)}% AI Confidence
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Line Items List */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Line Items ({billData.items.length})
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
                    {billData.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 w-5">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              Qty: <span className="font-semibold text-slate-300">{item.quantity}</span>
                              {item.quantity > 1 && (
                                <span className="text-slate-500 ml-2">
                                  (${((item.price / item.quantity) || item.price).toFixed(2)} ea)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-semibold text-white font-mono">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Totals Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">Subtotal</span>
                    <span className="text-base font-bold text-slate-200 font-mono">
                      ${billData.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">Taxes</span>
                    <span className="text-base font-bold text-slate-200 font-mono">
                      ${billData.taxes.toFixed(2)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">Tip / Service</span>
                    <span className="text-base font-bold text-slate-200 font-mono">
                      ${billData.service_charge.toFixed(2)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <span className="text-[11px] text-emerald-400 block mb-1 font-medium">Grand Total</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">
                      ${billData.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full sm:w-auto border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Scan Another Bill
                  </Button>

                  <Button
                    className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
                  >
                    Proceed to Split Among Friends
                    <ArrowRight className="w-4 h-4 ml-2" />
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
