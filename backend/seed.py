# ============================================================
# WasteWise Backend — Database Seeder
# ============================================================
from datetime import date, timedelta, datetime
from database import SessionLocal, engine, Base
import models
from routers.auth import hash_password
from services.recommendation_engine import RuleBasedRecommendationEngine

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing if any
    db.query(models.WasteRecord).delete()
    db.query(models.FoodItem).delete()
    db.query(models.Recommendation).delete()
    db.query(models.Notification).delete()
    db.query(models.User).delete()
    db.commit()

    print("Seeding Admin User...")
    admin = models.User(
        name="Naise Shekhar",
        email="naise.shekhar@vsit.edu.in",
        hashed_password=hash_password("admin@123"),
        role="Canteen Administrator",
        canteen_name="VSIT Canteen — Main Block",
    )
    db.add(admin)
    db.commit()

    print("Seeding Food Items...")
    food_items_raw = [
        ("Rice", "Rice & Grains", 60.0),
        ("Dal Tadka", "Dal & Lentils", 80.0),
        ("Chapati", "Breads", 50.0),
        ("Mixed Vegetable", "Vegetables", 70.0),
        ("Paneer Curry", "Curry", 180.0),
        ("Biryani", "Rice & Grains", 120.0),
        ("Poha", "Rice & Grains", 45.0),
        ("Idli", "Rice & Grains", 40.0),
        ("Samosa", "Snacks", 90.0),
        ("Vada Pav", "Snacks", 75.0),
        ("Pulao", "Rice & Grains", 90.0),
        ("Upma", "Rice & Grains", 40.0),
        ("Rajma", "Dal & Lentils", 85.0),
        ("Chole", "Dal & Lentils", 90.0),
        ("Khichdi", "Rice & Grains", 55.0),
    ]

    food_item_map = {}
    for name, cat, cost in food_items_raw:
        fi = models.FoodItem(name=name, category=cat, cost_per_kg=cost)
        db.add(fi)
        db.commit()
        db.refresh(fi)
        food_item_map[name] = fi

    print("Seeding Waste Records...")
    today = date.today()

    records_template = [
        # (days_ago, meal, food_name, prepared, consumed, students, reason, notes)
        (0, "Breakfast", "Poha", 25.0, 22.0, 180, "Low demand", None),
        (0, "Lunch", "Rice", 60.0, 49.0, 380, "Overproduction", "High demand day but overestimated"),
        (0, "Lunch", "Dal Tadka", 40.0, 34.0, 380, "Overproduction", None),
        (0, "Lunch", "Mixed Vegetable", 30.0, 26.0, 380, "Low demand", None),
        (0, "Snacks", "Samosa", 15.0, 14.2, 200, "Other", "Almost all consumed"),
        (0, "Dinner", "Biryani", 35.0, 26.0, 290, "Overproduction", None),
        (0, "Dinner", "Chapati", 20.0, 18.0, 290, "Plate waste", None),

        (1, "Breakfast", "Idli", 30.0, 28.0, 195, "Other", None),
        (1, "Lunch", "Rice", 58.0, 44.0, 360, "Overproduction", None),
        (1, "Lunch", "Rajma", 35.0, 31.0, 360, "Low demand", None),
        (1, "Lunch", "Chapati", 22.0, 20.0, 360, "Plate waste", None),
        (1, "Snacks", "Vada Pav", 20.0, 19.0, 210, "Low demand", None),
        (1, "Dinner", "Khichdi", 28.0, 22.0, 250, "Spoilage", "Quality degraded by evening"),

        (2, "Breakfast", "Upma", 20.0, 14.0, 150, "Poor quality", "Texture complaints"),
        (2, "Lunch", "Rice", 65.0, 50.0, 400, "Overproduction", None),
        (2, "Lunch", "Dal Tadka", 42.0, 36.0, 400, "Low demand", None),
        (2, "Lunch", "Paneer Curry", 18.0, 17.0, 400, "Plate waste", None),
        (2, "Snacks", "Poha", 18.0, 16.0, 160, "Low demand", None),
        (2, "Dinner", "Biryani", 40.0, 28.0, 300, "Overproduction", None),

        (3, "Breakfast", "Poha", 22.0, 20.0, 170, "Other", None),
        (3, "Lunch", "Rice", 55.0, 47.0, 350, "Low demand", None),
        (3, "Lunch", "Chole", 32.0, 28.0, 350, "Low demand", None),
        (3, "Lunch", "Chapati", 18.0, 17.0, 350, "Plate waste", None),
        (3, "Dinner", "Pulao", 30.0, 24.0, 260, "Low demand", None),

        (4, "Breakfast", "Idli", 28.0, 26.0, 185, "Plate waste", None),
        (4, "Lunch", "Rice", 62.0, 46.0, 390, "Overproduction", None),
        (4, "Lunch", "Dal Tadka", 38.0, 32.0, 390, "Overproduction", None),
        (4, "Lunch", "Mixed Vegetable", 28.0, 25.0, 390, "Low demand", None),
        (4, "Snacks", "Samosa", 18.0, 17.0, 220, "Other", None),
        (4, "Dinner", "Biryani", 38.0, 27.0, 280, "Overproduction", None),

        (5, "Breakfast", "Upma", 22.0, 20.0, 165, "Low demand", None),
        (5, "Lunch", "Rice", 68.0, 52.0, 410, "Overproduction", None),
        (5, "Lunch", "Rajma", 30.0, 26.0, 410, "Low demand", None),
        (5, "Lunch", "Chapati", 24.0, 21.0, 410, "Plate waste", None),
        (5, "Dinner", "Paneer Curry", 16.0, 15.0, 240, "Other", None),

        (6, "Breakfast", "Poha", 24.0, 21.0, 175, "Low demand", None),
        (6, "Lunch", "Rice", 70.0, 54.0, 420, "Overproduction", None),
        (6, "Lunch", "Dal Tadka", 45.0, 37.0, 420, "Overproduction", None),
        (6, "Lunch", "Mixed Vegetable", 32.0, 26.0, 420, "Low demand", None),
        (6, "Snacks", "Vada Pav", 22.0, 20.0, 230, "Other", None),
        (6, "Dinner", "Khichdi", 25.0, 21.0, 210, "Spoilage", None),

        (7, "Lunch", "Rice", 60.0, 50.0, 370, "Overproduction", None),
        (7, "Lunch", "Dal Tadka", 38.0, 33.0, 370, "Low demand", None),
        (8, "Lunch", "Rice", 58.0, 49.0, 360, "Low demand", None),
        (8, "Dinner", "Biryani", 36.0, 28.0, 270, "Overproduction", None),
        (9, "Lunch", "Rice", 63.0, 52.0, 390, "Overproduction", None),
        (9, "Lunch", "Paneer Curry", 20.0, 19.0, 390, "Other", None),
        (10, "Breakfast", "Idli", 32.0, 30.0, 200, "Plate waste", None),
        (10, "Lunch", "Rice", 65.0, 51.0, 400, "Overproduction", None),
        (11, "Lunch", "Rice", 55.0, 47.0, 350, "Low demand", None),
        (11, "Lunch", "Chole", 28.0, 25.0, 350, "Low demand", None),
        (12, "Lunch", "Rice", 62.0, 46.0, 385, "Overproduction", None),
        (12, "Dinner", "Pulao", 28.0, 22.0, 240, "Low demand", None),
        (13, "Lunch", "Rice", 60.0, 50.0, 375, "Overproduction", None),
        (14, "Lunch", "Rice", 58.0, 48.0, 365, "Low demand", None),
    ]

    for days_ago, meal, fname, prep, cons, students, reason, notes in records_template:
        fi = food_item_map[fname]
        rec_date = today - timedelta(days=days_ago)
        wasted = round(prep - cons, 3)
        pct = round((wasted / prep) * 100, 1)
        if pct < 10.0:
            level = "Low"
        elif pct < 20.0:
            level = "Moderate"
        elif pct < 35.0:
            level = "High"
        else:
            level = "Critical"

        cost_lost = round(wasted * fi.cost_per_kg, 2)

        record = models.WasteRecord(
            date=rec_date,
            meal=meal,
            food_item_id=fi.id,
            food_item_name=fname,
            prepared=prep,
            consumed=cons,
            wasted=wasted,
            waste_percentage=pct,
            students_served=students,
            reason=reason,
            notes=notes,
            level=level,
            cost_lost=cost_lost,
            created_at=datetime.combine(rec_date, datetime.min.time()),
        )
        db.add(record)

    db.commit()

    print("Seeding Notifications...")
    notifs = [
        models.Notification(
            type="high",
            title="High Rice Waste Detected",
            message="Rice waste has exceeded 20% for 5 consecutive days. Consider reducing preparation by 10-12%.",
            created_at=datetime.utcnow() - timedelta(minutes=30),
        ),
        models.Notification(
            type="medium",
            title="Friday Lunch Demand Lower",
            message="Friday lunch consumption is consistently 15% lower than weekday average.",
            created_at=datetime.utcnow() - timedelta(hours=2),
        ),
        models.Notification(
            type="success",
            title="Waste Reduced This Week",
            message="Overall waste has decreased by 12% compared to last week. Great job!",
            created_at=datetime.utcnow() - timedelta(hours=5),
        ),
        models.Notification(
            type="medium",
            title="Monthly Report Ready",
            message="Your August waste analytics report is now available for review.",
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=1),
        ),
    ]
    db.add_all(notifs)
    db.commit()

    print("Generating Smart Recommendations via Engine...")
    RuleBasedRecommendationEngine.generate_recommendations(db)

    print("Seeding complete! Database is populated.")

if __name__ == "__main__":
    seed_database()
