from pydantic import BaseModel, Field
from typing import List, Optional, Dict

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

class AssignedItemDetail(BaseModel):
    item_index: int = Field(description="Index of the line item in the bill")
    name: str = Field(description="Name of the line item")
    quantity: float = Field(description="Total quantity of the line item")
    item_price: float = Field(description="Total price of the line item")
    shares: int = Field(description="Number of people sharing this line item")
    amount: float = Field(description="Portion of cost allocated to this person")

class PersonBreakdown(BaseModel):
    member: str = Field(description="Name of the person / member")
    base_item_cost: float = Field(description="Sum of base prices for items consumed by this person")
    subtotal_ratio: float = Field(description="Ratio of this person's item costs to the total bill subtotal")
    tax_contribution: float = Field(description="Proportional share of total taxes")
    tip_contribution: float = Field(description="Proportional share of total service charges / tip")
    discount_contribution: float = Field(description="Proportional share of total discounts")
    total: float = Field(description="Final total amount owed by this person")
    assigned_items: List[AssignedItemDetail] = Field(default_factory=list, description="List of items shared by this person")

class CalculateRequest(BaseModel):
    bill: Bill = Field(description="The verified Bill data")
    members: List[str] = Field(description="List of member names participating in splitting")
    item_assignments: dict[str, List[str]] = Field(
        description="Mapping of line item index (as string or int) to list of member names sharing it"
    )
    session_id: Optional[str] = Field(default=None, description="Optional MongoDB session ID to persist calculation")

class CalculateResponse(BaseModel):
    session_id: Optional[str] = None
    breakdown: List[PersonBreakdown]
    total_subtotal: float
    total_taxes: float
    total_service_charge: float
    total_discounts: float
    grand_total: float

