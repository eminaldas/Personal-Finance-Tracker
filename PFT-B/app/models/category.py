from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        # Kullanıcı içinde isim benzersiz (case-sensitive istemiyorsan uygulama katmanında lower() ile kontrol et)
        UniqueConstraint("user_id", "name", name="uq_categories_user_name"),
        Index("ix_categories_user", "user_id"),
        Index("ix_categories_archived", "is_archived"),
    )

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # NULL => global/default
    name        = Column(String(60), nullable=False)
    icon        = Column(String(40))
    color_hex   = Column(String(7))          # '#RRGGBB'
    is_expense  = Column(Boolean, nullable=False, default=True)
    is_default  = Column(Boolean, nullable=False, default=False)
    is_archived = Column(Boolean, nullable=False, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user        = relationship("User", backref="categories")
