# app/api/v1/dashboard.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from datetime import date, datetime, timezone
from decimal import Decimal

from app.db.session import SessionLocal
from app.models.transaction import Transaction, TxnType
from app.models.category import Category
from app.models.budget import Budget
from app.schemas.dashboard import DashboardSummaryOut, CatStat, TxMini, BudgetUsage
from .auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _ym_to_dates(ym: str):
    y, m = int(ym[:4]), int(ym[5:7])
    start = date(y, m, 1)
    if m == 12:
        end = date(y+1, 1, 1)
    else:
        end = date(y, m+1, 1)
    return start, end

def _date_str(dt) -> str:
    return dt.date().isoformat()

@router.get("/summary", response_model=DashboardSummaryOut)
def dashboard_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),  # YYYY-MM
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    start, end = _ym_to_dates(month)

    # ---- Toplam gelir/gider ----
    totals = (
        db.query(
            func.coalesce(func.sum(case((Transaction.type == TxnType.income, Transaction.amount), else_=0)), 0).label("inc"),
            func.coalesce(func.sum(case((Transaction.type == TxnType.expense, Transaction.amount), else_=0)), 0).label("exp"),
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start,
            Transaction.occurred_at < end,
        )
        .one()
    )
    income_total = float(totals.inc or 0)
    expense_total = float(totals.exp or 0)
    net = income_total - expense_total

    # ---- Kategori kırılımı ----
    cat_rows = (
        db.query(
            Category.id.label("cid"),
            Category.name,
            Category.icon,
            Category.color_hex,
            Category.is_expense,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start,
            Transaction.occurred_at < end,
        )
        .group_by(Category.id, Category.name, Category.icon, Category.color_hex, Category.is_expense)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )
    by_category = [
        CatStat(
            categoryId=r.cid,
            name=r.name,
            emoji=r.icon,
            color=r.color_hex,
            type="expense" if r.is_expense else "income",
            total=float(r.total or 0),
        )
        for r in cat_rows
    ]

    # ---- Son işlemler (10 adet) ----
    recent_rows = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start,
            Transaction.occurred_at < end,
        )
        .order_by(Transaction.occurred_at.desc(), Transaction.id.desc())
        .limit(10)
        .all()
    )
    recent = [
        TxMini(
            id=tx.id,
            title=tx.title,
            amount=float(tx.amount),
            categoryId=tx.category_id,
            date=_date_str(tx.occurred_at),
            type=tx.type.value,
        )
        for tx in recent_rows
    ]

    # ---- Bütçe kullanımı ----
    # Bu ay için kullanıcının bütçeleri
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user.id, Budget.month_start == start)
        .all()
    )

    # Kategori başına harcama (expense) bu ay
    cat_spent = dict(
        db.query(
            Transaction.category_id,
            func.coalesce(func.sum(Transaction.amount), 0)
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start,
            Transaction.occurred_at < end,
            Transaction.type == TxnType.expense,
        )
        .group_by(Transaction.category_id)
        .all()
    )

    budget_usage = []
    for b in budgets:
        spent = float(cat_spent.get(b.category_id, 0.0))
        limit_ = float(b.limit_amount)
        usage = 0.0 if limit_ <= 0 else (spent / limit_) * 100.0
        budget_usage.append(
            BudgetUsage(
                budgetId=b.id,
                categoryId=b.category_id,
                month=month,
                limit=limit_,
                spent=spent,
                usagePct=round(usage, 2),
            )
        )

    return DashboardSummaryOut(
        month=month,
        incomeTotal=round(income_total, 2),
        expenseTotal=round(expense_total, 2),
        net=round(net, 2),
        byCategory=by_category,
        recent=recent,
        budgetUsage=budget_usage,
    )
