# app/schemas/report.py
from pydantic import BaseModel
from typing import Optional, List, Literal

class ReportTxMini(BaseModel):
    id: int
    title: str
    amount: float
    categoryId: Optional[int] = None
    date: str          # YYYY-MM-DD
    type: Literal["income", "expense"]

class ReportKpis(BaseModel):
    incomeTotal: float
    expenseTotal: float
    net: float
    savingsRate: float            # %
    txCount: int
    avgTx: float
    largestExpense: Optional[ReportTxMini] = None
    mom: Optional[dict] = None    # { income, expense, net } -> % (float | null)

class CashflowDaily(BaseModel):
    date: str
    income: float
    expense: float
    net: float

class CashflowMonthly(BaseModel):
    month: str
    income: float
    expense: float
    net: float

class CatStat(BaseModel):
    categoryId: Optional[int] = None
    name: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    type: Literal["income", "expense"]
    total: float
    sharePct: float
    momPct: Optional[float] = None

class BudgetUsage(BaseModel):
    budgetId: int
    categoryId: Optional[int] = None
    limit: float
    spent: float
    usagePct: float
    status: Literal["ok", "hit", "over"]

class ReportOut(BaseModel):
    period: dict            # { start: "YYYY-MM", end: "YYYY-MM" }
    currency: str
    kpis: ReportKpis
    cashflow: dict          # { daily: CashflowDaily[], monthly: CashflowMonthly[] }
    byCategory: List[CatStat]
    budgetUsage: List[BudgetUsage]
    recent: List[ReportTxMini]
    recurring: List[dict]   # opsiyonel: basit çıkarım
    anomalies: List[dict]   # opsiyonel: basit çıkarım
