# ============================================================
# WasteWise Backend — Pydantic Schemas
# ============================================================
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ─── Auth ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    canteen_name: str

    model_config = {"from_attributes": True}


# ─── Food Items ──────────────────────────────────────────────
class FoodItemCreate(BaseModel):
    name: str
    category: str
    cost_per_kg: float = 70.0
    is_active: bool = True


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_per_kg: Optional[float] = None
    is_active: Optional[bool] = None


class FoodItemOut(BaseModel):
    id: int
    name: str
    category: str
    cost_per_kg: float
    is_active: bool
    # computed fields from records
    avg_prepared: float = 0.0
    avg_consumed: float = 0.0
    avg_wasted: float = 0.0
    avg_waste_percentage: float = 0.0
    level: str = "Low"

    model_config = {"from_attributes": True}


# ─── Waste Records ───────────────────────────────────────────
class WasteRecordCreate(BaseModel):
    date: date
    meal: str
    food_item_id: int
    food_item_name: str
    prepared: float
    consumed: float
    students_served: int = 0
    reason: str
    notes: Optional[str] = None


class WasteRecordUpdate(BaseModel):
    prepared: Optional[float] = None
    consumed: Optional[float] = None
    students_served: Optional[int] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class WasteRecordOut(BaseModel):
    id: int
    date: date
    meal: str
    food_item_id: int
    food_item_name: str
    prepared: float
    consumed: float
    wasted: float
    waste_percentage: float
    students_served: int
    reason: str
    notes: Optional[str]
    level: str
    cost_lost: float
    created_at: datetime

    model_config = {"from_attributes": True}


class WasteRecordListResponse(BaseModel):
    records: list[WasteRecordOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Recommendations ─────────────────────────────────────────
class RecommendationOut(BaseModel):
    id: int
    priority: str
    title: str
    description: str
    suggested_action: str
    impact: str
    estimated_savings: str
    status: str
    related_food_item: Optional[str]
    related_meal: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationStatusUpdate(BaseModel):
    status: str  # Active | Applied | Dismissed


# ─── Notifications ────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics ───────────────────────────────────────────────
class DashboardKPIs(BaseModel):
    total_prepared: float
    total_consumed: float
    total_wasted: float
    waste_rate: float
    estimated_cost_lost: float
    waste_reduction: float
    records_count: int


class TrendPoint(BaseModel):
    date: str
    prepared: float
    consumed: float
    wasted: float
    waste_percentage: float


class CategoryPoint(BaseModel):
    name: str
    value: float


class MealPoint(BaseModel):
    meal: str
    prepared: float
    consumed: float
    wasted: float


class DayPoint(BaseModel):
    day: str
    wasted: float
    prepared: float
    waste_rate: float


class TopItemPoint(BaseModel):
    name: str
    value: float


class ReasonPoint(BaseModel):
    name: str
    value: float
