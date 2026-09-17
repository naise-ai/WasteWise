# ============================================================
# WasteWise Backend — FastAPI Application Main
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models
from routers import auth, waste_records, food_items, analytics, recommendations, notifications

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WasteWise API",
    description="Canteen Food Waste Monitoring and Reduction Recommendation System API",
    version="1.0.0",
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(waste_records.router)
app.include_router(food_items.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(notifications.router)


@app.on_event("startup")
def seed_first_deployment() -> None:
    """Populate a brand-new database so the public demo is usable immediately."""
    db = SessionLocal()
    try:
        has_users = db.query(models.User.id).first() is not None
    finally:
        db.close()

    if not has_users:
        # Import lazily to avoid a router/seed import cycle while the app starts.
        from seed import seed_database
        seed_database()


@app.get("/")
def root():
    return {
        "app": "WasteWise API",
        "tagline": "Track Waste. Discover Insights. Serve Smarter.",
        "status": "healthy",
    }
