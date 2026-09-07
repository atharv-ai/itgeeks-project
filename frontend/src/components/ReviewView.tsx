import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Receipt,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Bill, LineItem } from "@/types"

interface ReviewViewProps {
  initialBill: Bill
  sessionId: string
  onConfirmAccuracy: (verifiedBill: Bill) => void
  onBackToUpload: () => void
}

export function ReviewView({
  initialBill,
  sessionId,
  onConfirmAccuracy,
  onBackToUpload,
}: ReviewViewProps) {
  const [items, setItems] = useState<LineItem[]>(initialBill.items || [])
  const [taxes, setTaxes] = useState<number>(initialBill.taxes || 0)
  const [serviceCharge, setServiceCharge] = useState<number>(initialBill.service_charge || 0)
  const [discounts, setDiscounts] = useState<number>(initialBill.discounts || 0)

  // Auto-calculated subtotal based on current items
  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  const computedTotal = Math.max(0, computedSubtotal + taxes + serviceCharge - discounts)

  const lowConfidenceCount = items.filter(
    (item) => (item.confidence_score ?? 1.0) < 0.8
  ).length

  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const next = [...prev]
      const current = { ...next[index] }

      if (field === "name") {
        current.name = String(value)
      } else if (field === "quantity") {
        current.quantity = parseFloat(String(value)) || 0
      } else if (field === "price") {
        current.price = parseFloat(String(value)) || 0
      }

      // Mark edited items as user-verified with 1.0 confidence
      current.confidence_score = 1.0
      next[index] = current
      return next
    })
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "New Item",
        quantity: 1.0,
        price: 0.0,
        confidence_score: 1.0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    const verifiedBill: Bill = {
      items,
      subtotal: Math.round(computedSubtotal * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      service_charge: Math.round(serviceCharge * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      total: Math.round(computedTotal * 100) / 100,
      overall_confidence: lowConfidenceCount === 0 ? 1.0 : initialBill.overall_confidence,
    }

    onConfirmAccuracy(verifiedBill)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-xl text-white">Review & Verify Extracted Bill</CardTitle>
            </div>
            <CardDescription className="text-slate-400 font-mono text-xs mt-1">
              Session ID: <span className="text-slate-200">{sessionId}</span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {lowConfidenceCount > 0 ? (
              <Badge variant="destructive" className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1.5 px-3 py-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {lowConfidenceCount} item{lowConfidenceCount > 1 ? "s" : ""} need review (&lt;80% confidence)
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1.5 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All items high confidence (&ge;80%)
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions Notice */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3 text-xs text-slate-300">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Review AI extractions:</span> Items flagged with a{" "}
              <span className="text-amber-400 font-semibold border-b border-amber-400/50">yellow / amber border</span>{" "}
              have AI confidence below 80%. Feel free to edit names, quantities, or prices directly.
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Extracted Line Items ({items.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-slate-400 bg-white/[0.02] rounded-lg border border-white/5">
              <div className="col-span-6">Item Name</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-3 text-right">Price ($)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Editable Rows */}
            <div className="space-y-2">
              {items.map((item, index) => {
                const confidence = item.confidence_score ?? 1.0
                const isLowConfidence = confidence < 0.8

                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-3 sm:p-2.5 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 items-center ${
                      isLowConfidence
                        ? "border-amber-500/60 bg-amber-500/[0.04] shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    {/* Name Input */}
                    <div className="w-full sm:col-span-6 space-y-1">
                      <div className="flex items-center justify-between sm:hidden">
                        <span className="text-xs text-slate-400">Item #{index + 1}</span>
                        {isLowConfidence && (
                          <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {(confidence * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, "name", e.target.value)}
                          placeholder="Item name"
                          className={`bg-slate-950/50 text-slate-100 placeholder:text-slate-500 ${
                            isLowConfidence
                              ? "border-amber-500 focus-visible:ring-amber-500/50 pr-8"
                              : "border-white/10 focus-visible:ring-emerald-500"
                          }`}
                        />
                        {isLowConfidence && (
                          <div
                            className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400"
                            title={`Low AI confidence (${(confidence * 100).toFixed(0)}%). Please double check.`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="w-full sm:col-span-2 flex items-center gap-2 sm:block">
                      <span className="text-xs text-slate-400 sm:hidden w-20">Quantity:</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className={`bg-slate-950/50 text-slate-100 text-center ${
                          isLowConfidence
                            ? "border-amber-500 focus-visible:ring-amber-500/50"
                            : "border-white/10 focus-visible:ring-emerald-500"
                        }`}
                      />
                    </div>

                    {/* Price Input */}
                    <div className="w-full sm:col-span-3 flex items-center gap-2 sm:block">
                      <span className="text-xs text-slate-400 sm:hidden w-20">Price ($):</span>
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          className={`bg-slate-950/50 text-slate-100 font-mono text-right pl-7 ${
                            isLowConfidence
                              ? "border-amber-500 focus-visible:ring-amber-500/50"
                              : "border-white/10 focus-visible:ring-emerald-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="w-full sm:col-span-1 flex justify-end sm:justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        title="Delete this line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Subtotal, Taxes, Tip, and Grand Total Controls */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Bill Adjustments & Totals
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* Subtotal */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="text-xs text-slate-400 block mb-1">Subtotal</span>
                <span className="text-lg font-bold text-white font-mono block">
                  ${computedSubtotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Sum of item prices</span>
              </div>

              {/* Taxes */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <label className="text-xs text-slate-400 block">Taxes ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxes}
                    onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
                    className="h-8 bg-slate-950/50 text-slate-100 font-mono text-right pl-6 text-sm border-white/10"
                  />
                </div>
              </div>

              {/* Service Charge / Tip */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <label className="text-xs text-slate-400 block">Tip / Service ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                    className="h-8 bg-slate-950/50 text-slate-100 font-mono text-right pl-6 text-sm border-white/10"
                  />
                </div>
              </div>

              {/* Discounts */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <label className="text-xs text-slate-400 block">Discounts ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discounts}
                    onChange={(e) => setDiscounts(parseFloat(e.target.value) || 0)}
                    className="h-8 bg-slate-950/50 text-slate-100 font-mono text-right pl-6 text-sm border-white/10"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col justify-between">
                <span className="text-xs text-emerald-400 font-medium block">Final Total</span>
                <span className="text-xl font-extrabold text-emerald-300 font-mono">
                  ${computedTotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400/80">Subtotal + Tax + Tip - Disc</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onBackToUpload}
              className="w-full sm:w-auto border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-upload Photo
            </Button>

            <Button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Confirm Accuracy & Proceed
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
