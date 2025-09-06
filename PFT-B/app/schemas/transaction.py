from pydantic import BaseModel, Field, field_serializer
from typing import Optional


class TransactionBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0)
    categoryId: int = Field(..., alias="categoryId")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    note: Optional[str] = Field(default=None, max_length=300)

    class Config:
        populate_by_name = True


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    amount: Optional[float] = Field(default=None, gt=0)
    categoryId: Optional[int] = Field(default=None, alias="categoryId")
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    note: Optional[str] = Field(default=None, max_length=300)

    class Config:
        populate_by_name = True


class TransactionOut(BaseModel):
    id: int
    title: str
    amount: float
    categoryId: int = Field(alias="categoryId")
    date: str  # YYYY-MM-DD
    note: Optional[str] = None
    type: str  # "income" | "expense" (kategoriden türetilmiş)

    class Config:
        populate_by_name = True
