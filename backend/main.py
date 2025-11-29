from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Optional, Any

from gemini_helper import extract_bill_info, chat_with_finance_assistant

app = FastAPI(title="AI Finance Analyzer API")

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

        # Return data directly, do not save to server
        return {
            "success": True,
            "message": "Bill processed successfully",
            "data": bill_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bill: {str(e)}")


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
