# ============================================================
# WasteWise — Notifications Router
# ============================================================
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from routers.deps import require_auth
import models, schemas

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    return db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()


@router.put("/{notif_id}/read", response_model=schemas.NotificationOut)
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    n = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.put("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    db.query(models.Notification).filter(models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notif_id}", status_code=204)
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    n = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
