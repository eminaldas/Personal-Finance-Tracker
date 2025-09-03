from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import date
from app.db.session import SessionLocal
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetUpdate
from .auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _ym_to_date(ym: str) -> date:
    y, m = ym.split("-")
    return date(int(y), int(m), 1)


def _date_to_ym(d: date) -> str:
    return d.strftime("%Y-%m")

def _to_out(b: Budget) -> BudgetOut:
    return BudgetOut(
        id=b.id,
        categoryId=b.category_id,
        month=_date_to_ym(b.month_start),  # <-- burada stringe çevir
        limit=float(b.limit_amount),
        notify=b.notify,
    )

@router.get("", response_model=list[BudgetOut])
def list_budgets(
    month: str | None = Query(default=None, description="YYYY-MM"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Budget).filter(Budget.user_id == user.id)
    if month:
        q = q.filter(Budget.month_start == _ym_to_date(month))
    rows = q.order_by(Budget.created_at.desc()).all()
    return [_to_out(b) for b in rows]

@router.get("/{budget_id}", response_model=BudgetOut)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _to_out(b)

@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    body: BudgetCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # unique (user, category, month) kısıtı var → hatayı yakalayıp 400 döndürmek için ön kontrol
    month_start = _ym_to_date(body.month)

    if body.categoryId is not None:
        # kategori kullanıcının mı veya global mi?
        cat = db.query(Category).filter(
            Category.id == body.categoryId,
            # kullanıcının kategorisi veya global
            (Category.user_id == user.id) | (Category.user_id.is_(None))
        ).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Invalid categoryId")

    exists = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category_id.is_(body.categoryId) if body.categoryId is None else Budget.category_id == body.categoryId,
        Budget.month_start == month_start
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Budget already exists for this scope")

    obj = Budget(
        user_id=user.id,
        category_id=body.categoryId,
        month_start=month_start,
        limit_amount=Decimal(str(body.limit)),
        notify=body.notify,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)

@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    obj = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Budget not found")

    if body.categoryId is not None:
        if body.categoryId is not None:
            cat = db.query(Category).filter(
                Category.id == body.categoryId,
                (Category.user_id == user.id) | (Category.user_id.is_(None))
            ).first()
            if not cat:
                raise HTTPException(status_code=400, detail="Invalid categoryId")
        obj.category_id = body.categoryId

    if body.month is not None:
        obj.month_start = _ym_to_date(body.month)

    if body.limit is not None:
        obj.limit_amount = Decimal(str(body.limit))

    if body.notify is not None:
        obj.notify = body.notify

    db.commit()
    db.refresh(obj)
    return _to_out(obj)

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    obj = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(obj)
    db.commit()
    return {"id": budget_id}
