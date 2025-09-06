from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.session import SessionLocal
from app.models.transaction import Transaction, TxnType
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionOut
)
from .auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- helpers ----------
def _parse_date(d: str) -> datetime:
    # store as UTC midnight
    y, m, day = map(int, (d[0:4], d[5:7], d[8:10]))
    return datetime(y, m, day, 0, 0, 0, tzinfo=timezone.utc)

def _date_str(dt: datetime) -> str:
    return dt.date().isoformat()

def _derive_type_from_category(cat: Category) -> TxnType:
    return TxnType.expense if cat.is_expense else TxnType.income

def _to_out(tx: Transaction) -> TransactionOut:
    return TransactionOut(
        id=tx.id,
        title=tx.title,
        amount=float(tx.amount),
        categoryId=tx.category_id,
        date=_date_str(tx.occurred_at),
        note=tx.note,
        type=tx.type.value,
    )


# ---------- list ----------
@router.get("", response_model=List[TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    start: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end:   Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    categoryId: Optional[int] = Query(default=None),
    type: Optional[str] = Query(default=None, pattern=r"^(income|expense)$"),
    q: Optional[str] = Query(default=None, min_length=1, max_length=120),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    qs = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
    )

    if start:
        qs = qs.filter(Transaction.occurred_at >= _parse_date(start))
    if end:
        # gün sonu
        end_dt = _parse_date(end).replace(hour=23, minute=59, second=59)
        qs = qs.filter(Transaction.occurred_at <= end_dt)
    if categoryId is not None:
        qs = qs.filter(Transaction.category_id == categoryId)
    if type:
        qs = qs.filter(Transaction.type == TxnType(type))
    if q:
        like = f"%{q.lower()}%"
        qs = qs.filter(or_(Transaction.title.ilike(like), Transaction.note.ilike(like)))

    rows = qs.order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()
    return [_to_out(tx) for tx in rows]


# ---------- create ----------
@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    cat = db.query(Category).filter(
        or_(Category.user_id == user.id, Category.user_id.is_(None)),
        Category.id == body.categoryId,
        Category.is_archived == False,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    tx = Transaction(
        user_id=user.id,
        category_id=body.categoryId,
        type=_derive_type_from_category(cat),
        title=body.title,
        amount=Decimal(str(body.amount)),
        occurred_at=_parse_date(body.date),
        note=body.note,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return _to_out(tx)


# ---------- update ----------
@router.patch("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if body.categoryId is not None and body.categoryId != tx.category_id:
        cat = db.query(Category).filter(
            or_(Category.user_id == user.id, Category.user_id.is_(None)),
            Category.id == body.categoryId,
            Category.is_archived == False,
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        tx.category_id = body.categoryId
        tx.type = _derive_type_from_category(cat)

    if body.title is not None:
        tx.title = body.title
    if body.amount is not None:
        tx.amount = Decimal(str(body.amount))
    if body.date is not None:
        tx.occurred_at = _parse_date(body.date)
    if body.note is not None:
        tx.note = body.note

    db.commit()
    db.refresh(tx)
    return _to_out(tx)


# ---------- delete (soft) ----------
@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id,
        Transaction.deleted_at.is_(None),
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx.deleted_at = datetime.now(tz=timezone.utc)
    db.commit()
