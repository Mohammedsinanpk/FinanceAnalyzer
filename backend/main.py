from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Optional, Any

from gemini_helper import extract_bill_info, chat_with_finance_assistant

from datetime import datetime
from supabase import create_client, Client
import json

app = FastAPI(title="AI Finance Analyzer API")

# Initialize Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: SUPABASE_URL and SUPABASE_KEY not found in environment variables.")

allowed_origins = os.getenv("DEV_DOMAIN", "*")
# Handle comma-separated origins if needed, or just allow all for now/dev
if allowed_origins == "*":
    origins = ["*"]
else:
    origins = [allowed_origins]
    if not allowed_origins.startswith("http"):
        origins.append(f"https://{allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Allow all for mobile app (Capacitor serves from localhost or file://)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Transaction(BaseModel):
    date: str  # ISO format preferred
    merchant: str
    category: str
    amount: float
    type: str  # 'income' or 'expense'
    is_recurring: bool = False
    items: Optional[List[Any]] = None


class ChatRequest(BaseModel):
    question: str
    transactions: List[Any] = []


@app.get("/")
async def root():
    return {"message": "AI Finance Analyzer API", "status": "running"}


@app.post("/api/upload-bill")
async def upload_bill(file: UploadFile = File(...)):
    """Upload and extract bill information using Gemini Vision"""
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are accepted")

        MAX_FILE_SIZE = 10 * 1024 * 1024
        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        bill_data = await extract_bill_info(contents, file.content_type)

        # Return data directly, do not save to server automatically yet
        # Frontend can call /api/transactions to save
        return {
            "success": True,
            "message": "Bill processed successfully",
            "data": bill_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bill: {str(e)}")


@app.get("/api/transactions")
async def get_transactions():
    """Fetch all transactions from Supabase"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        response = (
            supabase.table("transactions")
            .select("*")
            .order("date", desc=True)
            .execute()
        )
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching transactions: {str(e)}"
        )


@app.post("/api/transactions")
async def add_transaction(transaction: Transaction):
    """Add a new transaction to Supabase"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        data = transaction.dict()
        # Ensure date is properly formatted if needed, or rely on frontend ISO string
        response = supabase.table("transactions").insert(data).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error adding transaction: {str(e)}"
        )


@app.get("/api/dashboard")
async def get_dashboard_data():
    """Calculate dashboard insights from Supabase data"""
    if not supabase:
        # Fallback for dev if no DB - return empty structure
        return {
            "success": False,
            "message": "Database not configured",
            "insights": {
                "total_spent": 0,
                "transaction_count": 0,
                "top_category": "N/A",
                "category_breakdown": {},
                "insights": ["Configure Supabase to see real data"],
            },
            "transactions": [],
        }

    try:
        # Fetch all transactions (for a real app, you might want to paginate or filter by month)
        response = supabase.table("transactions").select("*").execute()
        transactions = response.data

        if not transactions:
            return {
                "success": True,
                "insights": {
                    "total_spent": 0,
                    "transaction_count": 0,
                    "top_category": "N/A",
                    "category_breakdown": {},
                    "insights": ["Add your first transaction!"],
                },
                "transactions": [],
            }

        # Calculate insights in Python
        total_spent = 0
        category_map = {}

        for t in transactions:
            if t.get("type") == "expense":
                amount = float(t.get("amount", 0))
                total_spent += amount
                cat = t.get("category", "Uncategorized")
                category_map[cat] = category_map.get(cat, 0) + amount

        # Top category
        top_category = "N/A"
        if category_map:
            top_category = max(category_map, key=category_map.get)

        # Generate some basic insights
        insights_list = []
        if total_spent > 1000:
            insights_list.append("High spending detected.")
        if top_category != "N/A":
            insights_list.append(f"Most spending in {top_category}.")

        return {
            "success": True,
            "insights": {
                "total_spent": round(total_spent, 2),
                "transaction_count": len(transactions),
                "top_category": top_category,
                "category_breakdown": category_map,
                "insights": insights_list,
            },
            "transactions": transactions,  # Send all for now, frontend slices latest 7
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing dashboard data: {str(e)}"
        )


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with AI finance assistant using provided transaction context"""
    try:
        response = await chat_with_finance_assistant(
            request.question, request.transactions
        )

        return {"success": True, "response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
