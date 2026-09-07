from typing import List, Dict, Any, Union, Mapping
from schemas import Bill, LineItem

def calculate_bill_split(
    bill: Union[Bill, Dict[str, Any]],
    members: List[str],
    item_assignments: Mapping[Any, List[str]],
) -> Dict[str, Any]:
    """
    Splits the cost of a bill among members according to item assignments.

    1. Splits the cost of shared items evenly among assigned members.
    2. Calculates the individual subtotal for each person.
    3. Calculates each person's ratio of the total bill subtotal.
    4. Distributes taxes, service charges (tip), and discounts based on that exact ratio.
    5. Returns a detailed breakdown per person with base item cost, tax contribution,
       tip contribution, and final total.
    """
    # Clean and deduplicate members while preserving input order
    seen = set()
    cleaned_members: List[str] = []
    for m in members:
        name = m.strip()
        if name and name not in seen:
            seen.add(name)
            cleaned_members.append(name)

    if not cleaned_members:
        raise ValueError("At least one valid member name must be provided.")

    # Extract bill fields whether Bill model or dict
    if isinstance(bill, Bill):
        items: List[Union[LineItem, Dict[str, Any]]] = list(bill.items)
        subtotal = float(bill.subtotal)
        taxes = float(bill.taxes)
        service_charge = float(bill.service_charge)
        discounts = float(bill.discounts)
        total = float(bill.total)
    else:
        items = list(bill.get("items", []))
        subtotal = float(bill.get("subtotal", 0.0))
        taxes = float(bill.get("taxes", 0.0))
        service_charge = float(bill.get("service_charge", 0.0))
        discounts = float(bill.get("discounts", 0.0))
        total = float(bill.get("total", 0.0))

    # Normalize item assignments: map int index -> list of member names
    assignments_by_index: Dict[int, List[str]] = {}
    for key, assigned in item_assignments.items():
        try:
            idx = int(key)
            assignments_by_index[idx] = [m.strip() for m in assigned if m.strip()]
        except (ValueError, TypeError):
            continue

    # Initialize tracking structures
    member_base_costs: Dict[str, float] = {m: 0.0 for m in cleaned_members}
    member_assigned_items: Dict[str, List[Dict[str, Any]]] = {m: [] for m in cleaned_members}

    # Split each line item evenly among assigned members
    for idx, item in enumerate(items):
        if isinstance(item, dict):
            item_name = str(item.get("name", f"Item {idx + 1}"))
            item_price = float(item.get("price", 0.0))
            item_qty = float(item.get("quantity", 1.0))
        else:
            item_name = item.name
            item_price = float(item.price)
            item_qty = float(item.quantity)

        assigned = assignments_by_index.get(idx, [])
        # Only assign to members present in the active members list
        valid_assigned = [m for m in assigned if m in member_base_costs]

        if valid_assigned:
            shares = len(valid_assigned)
            per_person_share = item_price / shares
            for m in valid_assigned:
                member_base_costs[m] += per_person_share
                member_assigned_items[m].append({
                    "item_index": idx,
                    "name": item_name,
                    "quantity": item_qty,
                    "item_price": round(item_price, 2),
                    "shares": shares,
                    "amount": round(per_person_share, 2),
                })

    total_assigned_subtotal = sum(member_base_costs.values())
    # Use bill's explicit subtotal if > 0, otherwise fallback to sum of assigned subtotals
    reference_subtotal = subtotal if subtotal > 0 else total_assigned_subtotal

    # Calculate per-person ratios and proportional distributions
    breakdown: List[Dict[str, Any]] = []
    for m in cleaned_members:
        base_cost = member_base_costs[m]
        if reference_subtotal > 0:
            ratio = base_cost / reference_subtotal
        else:
            ratio = 1.0 / len(cleaned_members)

        tax_contribution = round(taxes * ratio, 2)
        tip_contribution = round(service_charge * ratio, 2)
        discount_contribution = round(discounts * ratio, 2)
        final_total = round(base_cost + tax_contribution + tip_contribution - discount_contribution, 2)

        breakdown.append({
            "member": m,
            "base_item_cost": round(base_cost, 2),
            "subtotal_ratio": round(ratio, 4),
            "tax_contribution": tax_contribution,
            "tip_contribution": tip_contribution,
            "discount_contribution": discount_contribution,
            "total": final_total,
            "assigned_items": member_assigned_items[m],
        })

    return {
        "breakdown": breakdown,
        "total_subtotal": round(sum(b["base_item_cost"] for b in breakdown), 2),
        "total_taxes": round(sum(b["tax_contribution"] for b in breakdown), 2),
        "total_service_charge": round(sum(b["tip_contribution"] for b in breakdown), 2),
        "total_discounts": round(sum(b["discount_contribution"] for b in breakdown), 2),
        "grand_total": round(sum(b["total"] for b in breakdown), 2),
    }
