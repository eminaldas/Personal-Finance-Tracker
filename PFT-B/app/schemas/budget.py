from pydantic import BaseModel, Field, field_serializer
from datetime import date

def ym_to_date(ym: str) -> date:
    y, m = ym.split("-")
    return date(int(y), int(m), 1)

class BudgetBase(BaseModel):
    categoryId: int | None = Field(None, alias="categoryId")
    month: str                      # "YYYY-MM"
    limit: float
    class Config:
        populate_by_name = True

class BudgetCreate(BudgetBase):
    notify: bool = True

class BudgetUpdate(BaseModel):
    categoryId: int | None = Field(None, alias="categoryId")
    month: str | None = None
    limit: float | None = None
    notify: bool | None = None
    class Config:
        populate_by_name = True

class BudgetOut(BudgetBase):
    id: int
    notify: bool
    # month DB'den date gelirse "YYYY-MM" olarak serileştir
    @field_serializer("month")
    def serialize_month(self, v):
        if isinstance(v, date):
            return v.strftime("%Y-%m")
        return v
