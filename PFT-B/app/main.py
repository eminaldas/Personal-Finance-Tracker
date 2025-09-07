from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth
from app.db.base import Base
from app.db.session import engine
from app.api.v1.categories import router as categories_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.transaction import router as transactions_router
from app.api.v1.dashboard import router as dashboard_router
app = FastAPI(title=settings.APP_NAME)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB tablolarını oluştur
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(categories_router, prefix=settings.API_PREFIX) 
app.include_router(budgets_router, prefix=settings.API_PREFIX) 
app.include_router(transactions_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX) 
@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}!"}
