from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .seed import seed_initial_products
from .migrate_marketplace import migrate

from . import models
from .routers import vendor

from .routers import (
    auth,
    products,
    cart,
    wishlist,
    reviews,
    addresses,
    orders,
    checkout,
    ai,
)


# ============================================================
# DATABASE & SEEDING
# ============================================================

Base.metadata.create_all(bind=engine)

# Bring existing SQLite installations forward before any router
# reads marketplace fields. The migration is idempotent.
if engine.dialect.name == "sqlite":
    migrate()


def init_db():
    """
    Initialize and seed the LUXORA database.

    Existing records are preserved by the seed function.
    """
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
    description=(
        "Backend API for the LUXORA e-commerce "
        "and AI-native agentic commerce platform."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",

        # Current LUXORA production frontend
        "https://luxora-j4w8qdgw0-abhinav-4b23.vercel.app",

        # Previous production frontend URLs
        "https://luxora-indol.vercel.app",
        "https://luxora-886n1x88f-abhinav-4b23.vercel.app",
        "https://luxora-psi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# COMMERCE ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(addresses.router)
app.include_router(orders.router)
app.include_router(checkout.router)
app.include_router(ai.router)
app.include_router(vendor.router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "LUXORA API is running",
        "status": "success",
        "platform": "AI-Native Agentic Commerce",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }