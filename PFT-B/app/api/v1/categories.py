from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import SessionLocal
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from .auth import get_current_user  # senin mevcut auth dependency

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _to_out(c: Category) -> CategoryOut:
    # model → API şekli
    typ = "expense" if c.is_expense else "income"
    return CategoryOut(
        id=c.id,
        name=c.name,
        type=typ,         # "income"/"expense"
        color=c.color_hex,
        emoji=c.icon,
        isArchived=c.is_archived,
        isDefault=c.is_default,
    )

@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    rows = (
        db.query(Category)
        .filter(
            Category.is_archived == False,
            or_(Category.user_id == user.id, Category.user_id.is_(None)),
        )
        .order_by(Category.is_default.desc(), Category.name.asc())
        .all()
    )
    return [_to_out(c) for c in rows]

@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Aynı kullanıcıda aynı isim var mı?
    exists = (
        db.query(Category)
        .filter(Category.user_id == user.id, Category.name == body.name)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Category already exists")

    obj = Category(
        user_id=user.id,
        name=body.name,
        is_expense=(body.type == "expense"),
        color_hex=body.color,
        icon=body.emoji,
        is_default=False,
        is_archived=False,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)

@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    obj = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user.id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")

    if body.name is not None:
        # benzersizlik koru
        dup = (
            db.query(Category)
            .filter(Category.user_id == user.id, Category.name == body.name, Category.id != obj.id)
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="Category name already used")
        obj.name = body.name
    if body.type is not None:
        obj.is_expense = (body.type == "expense")
    if body.color is not None:
        obj.color_hex = body.color
    if body.emoji is not None:
        obj.icon = body.emoji
    if body.isArchived is not None:
        obj.is_archived = body.isArchived

    db.commit()
    db.refresh(obj)
    return _to_out(obj)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    obj = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user.id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(obj)
    db.commit()
