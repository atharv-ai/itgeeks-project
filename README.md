# 🧾 Split the Bill From a Photograph

> **Fair, transparent bill splitting powered by Multimodal AI and Proportional Math.**

When a group shares a meal, a flat division of the bill is often unfair, especially when some members order significantly more or less, and taxes, service charges, or discounts are mixed in. 

**Split the Bill From a Photograph** solves this by:
1. Extracting structured line items and confidence scores from receipt photos using **Google Gemini Vision**.
2. Providing a human-in-the-loop review interface with visual alerts for low-confidence reads.
3. Enabling individual and multi-person item assignments.
4. Dynamically computing the true fair split using a **proportional mathematical model**.

---

## 🚀 Key Features

- **📸 Multimodal AI Extraction:** Upload single or multi-page receipt photos. Gemini extracts items, prices, quantities, taxes, and service charges.
- **⚠️ Human-in-the-Loop Verification:** Items with confidence scores below $80\%$ are highlighted with amber warning badges, allowing instant inline corrections.
- **👥 Flexible Member Assignment:** Dynamically add group members and toggle who consumed what. Multiple members can share any line item equally.
- **📐 Proportional Math Engine:** Rather than splitting taxes and tips evenly, the engine allocates extra costs based on each person's individual consumption ratio ($r_i = S_i / S_{\text{total}}$).
- **🧾 Perforated Receipt Breakdown:** Generates a shareable, itemized breakdown card for each individual with subtotal, tax, tip, and total owed.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Database** | MongoDB (via Motor async driver) |
| **AI / Multimodal** | Google Gemini (`gemini-3.1-flash-lite` / `gemini-1.5-flash`) |
| **Testing** | Pytest, TestClient, automated receipt dataset evaluation script |

---

## 📁 Project Structure

```plaintext
bill-splitter/
├── backend/
│   ├── main.py                  # FastAPI application & API endpoints (/api/extract, /api/calculate)
│   ├── schemas.py               # Pydantic models for Bill, LineItem, and breakdown calculation
│   ├── database.py              # Motor async MongoDB connection manager
│   ├── services/
│   │   ├── ai_extractor.py      # Gemini Vision integration with structured schema parsing
│   │   └── math_engine.py       # Proportional split calculation logic
│   ├── scripts/
│   │   └── evaluate_dataset.py  # Automated evaluation script testing AI vs ground truth bills
│   ├── test_dataset/            # 12 real receipt images for testing
│   ├── ground_truth_dataset/    # Expected JSON outputs for evaluation
│   ├── tests/                   # Pytest test suite
│   ├── requirements.txt         # Backend Python dependencies
│   └── .env.example             # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/          # UploadView, ReviewView, AssignmentView, ResultView & UI cards
│   │   ├── lib/                 # Tailwind utility helpers (cn)
│   │   ├── types.ts             # Shared TypeScript schemas matching backend models
│   │   └── App.tsx              # 4-stage stepper state machine
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind design system configuration
│   └── vite.config.ts           # Vite bundler configuration
└── README.md
```

---

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+** & `npm`
- **MongoDB**: A running local instance (default: `mongodb://localhost:27017`)
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

## ⚡ Quickstart Guide

### 1. Set Up the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   MONGODB_URI=mongodb://localhost:27017
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - API will be live at: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 2. Set Up the Frontend

1. Open a new terminal session and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Frontend will be live at: `http://localhost:5173`

---

### 3. Run the Evaluation Script (Optional)

To benchmark the Gemini extraction accuracy against 12 ground-truth receipts without using the browser UI:

```bash
cd backend
source venv/bin/activate
python scripts/evaluate_dataset.py
```

To execute the backend unit tests:
```bash
pytest tests/test_application.py -v
```

---

## 🧮 Mathematical Model

When calculating person $i$'s total owed:

1. **Shared Items:** If an item $k$ costs $P_k$ and is shared by $M_k$ people, person $i$'s share is:
   $$\text{item\_share}_{i,k} = \frac{P_k}{M_k}$$

2. **Personal Subtotal:** Sum of all item shares for person $i$:
   $$S_i = \sum_{k \in \text{Items}_i} \text{item\_share}_{i,k}$$

3. **Proportional Ratio:**
   $$r_i = \frac{S_i}{S_{\text{total}}}$$

4. **Tax, Tip, and Discount Allocation:**
   $$\text{Tax}_i = r_i \times \text{Tax}_{\text{total}}, \quad \text{Tip}_i = r_i \times \text{Tip}_{\text{total}}, \quad \text{Discount}_i = r_i \times \text{Discount}_{\text{total}}$$

5. **Final Total:**
   $$\text{Total}_i = S_i + \text{Tax}_i + \text{Tip}_i - \text{Discount}_i$$

---

## 💡 Hackathon Scope & Context

Because this project was created as a rapid hackathon build, certain features are simplified:
- **Session Tracking:** Sessions are temporarily tracked via MongoDB document IDs returned upon image upload.
- **Payment Integration:** Displays precise amounts owed per person; direct payment gateway transfer (e.g., Stripe, UPI) is not integrated.
- **Single-Device Flow:** The assignment interface is designed for one user to pass around a device or coordinate claiming items.
- **Data Retention:** MongoDB preserves bill states for demo purposes without an automated TTL expiration index.