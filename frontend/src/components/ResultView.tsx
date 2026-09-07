import { useState } from "react"
import {
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  Coins,
  Sparkles,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { CalculateResponse } from "@/types"

interface ResultViewProps {
  result: CalculateResponse
  onBackToAssignment: () => void
  onStartOver: () => void
}

export function ResultView({
  result,
  onBackToAssignment,
  onStartOver,
}: ResultViewProps) {
  const [copiedMember, setCopiedMember] = useState<string | null>(null)

  const handleCopyBreakdown = (member: string, total: number, items: string) => {
    const text = `Hey ${member}! Your share of the bill is $${total.toFixed(2)}.\nItems: ${items}`
    navigator.clipboard.writeText(text)
    setCopiedMember(member)
    setTimeout(() => setCopiedMember(null), 2000)
  }

  // Member card color themes
  const colorAccents = [
    { border: "border-indigo-500/30", badge: "bg-indigo-500/20 text-indigo-300", glow: "shadow-indigo-500/10" },
    { border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300", glow: "shadow-emerald-500/10" },
    { border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-300", glow: "shadow-amber-500/10" },
    { border: "border-cyan-500/30", badge: "bg-cyan-500/20 text-cyan-300", glow: "shadow-cyan-500/10" },
    { border: "border-rose-500/30", badge: "bg-rose-500/20 text-rose-300", glow: "shadow-rose-500/10" },
    { border: "border-violet-500/30", badge: "bg-violet-500/20 text-violet-300", glow: "shadow-violet-500/10" },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Grand Summary */}
      <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <CardTitle className="text-2xl text-white font-extrabold">Final Split Breakdown</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-xs mt-1">
              All shared items, taxes, tips, and discounts have been calculated proportionally.
            </CardDescription>
          </div>

          <Badge variant="success" className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            100% Mathematically Reconciled
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bill Totals Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Subtotal</span>
              <span className="text-base font-bold text-white font-mono">
                ${result.total_subtotal.toFixed(2)}
              </span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Taxes</span>
              <span className="text-base font-bold text-white font-mono">
                ${result.total_taxes.toFixed(2)}
              </span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Tip / Service</span>
              <span className="text-base font-bold text-white font-mono">
                ${result.total_service_charge.toFixed(2)}
              </span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Discounts</span>
              <span className="text-base font-bold text-white font-mono">
                -${result.total_discounts.toFixed(2)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <span className="text-[11px] text-emerald-400 block mb-1 font-medium">Grand Total</span>
              <span className="text-xl font-extrabold text-emerald-300 font-mono">
                ${result.grand_total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToAssignment}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Adjust Member Assignments
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="text-slate-400 hover:text-white text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Scan Another Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Individual Receipt-like Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Individual Receipts ({result.breakdown.length} Members)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {result.breakdown.map((person, index) => {
            const theme = colorAccents[index % colorAccents.length]
            const itemsSummary = person.assigned_items
              .map((i) => `${i.name} ($${i.amount.toFixed(2)})`)
              .join(", ")

            return (
              <Card
                key={person.member}
                className={`border bg-slate-900/80 backdrop-blur-xl shadow-xl transition-all hover:scale-[1.01] ${theme.border} ${theme.glow} flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  {/* Top Header */}
                  <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-base text-white">
                        {person.member.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white font-bold">{person.member}</CardTitle>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {(person.subtotal_ratio * 100).toFixed(1)}% of subtotal
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyBreakdown(person.member, person.total, itemsSummary)}
                      className="h-8 text-xs text-slate-400 hover:text-white hover:bg-white/10 gap-1.5"
                    >
                      {copiedMember === person.member ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    {/* Specific Item Costs */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Assigned Items ({person.assigned_items.length})
                      </span>

                      <div className="rounded-xl border border-white/5 bg-slate-950/40 divide-y divide-white/5 overflow-hidden">
                        {person.assigned_items.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 italic">No items assigned</div>
                        ) : (
                          person.assigned_items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-white/[0.02]"
                            >
                              <div>
                                <span className="font-medium text-slate-200">{item.name}</span>
                                {item.shares > 1 && (
                                  <span className="text-[10px] text-indigo-400 ml-2 px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">
                                    1/{item.shares} share
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-semibold text-slate-200">
                                ${item.amount.toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Proportional Adjustments Breakdown */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Item Subtotal</span>
                        <span className="font-mono font-medium text-slate-200">
                          ${person.base_item_cost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Tax Share ({(person.subtotal_ratio * 100).toFixed(1)}%)
                        </span>
                        <span className="font-mono text-slate-200">
                          +${person.tax_contribution.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Tip / Service Share ({(person.subtotal_ratio * 100).toFixed(1)}%)
                        </span>
                        <span className="font-mono text-slate-200">
                          +${person.tip_contribution.toFixed(2)}
                        </span>
                      </div>

                      {person.discount_contribution > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Discount Share</span>
                          <span className="font-mono">
                            -${person.discount_contribution.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Bottom Receipt Total Tear-Off */}
                <div className="border-t border-dashed border-white/10 bg-slate-950/60 p-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Total Owed</span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      ${person.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
