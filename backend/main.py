# ============================================================
# WasteWise Backend — FastAPI Application Main
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
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


@app.get("/")
def root():
    return {
        "app": "WasteWise API",
        "tagline": "Track Waste. Discover Insights. Serve Smarter.",
        "status": "healthy",
    }
