import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

TRANSACTIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "transactions.json")


def load_transactions() -> list:
    """Load transactions from JSON file"""
    try:
        with open(TRANSACTIONS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_transaction(transaction: dict) -> None:
    """Save a new transaction to JSON file"""
    transactions = load_transactions()
    transaction['id'] = len(transactions) + 1
    transaction['timestamp'] = datetime.now().isoformat()
    transactions.append(transaction)
    
    with open(TRANSACTIONS_FILE, 'w') as f:
        json.dump(transactions, f, indent=2)


def calculate_insights(transactions: list) -> dict:
    """Calculate automatic insights from transactions"""
    if not transactions:
        return {
            "total_spent": 0,
            "transaction_count": 0,
            "category_breakdown": {},
            "monthly_trend": None,
            "weekly_trend": None,
            "top_category": None,
            "insights": ["No transactions yet. Upload your first bill to get started!"]
        }

    total_spent = sum(t.get('total_amount', 0) for t in transactions)
    transaction_count = len(transactions)
    
    category_totals = defaultdict(float)
    for t in transactions:
        category = t.get('category', 'Other')
        category_totals[category] += t.get('total_amount', 0)
    
    category_breakdown = dict(category_totals)
    top_category = max(category_breakdown.items(), key=lambda x: x[1])[0] if category_breakdown else None
    
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    two_months_ago = now - timedelta(days=60)
    
    this_week_total = 0
    last_week_total = 0
    this_month_total = 0
    last_month_total = 0
    
    for t in transactions:
        try:
            trans_date = datetime.fromisoformat(t.get('timestamp', t.get('date', '')))
            amount = t.get('total_amount', 0)
            
            if trans_date >= week_ago:
                this_week_total += amount
            elif trans_date >= week_ago - timedelta(days=7):
                last_week_total += amount
            
            if trans_date >= month_ago:
                this_month_total += amount
            elif trans_date >= two_months_ago:
                last_month_total += amount
        except:
            continue
    
    insights = []
    
    insights.append(f"Total spent across all transactions: ${total_spent:.2f}")
    
    if top_category:
        top_amount = category_breakdown[top_category]
        top_percentage = (top_amount / total_spent * 100) if total_spent > 0 else 0
        insights.append(f"Your highest spending category is {top_category} at ${top_amount:.2f} ({top_percentage:.1f}%)")
    
    if this_week_total > 0 and last_week_total > 0:
        weekly_change = ((this_week_total - last_week_total) / last_week_total) * 100
        if abs(weekly_change) >= 10:
            direction = "up" if weekly_change > 0 else "down"
            insights.append(f"Weekly spending is {direction} {abs(weekly_change):.1f}% compared to last week")
    
    if this_month_total > 0 and last_month_total > 0:
        monthly_change = ((this_month_total - last_month_total) / last_month_total) * 100
        if abs(monthly_change) >= 10:
            direction = "increased" if monthly_change > 0 else "decreased"
            insights.append(f"Monthly spending {direction} by {abs(monthly_change):.1f}% compared to last month")
    
    avg_transaction = total_spent / transaction_count if transaction_count > 0 else 0
    insights.append(f"Average transaction amount: ${avg_transaction:.2f}")
    
    return {
        "total_spent": round(total_spent, 2),
        "transaction_count": transaction_count,
        "category_breakdown": category_breakdown,
        "top_category": top_category,
        "this_week_spending": round(this_week_total, 2),
        "this_month_spending": round(this_month_total, 2),
        "average_transaction": round(avg_transaction, 2),
        "insights": insights
    }
