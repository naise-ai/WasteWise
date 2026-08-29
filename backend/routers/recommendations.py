# ============================================================
# WasteWise — Recommendations Router
# ============================================================
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from routers.deps import require_auth
import models, schemas
from services.recommendation_engine import RuleBasedRecommendationEngine

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=List[schemas.RecommendationOut])
def list_recommendations(
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    # Ensure recommendation engine has evaluated current data
    RuleBasedRecommendationEngine.generate_recommendations(db)

    q = db.query(models.Recommendation)
    if priority and priority != "All":
        q = q.filter(models.Recommendation.priority == priority)
    if status:
        q = q.filter(models.Recommendation.status == status)

    recs = q.order_by(models.Recommendation.created_at.desc()).all()
    return recs


@router.put("/{rec_id}/status", response_model=schemas.RecommendationOut)
def update_recommendation_status(
    rec_id: int,
    body: schemas.RecommendationStatusUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_auth),
):
    rec = db.query(models.Recommendation).filter(models.Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(404, "Recommendation not found")

    rec.status = body.status
    db.commit()
    db.refresh(rec)
    return rec
