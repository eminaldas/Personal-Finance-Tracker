# app/schemas/dashboard.py
from pydantic import BaseModel
from typing import List, Optional

class CatStat(BaseModel):
    categoryId: int
    name: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    type: str               # "income" | "expense"
    total: float

class BudgetUsage(BaseModel):
    budgetId: int
    categoryId: Optional[int] = None
    month: str              # YYYY-MM
    limit: float
    spent: float
    usagePct: float         # 0..100+

class TxMini(BaseModel):
    id: int
    title: str
    amount: float
    categoryId: int
    date: str               # YYYY-MM-DD
    type: str               # "income" | "expense"

class DashboardSummaryOut(BaseModel):
    month: str              # YYYY-MM
    incomeTotal: float
    expenseTotal: float
    net: float
    byCategory: List[CatStat]
    recent: List[TxMini]
    budgetUsage: List[BudgetUsage]
