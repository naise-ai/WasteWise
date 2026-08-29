# ============================================================
# WasteWise — Food Items Router
# ============================================================
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from routers.deps import require_auth
import models, schemas
from utils import get_level_str

router = APIRouter(prefix="/api/food-items", tags=["food_items"])


def _compute_food_item_out(fi: models.FoodItem, db: Session) -> schemas.FoodItemOut:
    # Compute averages from waste_records
    records = db.query(models.WasteRecord).filter(models.WasteRecord.food_item_id == fi.id).all()
    if records:
        avg_prepared = round(sum(r.prepared for r in records) / len(records), 1)
        avg_consumed = round(sum(r.consumed for r in records) / len(records), 1)
        avg_wasted = round(sum(r.wasted for r in records) / len(records), 1)
        avg_pct = round((avg_wasted / avg_prepared * 100), 1) if avg_prepared > 0 else 0.0
    else:
        avg_prepared = 0.0
        avg_consumed = 0.0
        avg_wasted = 0.0
        avg_pct = 0.0

    level = get_level_str(avg_pct)

    return schemas.FoodItemOut(
        id=fi.id,
        name=fi.name,
        category=fi.category,
        cost_per_kg=fi.cost_per_kg,
        is_active=fi.is_active,
        avg_prepared=avg_prepared,
        avg_consumed=avg_consumed,
        avg_wasted=avg_wasted,
        avg_waste_percentage=avg_pct,
        level=level,
    )


@router.get("", response_model=List[schemas.FoodItemOut])
def list_food_items(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    q = db.query(models.FoodItem)
    if category:
        q = q.filter(models.FoodItem.category == category)
    if search:
        q = q.filter(models.FoodItem.name.ilike(f"%{search}%"))

    items = q.order_by(models.FoodItem.name.asc()).all()
    return [_compute_food_item_out(fi, db) for fi in items]


@router.post("", response_model=schemas.FoodItemOut, status_code=201)
def create_food_item(
    body: schemas.FoodItemCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    existing = db.query(models.FoodItem).filter(
        func.lower(models.FoodItem.name) == body.name.lower()
    ).first()
    if existing:
        raise HTTPException(400, "A food item with this name already exists.")

    fi = models.FoodItem(
        name=body.name,
        category=body.category,
        cost_per_kg=body.cost_per_kg,
        is_active=body.is_active,
    )
    db.add(fi)
    db.commit()
    db.refresh(fi)
    return _compute_food_item_out(fi, db)


@router.put("/{item_id}", response_model=schemas.FoodItemOut)
def update_food_item(
    item_id: int,
    body: schemas.FoodItemUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    fi = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not fi:
        raise HTTPException(404, "Food item not found")

    if body.name is not None:
        # Check uniqueness
        dup = db.query(models.FoodItem).filter(
            func.lower(models.FoodItem.name) == body.name.lower(),
            models.FoodItem.id != item_id
        ).first()
        if dup:
            raise HTTPException(400, "Another food item with this name already exists.")
        fi.name = body.name

    if body.category is not None:
        fi.category = body.category
    if body.cost_per_kg is not None:
        fi.cost_per_kg = body.cost_per_kg
    if body.is_active is not None:
        fi.is_active = body.is_active

    db.commit()
    db.refresh(fi)
    return _compute_food_item_out(fi, db)


@router.delete("/{item_id}", status_code=204)
def delete_food_item(
    item_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    fi = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not fi:
        raise HTTPException(404, "Food item not found")

    # Optional: check if waste records exist
    db.delete(fi)
    db.commit()
