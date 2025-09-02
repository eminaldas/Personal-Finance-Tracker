from pydantic import BaseModel, Field
from typing import Literal

CategoryType = Literal["income", "expense"]

class CategoryBase(BaseModel):
    name: str
    type: CategoryType
    color: str = Field(..., pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")  # <-- pattern!
    emoji: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = None
    type: CategoryType | None = None
    color: str | None = Field(None, pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    emoji: str | None = None
    isArchived: bool | None = Field(None, alias="isArchived")

    class Config:
        populate_by_name = True

class CategoryOut(CategoryBase):
    id: int
    isArchived: bool = False
    isDefault: bool = False
