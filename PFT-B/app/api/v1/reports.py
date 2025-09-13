# app/api/v1/reports.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_, literal_column
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional, List, Tuple

from app.db.session import SessionLocal
from app.models.transaction import Transaction, TxnType
from app.models.category import Category
from app.models.budget import Budget
from app.api.v1.auth import get_current_user
from app.schemas.report import (
    ReportOut, ReportKpis, CashflowDaily, CashflowMonthly,
    CatStat, BudgetUsage, ReportTxMini
)

router = APIRouter(prefix="/reports", tags=["reports"])

# ----------------- utils -----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def parse_ym(ym: str) -> date:
    y, m = ym.split("-")
    return date(int(y), int(m), 1)

def ym(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"

def month_end(d: date) -> date:
    nxt = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
    return nxt - timedelta(days=1)

def prev_month_first(d: date) -> date:
    y = d.year
    m = d.month - 1
    if m == 0:
        y -= 1
        m = 12
    return date(y, m, 1)

def to_iso(d: datetime) -> str:
    return d.date().isoformat()

# ----------------- main endpoint -----------------
@router.get("", response_model=ReportOut)
def get_report(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    month: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    start: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    end:   Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
):
    """
    Tek ay:  /reports?month=2025-09
    Aralık:  /reports?start=2025-07&end=2025-09
    """
    if not month and not (start and end):
        raise HTTPException(status_code=400, detail="Provide ?month=YYYY-MM or ?start=YYYY-MM&end=YYYY-MM")

    if month:
        start_d = parse_ym(month)
        end_d = start_d
    else:
        start_d = parse_ym(start)  # type: ignore
        end_d   = parse_ym(end)    # type: ignore

    # datetime aralığı (UTC midnight)
    start_dt = datetime(start_d.year, start_d.month, 1, tzinfo=timezone.utc)
    end_dt   = datetime(end_d.year, end_d.month, month_end(end_d).day, 23, 59, 59, tzinfo=timezone.utc)

    # -------- KPIs: income / expense / net / count / avg / largest --------
    sums = (
        db.query(
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0)
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .group_by(Transaction.type)
        .all()
    )
    income = float(next((s[1] for s in sums if s[0] == TxnType.income), 0.0))
    expense = float(next((s[1] for s in sums if s[0] == TxnType.expense), 0.0))
    net = income - expense

    tx_count = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
        Transaction.occurred_at >= start_dt,
        Transaction.occurred_at <= end_dt
    ).scalar() or 0

    total_abs = income + expense
    avg_tx = float(total_abs / tx_count) if tx_count > 0 else 0.0
    savings_rate = float((net / income) * 100) if income > 0 else 0.0

    largest_row = (
        db.query(
            Transaction.id, Transaction.title, Transaction.amount,
            Transaction.category_id, Transaction.occurred_at, Transaction.type
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.type == TxnType.expense,
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .order_by(Transaction.amount.desc())
        .first()
    )
    largest = None
    if largest_row:
        largest = ReportTxMini(
            id=largest_row.id,
            title=largest_row.title,
            amount=float(largest_row.amount),
            categoryId=largest_row.category_id,
            date=to_iso(largest_row.occurred_at),
            type="expense",
        )

    # -------- MoM (%) (tek ay için anlamlı) --------
    mom = None
    if month:
        prev_first = prev_month_first(start_d)
        prev_start = datetime(prev_first.year, prev_first.month, 1, tzinfo=timezone.utc)
        prev_end = datetime(prev_first.year, prev_first.month, month_end(prev_first).day, 23, 59, 59, tzinfo=timezone.utc)

        prev_sums = (
            db.query(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == user.id,
                Transaction.deleted_at.is_(None),
                Transaction.occurred_at >= prev_start,
                Transaction.occurred_at <= prev_end
            )
            .group_by(Transaction.type)
            .all()
        )
        pincome = float(next((s[1] for s in prev_sums if s[0] == TxnType.income), 0.0))
        pexpense = float(next((s[1] for s in prev_sums if s[0] == TxnType.expense), 0.0))
        pnet = pincome - pexpense

        def pct(a: float, b: float) -> Optional[float]:
            return None if b == 0 else ((a - b) / abs(b)) * 100

        mom = {
            "income": pct(income, pincome),
            "expense": pct(expense, pexpense),
            "net": pct(net, pnet),
        }

    kpis = ReportKpis(
        incomeTotal=income,
        expenseTotal=expense,
        net=net,
        savingsRate=savings_rate,
        txCount=tx_count,
        avgTx=avg_tx,
        largestExpense=largest,
        mom=mom
    )

    # -------- Cashflow daily --------
    daily_rows = (
        db.query(
            func.date_trunc("day", Transaction.occurred_at).label("d"),
            func.sum(case((Transaction.type == TxnType.income, Transaction.amount), else_=0)).label("inc"),
            func.sum(case((Transaction.type == TxnType.expense, Transaction.amount), else_=0)).label("exp"),
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .group_by("d")
        .order_by("d")
        .all()
    )
    daily = [
        CashflowDaily(
            date=to_iso(r[0]),
            income=float(r[1] or 0),
            expense=float(r[2] or 0),
            net=float((r[1] or 0) - (r[2] or 0)),
        )
        for r in daily_rows
    ]

    # -------- Cashflow monthly (range ise anlamlı) --------
    # Aynı sorgudan ay bazlı grup:
    monthly_rows = (
        db.query(
            func.to_char(func.date_trunc("month", Transaction.occurred_at), "YYYY-MM").label("m"),
            func.sum(case((Transaction.type == TxnType.income, Transaction.amount), else_=0)).label("inc"),
            func.sum(case((Transaction.type == TxnType.expense, Transaction.amount), else_=0)).label("exp"),
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .group_by("m")
        .order_by("m")
        .all()
    )
    monthly = [
        CashflowMonthly(
            month=r[0],
            income=float(r[1] or 0),
            expense=float(r[2] or 0),
            net=float((r[1] or 0) - (r[2] or 0)),
        )
        for r in monthly_rows
    ]

    # -------- Kategori kırılımı (expense ağırlıklı) --------
    cat_rows = (
        db.query(
            Category.id, Category.name, Category.icon, Category.color_hex, Category.is_expense,
            func.sum(Transaction.amount).label("total")
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .group_by(Category.id, Category.name, Category.icon, Category.color_hex, Category.is_expense)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )
    tot_expense = sum(float(r[5]) for r in cat_rows if r[4] is True)
    by_cat: List[CatStat] = []
    for r in cat_rows:
        total = float(r[5] or 0)
        typ = "expense" if r[4] else "income"
        share = (total / tot_expense * 100) if (typ == "expense" and tot_expense > 0) else 0.0
        by_cat.append(
            CatStat(
                categoryId=r[0],
                name=r[1],
                emoji=r[2],
                color=r[3],
                type=typ, total=total, sharePct=share, momPct=None
            )
        )

    # -------- Budget usage (tek ayda) --------
    budget_usage: List[BudgetUsage] = []
    if month:
        m_first = parse_ym(month)
        q = (
            db.query(
                Budget.id.label("bid"),
                Budget.category_id,
                Budget.limit_amount,
                func.coalesce(func.sum(Transaction.amount), 0).label("spent"),
            )
            .outerjoin(
                Transaction,
                and_(
                    Transaction.user_id == Budget.user_id,
                    Transaction.deleted_at.is_(None),
                    Transaction.type == TxnType.expense,
                    Transaction.category_id == Budget.category_id,
                    func.date_trunc("month", Transaction.occurred_at) == Budget.month_start,
                ),
            )
            .filter(Budget.user_id == user.id, Budget.month_start == m_first)
            .group_by(Budget.id, Budget.category_id, Budget.limit_amount)
            .all()
        )
        for row in q:
            limit_v = float(row[2])
            spent_v = float(row[3] or 0)
            pct = (spent_v / limit_v * 100) if limit_v > 0 else 0.0
            status = "ok"
            if pct >= 100.0:
                status = "hit" if pct == 100.0 else "over"
            budget_usage.append(
                BudgetUsage(
                    budgetId=row[0],
                    categoryId=row[1],
                    limit=limit_v,
                    spent=spent_v,
                    usagePct=pct,
                    status=status
                )
            )

    # -------- Recent (son 20 işlem) --------
    recent_rows = (
        db.query(
            Transaction.id, Transaction.title, Transaction.amount,
            Transaction.category_id, Transaction.occurred_at, Transaction.type
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.deleted_at.is_(None),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt
        )
        .order_by(Transaction.occurred_at.desc(), Transaction.id.desc())
        .limit(20)
        .all()
    )
    recent = [
        ReportTxMini(
            id=r[0], title=r[1], amount=float(r[2]), categoryId=r[3],
            date=to_iso(r[4]), type=r[5].value
        )
        for r in recent_rows
    ]

    # (opsiyonel) basit recurring/anomalies stub
    recurring = []
    anomalies = []

    return ReportOut(
        period={"start": ym(start_d), "end": ym(end_d)},
        currency="USD",
        kpis=kpis,
        cashflow={"daily": daily, "monthly": monthly},
        byCategory=by_cat,
        budgetUsage=budget_usage,
        recent=recent,
        recurring=recurring,
        anomalies=anomalies,
    )
