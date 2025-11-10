import json
import os
from google import genai
from google.genai import types
from pydantic import BaseModel

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class ItemData(BaseModel):
    name: str
    price: float


class BillData(BaseModel):
    date: str
    items: list[ItemData]
    total_amount: float
    category: str
    merchant: str


async def extract_bill_info(image_bytes: bytes, mime_type: str) -> dict:
    """Extract bill information using Gemini Vision API"""
    try:
        prompt = (
            "Analyze this receipt/bill image and extract the following information. "
            "Return your response as valid JSON with this structure:\n"
            "{\n"
            '  "date": "YYYY-MM-DD",\n'
            '  "merchant": "store name",\n'
            '  "category": "one of: Groceries, Transport, Food, Shopping, Utilities, Entertainment, Healthcare, Other",\n'
            '  "total_amount": numeric value (just the number),\n'
            '  "items": [{"name": "item name", "price": numeric price}]\n'
            "}\n\n"
            "Return ONLY the JSON object, nothing else."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ],
        )

        if response.text:
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            data = json.loads(text)
            return {
                "date": data.get("date", ""),
                "merchant": data.get("merchant", "Unknown"),
                "category": data.get("category", "Other"),
                "total_amount": float(data.get("total_amount", 0)),
                "items": data.get("items", [])
            }
        else:
            raise ValueError("Empty response from Gemini Vision")

    except Exception as e:
        raise Exception(f"Failed to extract bill info: {str(e)}")


async def chat_with_finance_assistant(user_question: str, transactions_data: list) -> str:
    """Answer finance questions using Gemini"""
    try:
        system_prompt = (
            "You are a helpful personal finance assistant. "
            "Answer the user's questions about their spending based on the transaction data provided. "
            "Be concise, helpful, and provide specific numbers when relevant. "
            "If asked about trends, calculate percentages and comparisons."
        )

        transactions_summary = json.dumps(transactions_data, indent=2)
        prompt = f"Transaction Data:\n{transactions_summary}\n\nUser Question: {user_question}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(system_instruction=system_prompt),
        )

        return response.text or "I couldn't process your question."

    except Exception as e:
        raise Exception(f"Failed to get chat response: {str(e)}")
