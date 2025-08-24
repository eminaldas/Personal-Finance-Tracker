from sqlalchemy import Column, Integer, String, SmallInteger, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme            = Column(String(12), nullable=False, default="system")  # system|light|dark
    currency_code    = Column(String(3), nullable=False, default="TRY")
    first_day_of_month = Column(SmallInteger, nullable=False, default=1)     # 1..28
    locale           = Column(String(16), default="tr-TR")
    updated_at       = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="settings", uselist=False)
