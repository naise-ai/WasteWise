# ============================================================
# WasteWise — Waste Records Router
# ============================================================
import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from routers.deps import require_auth
import models, schemas
from utils import get_level, get_level_str

router = APIRouter(prefix="/api/records", tags=["waste_records"])


def _build_record_out(r: models.WasteRecord) -> schemas.WasteRecordOut:
    return schemas.WasteRecordOut(
        id=r.id,
        date=r.date,
        meal=r.meal,
        food_item_id=r.food_item_id,
        food_item_name=r.food_item_name,
        prepared=r.prepared,
        consumed=r.consumed,
        wasted=r.wasted,
        waste_percentage=r.waste_percentage,
        students_served=r.students_served,
        reason=r.reason,
        notes=r.notes,
        level=r.level,
        cost_lost=r.cost_lost,
        created_at=r.created_at,
    )


@router.get("", response_model=schemas.WasteRecordListResponse)
def list_records(
    search: Optional[str] = None,
    meal: Optional[str] = None,
    level: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_by: str = "date",
    sort_dir: str = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    q = db.query(models.WasteRecord)

    if search:
        like = f"%{search}%"
        q = q.filter(
            models.WasteRecord.food_item_name.ilike(like) |
            models.WasteRecord.reason.ilike(like)
        )
    if meal:
        q = q.filter(models.WasteRecord.meal == meal)
    if level:
        q = q.filter(models.WasteRecord.level == level)
    if date_from:
        q = q.filter(models.WasteRecord.date >= date_from)
    if date_to:
        q = q.filter(models.WasteRecord.date <= date_to)

    total = q.count()

    col = getattr(models.WasteRecord, sort_by, models.WasteRecord.date)
    q = q.order_by(col.desc() if sort_dir == "desc" else col.asc())
    records = q.offset((page - 1) * page_size).limit(page_size).all()

    return schemas.WasteRecordListResponse(
        records=[_build_record_out(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=schemas.WasteRecordOut, status_code=201)
def create_record(
    body: schemas.WasteRecordCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    fi = db.query(models.FoodItem).filter(models.FoodItem.id == body.food_item_id).first()
    if not fi:
        raise HTTPException(404, "Food item not found")

    wasted = round(body.prepared - body.consumed, 3)
    if wasted < 0:
        raise HTTPException(400, "Consumed cannot exceed prepared")
    waste_pct = round((wasted / body.prepared) * 100, 1) if body.prepared > 0 else 0.0
    level = get_level_str(waste_pct)
    cost_lost = round(wasted * fi.cost_per_kg, 2)

    record = models.WasteRecord(
        date=body.date,
        meal=body.meal,
        food_item_id=body.food_item_id,
        food_item_name=body.food_item_name,
        prepared=body.prepared,
        consumed=body.consumed,
        wasted=wasted,
        waste_percentage=waste_pct,
        students_served=body.students_served,
        reason=body.reason,
        notes=body.notes,
        level=level,
        cost_lost=cost_lost,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _build_record_out(record)


@router.put("/{record_id}", response_model=schemas.WasteRecordOut)
def update_record(
    record_id: int,
    body: schemas.WasteRecordUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    r = db.query(models.WasteRecord).filter(models.WasteRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Record not found")

    if body.prepared is not None:
        r.prepared = body.prepared
    if body.consumed is not None:
        r.consumed = body.consumed
    if body.students_served is not None:
        r.students_served = body.students_served
    if body.reason is not None:
        r.reason = body.reason
    if body.notes is not None:
        r.notes = body.notes

    r.wasted = round(r.prepared - r.consumed, 3)
    r.waste_percentage = round((r.wasted / r.prepared) * 100, 1) if r.prepared > 0 else 0.0
    r.level = get_level_str(r.waste_percentage)

    fi = db.query(models.FoodItem).filter(models.FoodItem.id == r.food_item_id).first()
    if fi:
        r.cost_lost = round(r.wasted * fi.cost_per_kg, 2)

    db.commit()
    db.refresh(r)
    return _build_record_out(r)


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    r = db.query(models.WasteRecord).filter(models.WasteRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Record not found")
    db.delete(r)
    db.commit()
