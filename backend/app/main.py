from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import (
    auth,
    products,
    cart,
    wishlist,
    reviews,
    addresses,
    orders,
    checkout,
)

# Import models so SQLAlchemy knows about all tables
from . import models


# ============================================================
# DATABASE & SEEDING
# ============================================================

from .database import SessionLocal, Base, engine
from .seed import seed_initial_products

Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    try:
        seed_initial_products(db)
    finally:
        db.close()

init_db()


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="LUXORA API",
    description="Backend API for the LUXORA e-commerce platform.",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://luxora-indol.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(addresses.router)
app.include_router(orders.router)
app.include_router(checkout.router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "LUXORA API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }