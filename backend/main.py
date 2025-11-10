from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from gemini_helper import extract_bill_info, chat_with_finance_assistant
from utils import load_transactions, save_transaction, calculate_insights

app = FastAPI(title="AI Finance Analyzer API")

allowed_origins = os.getenv("DEV_DOMAIN")
if allowed_origins.startswith("http"):
    origins = [allowed_origins]
else:
    origins = [f"https://{allowed_origins}"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


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
        
        save_transaction(bill_data)
        
        return {
            "success": True,
            "message": "Bill processed successfully",
            "data": bill_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bill: {str(e)}")


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with AI finance assistant"""
    try:
        transactions = load_transactions()
        
        response = await chat_with_finance_assistant(request.question, transactions)
        
        return {
            "success": True,
            "response": response
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")


@app.get("/api/dashboard")
async def get_dashboard():
    """Get dashboard data with automatic insights"""
    try:
        transactions = load_transactions()
        insights = calculate_insights(transactions)
        
        return {
            "success": True,
            "transactions": transactions,
            "insights": insights
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")


@app.get("/api/transactions")
async def get_transactions():
    """Get all transactions"""
    try:
        transactions = load_transactions()
        return {
            "success": True,
            "transactions": transactions,
            "count": len(transactions)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
