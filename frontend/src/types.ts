export interface LineItem {
  name: string
  quantity: number
  price: number
  confidence_score: number
}

export interface Bill {
  items: LineItem[]
  subtotal: number
  taxes: number
  service_charge: number
  discounts: number
  total: number
  overall_confidence: number
}

export interface ExtractResponse {
  session_id: string
  status: string
  created_at: string
  extracted_data: Bill
}

export interface SelectedFile {
  id: string
  file: File
  previewUrl: string
}

export interface AssignedItemDetail {
  item_index: number
  name: string
  quantity: number
  item_price: number
  shares: number
  amount: number
}

export interface PersonBreakdown {
  member: string
  base_item_cost: number
  subtotal_ratio: number
  tax_contribution: number
  tip_contribution: number
  discount_contribution: number
  total: number
  assigned_items: AssignedItemDetail[]
}

export interface CalculateResponse {
  session_id?: string | null
  breakdown: PersonBreakdown[]
  total_subtotal: number
  total_taxes: number
  total_service_charge: number
  total_discounts: number
  grand_total: number
}
