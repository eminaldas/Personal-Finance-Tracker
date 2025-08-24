from enum import Enum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum,
    Numeric, Index, CheckConstraint
)
from sqlalchemy.sql import func, text
from sqlalchemy.orm import relationship
from app.db.base import Base

class TxnType(str, Enum):
    income  = "income"
    expense = "expense"

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        # amount > 0 ve occurred_at <= now()
        CheckConstraint("amount > 0", name="ck_transactions_amount_pos"),
        CheckConstraint("occurred_at <= NOW()", name="ck_transactions_not_future"),
        Index("ix_tx_user_date", "user_id", "occurred_at"),
        Index("ix_tx_type", "type"),
        Index("ix_tx_category", "category_id"),
    )

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"))
    type        = Column(SAEnum(TxnType, name="txn_type"), nullable=False)
    amount      = Column(Numeric(12, 2), nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    note        = Column(String(300))
    deleted_at  = Column(DateTime(timezone=True))  # soft delete
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user        = relationship("User", backref="transactions")
    category    = relationship("Category", backref="transactions")
