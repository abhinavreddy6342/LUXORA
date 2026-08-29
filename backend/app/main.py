from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://luxora-psi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Bring existing SQLite installations forward before any router reads the
# marketplace fields.  New databases already have these columns from the
# ORM metadata; the migration is idempotent for both cases.
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

        # LUXORA production frontend
        "https://luxora-indol.vercel.app",
        "https://luxora-886n1x88f-abhinav-4b23.vercel.app",
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
