# ============================================================
# WasteWise Backend — FastAPI Application Main
# ============================================================
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine, Base, SessionLocal
import models
from routers import auth, waste_records, food_items, analytics, recommendations, notifications, rescue

# Initialize tables
Base.metadata.create_all(bind=engine)

# Additive migration for databases created before waste-record linking existed.
if "source_record_id" not in {column["name"] for column in inspect(engine).get_columns("surplus_listings")}:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE surplus_listings ADD COLUMN source_record_id INTEGER"))
        connection.execute(text("CREATE INDEX ix_surplus_listings_source_record_id ON surplus_listings (source_record_id)"))

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
app.include_router(rescue.router)


@app.on_event("startup")
def seed_first_deployment() -> None:
    """Provision a configured production administrator or the local demo."""
    production = os.getenv("WASTEWISE_ENV", "development").lower() == "production"
    if production:
        bootstrap_email = os.getenv("WASTEWISE_BOOTSTRAP_EMAIL", "").strip()
        bootstrap_password = os.getenv("WASTEWISE_BOOTSTRAP_PASSWORD", "")
        if not bootstrap_email or not bootstrap_password:
            raise RuntimeError(
                "Set WASTEWISE_BOOTSTRAP_EMAIL and WASTEWISE_BOOTSTRAP_PASSWORD "
                "before starting a production deployment."
            )
        if len(bootstrap_password) < 12:
            raise RuntimeError("WASTEWISE_BOOTSTRAP_PASSWORD must be at least 12 characters.")

        from routers.auth import hash_password

        db = SessionLocal()
        try:
            existing_user = db.query(models.User).filter(
                models.User.email == bootstrap_email
            ).first()
            if existing_user is None:
                db.add(models.User(
                    name=os.getenv("WASTEWISE_BOOTSTRAP_NAME", "WasteWise Administrator"),
                    email=bootstrap_email,
                    hashed_password=hash_password(bootstrap_password),
                    role="Canteen Administrator",
                    canteen_name=os.getenv("WASTEWISE_BOOTSTRAP_CANTEEN", "WasteWise Canteen"),
                ))
                db.commit()
        finally:
            db.close()
        return

    # Populate a brand-new development database with demo data.
    db = SessionLocal()
    try:
        has_users = db.query(models.User.id).first() is not None
    finally:
        db.close()

    if not has_users:
        # Import lazily to avoid a router/seed import cycle while the app starts.
        from seed import seed_database
        seed_database()

    # Older local databases may already contain users, which skips the full
    # seed above. Keep the documented demo account available without clearing
    # any existing users or application data.
    from routers.auth import hash_password

    demo_email = "naise.shekhar@vsit.edu.in"
    db = SessionLocal()
    try:
        demo_user = db.query(models.User).filter(models.User.email == demo_email).first()
        if demo_user is None:
            demo_user = models.User(
                name="Naise Shekhar",
                email=demo_email,
                hashed_password=hash_password("admin@123"),
                role="Canteen Administrator",
                canteen_name="VSIT Canteen — Main Block",
            )
            db.add(demo_user)
            db.commit()

        partner_email = "rescue@wastewise.org"
        partner = db.query(models.User).filter(models.User.email == partner_email).first()
        if partner is None:
            db.add(models.User(
                name="Community Food Rescue",
                email=partner_email,
                hashed_password=hash_password("rescue@123"),
                role="Food Rescue Partner",
                canteen_name="Community Food Rescue Network",
            ))
            db.commit()
    finally:
        db.close()

    # Add a rolling demo history without deleting or rewriting real records.
    from seed import ensure_demo_history
    ensure_demo_history()


@app.get("/")
def root():
    return {
        "app": "WasteWise API",
        "tagline": "Track Waste. Discover Insights. Serve Smarter.",
        "status": "healthy",
    }
