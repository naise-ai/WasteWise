# ============================================================
# WasteWise — Analytics Router
# ============================================================
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from routers.deps import require_auth
import models, schemas

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=schemas.DashboardKPIs)
def get_dashboard_kpis(
    days: int = Query(default=1, ge=1, le=365),
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    records = db.query(models.WasteRecord).filter(models.WasteRecord.date >= start_date).all()

    total_prepared = round(sum(r.prepared for r in records), 1)
    total_consumed = round(sum(r.consumed for r in records), 1)
    total_wasted = round(sum(r.wasted for r in records), 1)
    waste_rate = round((total_wasted / total_prepared * 100), 1) if total_prepared > 0 else 0.0
    estimated_cost_lost = round(sum(r.cost_lost for r in records), 0)

    # Previous period for waste reduction calculation
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)
    prev_records = db.query(models.WasteRecord).filter(
        models.WasteRecord.date >= prev_start,
        models.WasteRecord.date <= prev_end
    ).all()
    prev_wasted = sum(r.wasted for r in prev_records)

    if prev_wasted > 0:
        waste_reduction = round(((prev_wasted - total_wasted) / prev_wasted * 100), 1)
    else:
        waste_reduction = 0.0

    return schemas.DashboardKPIs(
        total_prepared=total_prepared,
        total_consumed=total_consumed,
        total_wasted=total_wasted,
        waste_rate=waste_rate,
        estimated_cost_lost=estimated_cost_lost,
        waste_reduction=waste_reduction,
        records_count=len(records),
    )


@router.get("/trend", response_model=List[schemas.TrendPoint])
def get_trend(
    days: int = Query(default=7, ge=1, le=365),
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    result = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        records = db.query(models.WasteRecord).filter(models.WasteRecord.date == current_date).all()

        prepared = round(sum(r.prepared for r in records), 1)
        consumed = round(sum(r.consumed for r in records), 1)
        wasted = round(sum(r.wasted for r in records), 1)
        waste_pct = round((wasted / prepared * 100), 1) if prepared > 0 else 0.0

        date_label = current_date.strftime("%b %d")
        result.append(schemas.TrendPoint(
            date=date_label,
            prepared=prepared,
            consumed=consumed,
            wasted=wasted,
            waste_percentage=waste_pct,
        ))

    return result


@router.get("/category-breakdown", response_model=List[schemas.CategoryPoint])
def get_category_breakdown(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    # Join WasteRecord with FoodItem
    results = (
        db.query(models.FoodItem.category, func.sum(models.WasteRecord.wasted))
        .join(models.WasteRecord, models.WasteRecord.food_item_id == models.FoodItem.id)
        .group_by(models.FoodItem.category)
        .all()
    )
    return [
        schemas.CategoryPoint(name=cat, value=round(val or 0.0, 1))
        for cat, val in results
    ]


@router.get("/meal-wise", response_model=List[schemas.MealPoint])
def get_meal_wise(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    meals = ["Breakfast", "Lunch", "Snacks", "Dinner"]
    result = []
    for meal in meals:
        records = db.query(models.WasteRecord).filter(models.WasteRecord.meal == meal).all()
        prepared = round(sum(r.prepared for r in records), 1)
        consumed = round(sum(r.consumed for r in records), 1)
        wasted = round(sum(r.wasted for r in records), 1)
        result.append(schemas.MealPoint(
            meal=meal,
            prepared=prepared,
            consumed=consumed,
            wasted=wasted,
        ))
    return result


@router.get("/day-wise", response_model=List[schemas.DayPoint])
def get_day_wise(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    all_records = db.query(models.WasteRecord).all()

    day_buckets = {d: {"prepared": 0.0, "wasted": 0.0} for d in day_names}
    for r in all_records:
        day_str = day_names[r.date.weekday() if r.date.weekday() != 6 else 0]  # Standard mapping
        # Adjust python weekday(): Monday is 0, Sunday is 6
        weekday_idx = (r.date.weekday() + 1) % 7
        day_str = day_names[weekday_idx]
        day_buckets[day_str]["prepared"] += r.prepared
        day_buckets[day_str]["wasted"] += r.wasted

    result = []
    for d in day_names:
        prep = round(day_buckets[d]["prepared"], 1)
        wasted = round(day_buckets[d]["wasted"], 1)
        rate = round((wasted / prep * 100), 1) if prep > 0 else 0.0
        result.append(schemas.DayPoint(
            day=d,
            wasted=wasted,
            prepared=prep,
            waste_rate=rate,
        ))
    return result


@router.get("/top-items", response_model=List[schemas.TopItemPoint])
def get_top_items(
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    results = (
        db.query(models.WasteRecord.food_item_name, func.sum(models.WasteRecord.wasted))
        .group_by(models.WasteRecord.food_item_name)
        .order_by(func.sum(models.WasteRecord.wasted).desc())
        .limit(limit)
        .all()
    )
    return [
        schemas.TopItemPoint(name=name, value=round(val or 0.0, 1))
        for name, val in results
    ]


@router.get("/reasons", response_model=List[schemas.ReasonPoint])
def get_reasons_breakdown(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    results = (
        db.query(models.WasteRecord.reason, func.sum(models.WasteRecord.wasted))
        .group_by(models.WasteRecord.reason)
        .order_by(func.sum(models.WasteRecord.wasted).desc())
        .all()
    )
    return [
        schemas.ReasonPoint(name=reason, value=round(val or 0.0, 1))
        for reason, val in results
    ]
