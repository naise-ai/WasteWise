# ============================================================
# WasteWise Backend — SQLAlchemy ORM Models
# ============================================================
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    Date, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(50), default="Canteen Administrator")
    canteen_name = Column(String(150), default="NIT Canteen — Block A")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=False)
    cost_per_kg = Column(Float, default=70.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    waste_records = relationship("WasteRecord", back_populates="food_item_rel")


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    meal = Column(String(20), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    food_item_name = Column(String(100), nullable=False)   # denormalized for speed
    prepared = Column(Float, nullable=False)
    consumed = Column(Float, nullable=False)
    wasted = Column(Float, nullable=False)
    waste_percentage = Column(Float, nullable=False)
    students_served = Column(Integer, default=0)
    reason = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    level = Column(String(20), nullable=False)
    cost_lost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    food_item_rel = relationship("FoodItem", back_populates="waste_records")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    priority = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    impact = Column(Text, nullable=False)
    estimated_savings = Column(String(100), nullable=False)
    status = Column(String(20), default="Active")
    related_food_item = Column(String(100), nullable=True)
    related_meal = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False)   # high | medium | low | success
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
