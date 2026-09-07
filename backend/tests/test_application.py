import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from services.math_engine import calculate_bill_split
from schemas import Bill, LineItem

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    """Verify GET / returns healthy status and MongoDB connectivity."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "message" in data

def test_create_session(client):
    """Verify POST /session creates a valid MongoDB session."""
    payload = {
        "session_name": "Dinner Party Test",
        "metadata": {"location": "San Francisco", "table": 4}
    }
    response = client.post("/session", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "created"
    assert data["session_name"] == "Dinner Party Test"

def test_math_engine_proportional_split():
    """Verify that taxes, tips, and discounts scale strictly by individual subtotal ratio."""
    bill = Bill(
        items=[
            LineItem(name="Pizza", quantity=1.0, price=20.0, confidence_score=1.0),
            LineItem(name="Pasta", quantity=1.0, price=30.0, confidence_score=1.0),
        ],
        subtotal=50.0,
        taxes=5.0,            # 10% tax
        service_charge=10.0,  # 20% tip
        discounts=5.0,        # 10% discount
        total=60.0,
        overall_confidence=1.0
    )
    members = ["Alice", "Bob"]
    # Alice had Pizza ($20), Bob had Pasta ($30)
    assignments = {"0": ["Alice"], "1": ["Bob"]}

    result = calculate_bill_split(bill, members, assignments)
    breakdown = {b["member"]: b for b in result["breakdown"]}

    # Alice ratio: 20 / 50 = 0.4
    assert breakdown["Alice"]["base_item_cost"] == 20.0
    assert breakdown["Alice"]["subtotal_ratio"] == 0.4
    assert breakdown["Alice"]["tax_contribution"] == 2.0
    assert breakdown["Alice"]["tip_contribution"] == 4.0
    assert breakdown["Alice"]["discount_contribution"] == 2.0
    assert breakdown["Alice"]["total"] == 24.0  # 20 + 2 + 4 - 2

    # Bob ratio: 30 / 50 = 0.6
    assert breakdown["Bob"]["base_item_cost"] == 30.0
    assert breakdown["Bob"]["subtotal_ratio"] == 0.6
    assert breakdown["Bob"]["tax_contribution"] == 3.0
    assert breakdown["Bob"]["tip_contribution"] == 6.0
    assert breakdown["Bob"]["discount_contribution"] == 3.0
    assert breakdown["Bob"]["total"] == 36.0  # 30 + 3 + 6 - 3

    assert result["grand_total"] == 60.0
    assert result["total_subtotal"] == 50.0

def test_math_engine_shared_items():
    """Verify that shared items divide cost evenly among consumers."""
    bill = Bill(
        items=[
            LineItem(name="Shared Nachos", quantity=1.0, price=15.0, confidence_score=1.0),
            LineItem(name="Alice Soda", quantity=1.0, price=5.0, confidence_score=1.0),
        ],
        subtotal=20.0,
        taxes=2.0,
        service_charge=0.0,
        discounts=0.0,
        total=22.0,
        overall_confidence=1.0
    )
    members = ["Alice", "Bob", "Charlie"]
    # Nachos shared by all 3 ($5 each). Soda only Alice ($5).
    assignments = {"0": ["Alice", "Bob", "Charlie"], "1": ["Alice"]}

    result = calculate_bill_split(bill, members, assignments)
    breakdown = {b["member"]: b for b in result["breakdown"]}

    # Alice: $5 (nachos) + $5 (soda) = $10 (50%) -> tax $1.00 -> total $11.00
    assert breakdown["Alice"]["base_item_cost"] == 10.0
    assert breakdown["Alice"]["tax_contribution"] == 1.0
    assert breakdown["Alice"]["total"] == 11.0

    # Bob: $5 (nachos) = $5 (25%) -> tax $0.50 -> total $5.50
    assert breakdown["Bob"]["base_item_cost"] == 5.0
    assert breakdown["Bob"]["tax_contribution"] == 0.5
    assert breakdown["Bob"]["total"] == 5.50

    # Charlie: $5 (nachos) = $5 (25%) -> tax $0.50 -> total $5.50
    assert breakdown["Charlie"]["base_item_cost"] == 5.0
    assert breakdown["Charlie"]["tax_contribution"] == 0.5
    assert breakdown["Charlie"]["total"] == 5.50

    assert result["grand_total"] == 22.0

def test_calculate_endpoint_with_session_persistence(client):
    """Verify POST /api/calculate updates MongoDB session document."""
    # 1. Create session
    create_res = client.post("/session", json={"session_name": "Calc Persistence Test"})
    assert create_res.status_code == 201
    session_id = create_res.json()["session_id"]

    # 2. Call /api/calculate
    calc_payload = {
        "session_id": session_id,
        "bill": {
            "items": [{"name": "Steak", "quantity": 1.0, "price": 40.0, "confidence_score": 1.0}],
            "subtotal": 40.0,
            "taxes": 4.0,
            "service_charge": 8.0,
            "discounts": 0.0,
            "total": 52.0,
            "overall_confidence": 1.0
        },
        "members": ["Dave", "Elena"],
        "item_assignments": {"0": ["Dave", "Elena"]}
    }
    calc_res = client.post("/api/calculate", json=calc_payload)
    assert calc_res.status_code == 200
    data = calc_res.json()
    assert data["session_id"] == session_id
    assert data["grand_total"] == 52.0
    assert len(data["breakdown"]) == 2

def test_extract_endpoint_validation(client):
    """Verify POST /api/extract validates inputs and rejects empty files."""
    response = client.post("/api/extract", files=[("files", ("empty.jpg", b"", "image/jpeg"))])
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

if __name__ == "__main__":
    pytest.main(["-v", __file__])
