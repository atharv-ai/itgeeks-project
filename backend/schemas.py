from pydantic import BaseModel, Field
from typing import List

class LineItem(BaseModel):
    name: str = Field(description="Name or description of the line item")
    quantity: float = Field(description="Quantity purchased or item count")
    price: float = Field(description="Total price for this line item")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0 for extraction accuracy")

class Bill(BaseModel):
    items: List[LineItem] = Field(description="List of all extracted line items on the bill")
    subtotal: float = Field(description="Subtotal amount before taxes, discounts, and tips")
    taxes: float = Field(description="Total sales tax, VAT, or GST applied")
    service_charge: float = Field(description="Service charge, gratuity, or tip added to the bill")
    discounts: float = Field(description="Total discounts or promotions deducted")
    total: float = Field(description="Final total amount payable on the receipt")
    overall_confidence: float = Field(description="Overall confidence score between 0.0 and 1.0 for the receipt")

class ExtractResponse(BaseModel):
    session_id: str
    status: str
    created_at: str
    extracted_data: Bill
