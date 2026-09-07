import React, { useState } from "react"
import {
  Users,
  UserPlus,
  X,
  Calculator,
  ArrowLeft,
  Check,
  Split,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Bill, CalculateResponse } from "@/types"

interface AssignmentViewProps {
  bill: Bill
  sessionId: string
  onCalculateComplete: (result: CalculateResponse) => void
  onBackToReview: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export function AssignmentView({
  bill,
  sessionId,
  onCalculateComplete,
  onBackToReview,
}: AssignmentViewProps) {
  // Members list with a couple friendly defaults
  const [members, setMembers] = useState<string[]>(["Alice", "Bob"])
  const [newMemberName, setNewMemberName] = useState("")

  // Mapping from item index (number) to array of member names
  const [assignments, setAssignments] = useState<Record<number, string[]>>(() => {
    // By default, initially assign all items to all initial members or empty
    const initial: Record<number, string[]> = {}
    bill.items.forEach((_, idx) => {
      initial[idx] = []
    })
    return initial
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Member Management
  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMemberName.trim()
    if (!trimmed) return

    if (members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the members list.`)
      return
    }

    setMembers((prev) => [...prev, trimmed])
    setNewMemberName("")
    setError(null)
  }

  const handleRemoveMember = (nameToRemove: string) => {
    if (members.length <= 1) {
      setError("You must have at least one member to split the bill.")
      return
    }

    setMembers((prev) => prev.filter((m) => m !== nameToRemove))
    // Remove this member from all item assignments
    setAssignments((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        const idx = Number(key)
        next[idx] = (next[idx] || []).filter((m) => m !== nameToRemove)
      })
      return next
    })
  }

  // Toggle item assignment for a member
  const toggleMemberForItem = (itemIndex: number, memberName: string) => {
    setAssignments((prev) => {
      const currentList = prev[itemIndex] || []
      const isAssigned = currentList.includes(memberName)
      const nextList = isAssigned
        ? currentList.filter((m) => m !== memberName)
        : [...currentList, memberName]

      return {
        ...prev,
        [itemIndex]: nextList,
      }
    })
  }

  // Select all members for an item
  const handleSelectAllForItem = (itemIndex: number) => {
    setAssignments((prev) => {
      const currentList = prev[itemIndex] || []
      const allSelected = currentList.length === members.length
      return {
        ...prev,
        [itemIndex]: allSelected ? [] : [...members],
      }
    })
  }

  const handleCalculateSplit = async () => {
    setError(null)

    if (members.length === 0) {
      setError("Please add at least one member before calculating.")
      return
    }

    // Check if any items are unassigned
    const unassignedCount = bill.items.filter(
      (_, idx) => (!assignments[idx] || assignments[idx].length === 0)
    ).length

    if (unassignedCount > 0) {
      setError(
        `${unassignedCount} item${unassignedCount > 1 ? "s are" : " is"} not assigned to anyone yet. Please assign all items so the entire bill is covered.`
      )
      return
    }

    setIsCalculating(true)

    try {
      // Convert assignments keys to string to match JSON spec
      const formattedAssignments: Record<string, string[]> = {}
      Object.entries(assignments).forEach(([idx, assignedList]) => {
        formattedAssignments[idx] = assignedList
      })

      const payload = {
        bill,
        members,
        item_assignments: formattedAssignments,
        session_id: sessionId,
      }

      const response = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server returned error ${response.status}`)
      }

      const data: CalculateResponse = await response.json()
      onCalculateComplete(data)
    } catch (err: any) {
      setError(err.message || "Failed to calculate split. Please ensure backend is running.")
    } finally {
      setIsCalculating(false)
    }
  }

  // Palette of subtle distinct colors for member badges
  const memberColors = [
    "from-indigo-500 to-purple-600 border-indigo-400/40 text-indigo-100",
    "from-emerald-500 to-teal-600 border-emerald-400/40 text-emerald-100",
    "from-amber-500 to-orange-600 border-amber-400/40 text-amber-100",
    "from-cyan-500 to-blue-600 border-cyan-400/40 text-cyan-100",
    "from-rose-500 to-pink-600 border-rose-400/40 text-rose-100",
    "from-violet-500 to-fuchsia-600 border-violet-400/40 text-violet-100",
  ]

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Split className="w-5 h-5 text-indigo-400" />
              <CardTitle className="text-xl text-white">Assign Items to Members</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Select who shared each line item. Shared items divide cost equally among tagged members.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-mono">
              Total: ${bill.total.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Member Management Section */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Group Members ({members.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">Click &times; to remove a member</span>
            </div>

            {/* Members Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {members.map((member, index) => {
                const colorClass = memberColors[index % memberColors.length]
                return (
                  <div
                    key={member}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gradient-to-r shadow-xs ${colorClass}`}
                  >
                    <UserCheck className="w-3.5 h-3.5 opacity-80" />
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      className="ml-1 text-white/70 hover:text-white rounded-full p-0.5 hover:bg-white/20 transition-colors"
                      title={`Remove ${member}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-2 max-w-sm">
              <Input
                type="text"
                placeholder="Add friend's name (e.g. Charlie)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="h-9 bg-slate-950/60 border-white/10 text-slate-100 text-sm placeholder:text-slate-500"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </Button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-destructive text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Items Assignment List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Tag Consumers for Each Item</span>
              <span className="text-[11px] font-normal text-slate-500">
                Click multiple names if shared
              </span>
            </div>

            <div className="space-y-3">
              {bill.items.map((item, idx) => {
                const assignedList = assignments[idx] || []
                const numAssigned = assignedList.length
                const perPersonCost = numAssigned > 0 ? item.price / numAssigned : 0
                const isAllSelected = numAssigned === members.length

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 transition-all duration-150 space-y-3 ${
                      numAssigned === 0
                        ? "border-amber-500/40 bg-amber-500/[0.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    {/* Item Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 w-5">#{idx + 1}</span>
                        <div>
                          <span className="text-sm font-semibold text-white">{item.name}</span>
                          <span className="text-xs text-slate-400 ml-2 font-mono">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-sm font-bold text-white font-mono">
                          ${item.price.toFixed(2)}
                        </span>

                        {numAssigned > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          >
                            ${perPersonCost.toFixed(2)} / person ({numAssigned})
                          </Badge>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAllForItem(idx)}
                          className="h-7 text-xs text-slate-400 hover:text-white hover:bg-white/10"
                        >
                          {isAllSelected ? "Deselect All" : "All"}
                        </Button>
                      </div>
                    </div>

                    {/* Member Toggles */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {members.map((member) => {
                        const isSelected = assignedList.includes(member)

                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => toggleMemberForItem(idx, member)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30 scale-100"
                                : "bg-slate-950/40 text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200"
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px] ${
                                isSelected
                                  ? "bg-white text-indigo-600 border-white"
                                  : "border-slate-600"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{member}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onBackToReview}
              className="w-full sm:w-auto border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Review Items
            </Button>

            <Button
              onClick={handleCalculateSplit}
              disabled={isCalculating}
              className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-base shadow-lg shadow-indigo-500/20"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Calculating Proportional Split...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate Split
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
