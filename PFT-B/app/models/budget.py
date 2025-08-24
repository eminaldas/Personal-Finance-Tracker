from sqlalchemy import (
    Column, Integer, Date, DateTime, ForeignKey, Numeric, Boolean,
    UniqueConstraint, Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month_start", name="uq_budgets_user_cat_month"),
        Index("ix_budget_user_month", "user_id", "month_start"),
    )

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id  = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)  # NULL => genel bütçe
    month_start  = Column(Date, nullable=False)                 # örn: 2025-08-01
    limit_amount = Column(Numeric(12, 2), nullable=False)
    notify       = Column(Boolean, nullable=False, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user     = relationship("User", backref="budgets")
    category = relationship("Category", backref="budgets")
