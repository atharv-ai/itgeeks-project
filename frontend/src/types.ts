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
