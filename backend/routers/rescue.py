from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import update

from database import get_db
from routers.deps import require_user
import models
import schemas

router = APIRouter(prefix="/api/rescue/listings", tags=["food rescue"])


def _utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        # Browser submissions are sent as ISO strings with an explicit offset.
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _listing_out(listing: models.SurplusListing, db: Session) -> schemas.SurplusListingOut:
    poster = db.query(models.User).filter(models.User.id == listing.posted_by_id).first()
    claimant = db.query(models.User).filter(models.User.id == listing.claimed_by_id).first() if listing.claimed_by_id else None
    return schemas.SurplusListingOut(
        id=listing.id,
        food_name=listing.food_name,
        quantity=listing.quantity,
        unit=listing.unit,
        pickup_location=listing.pickup_location,
        available_until=listing.available_until.replace(tzinfo=timezone.utc),
        notes=listing.notes,
        status=listing.status,
        posted_by_id=listing.posted_by_id,
        posted_by_name=poster.name if poster else "Canteen",
        organization_name=(poster.canteen_name if poster else None) or "Canteen",
        claimed_by_id=listing.claimed_by_id,
        claimed_by_name=claimant.name if claimant else None,
        created_at=listing.created_at.replace(tzinfo=timezone.utc),
    )


@router.get("", response_model=list[schemas.SurplusListingOut])
def list_listings(db: Session = Depends(get_db), user: models.User = Depends(require_user)):
    now = datetime.utcnow()
    db.query(models.SurplusListing).filter(
        models.SurplusListing.status == "Available",
        models.SurplusListing.available_until <= now,
    ).update({models.SurplusListing.status: "Expired"}, synchronize_session=False)
    db.commit()
    query = db.query(models.SurplusListing)
    if user.role == "Canteen Administrator":
        query = query.filter(
            ((models.SurplusListing.status == "Available") & (models.SurplusListing.available_until > now)) |
            (models.SurplusListing.posted_by_id == user.id)
        )
    elif user.role == "Food Rescue Partner":
        query = query.filter(
            ((models.SurplusListing.status == "Available") & (models.SurplusListing.available_until > now)) |
            (models.SurplusListing.claimed_by_id == user.id)
        )
    else:
        raise HTTPException(status_code=403, detail="This account cannot access food rescue")
    listings = query.order_by(models.SurplusListing.available_until.asc()).all()
    return [_listing_out(item, db) for item in listings]


@router.post("", response_model=schemas.SurplusListingOut, status_code=status.HTTP_201_CREATED)
def create_listing(
    body: schemas.SurplusListingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    if user.role != "Canteen Administrator":
        raise HTTPException(status_code=403, detail="Only canteens can post surplus food")
    if body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    available_until = _utc_naive(body.available_until)
    if available_until <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Pickup deadline must be in the future")
    listing = models.SurplusListing(
        food_name=body.food_name.strip(),
        quantity=body.quantity,
        unit=body.unit.strip(),
        pickup_location=body.pickup_location.strip(),
        available_until=available_until,
        notes=body.notes.strip() if body.notes else None,
        posted_by_id=user.id,
    )
    if not listing.food_name or not listing.unit or not listing.pickup_location:
        raise HTTPException(status_code=400, detail="Food, quantity unit, and pickup location are required")
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _listing_out(listing, db)


@router.post("/{listing_id}/claim", response_model=schemas.SurplusListingOut)
def claim_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    if user.role != "Food Rescue Partner":
        raise HTTPException(status_code=403, detail="Only rescue partners can claim food")
    result = db.execute(
        update(models.SurplusListing)
        .where(
            models.SurplusListing.id == listing_id,
            models.SurplusListing.status == "Available",
            models.SurplusListing.available_until > datetime.utcnow(),
        )
        .values(status="Claimed", claimed_by_id=user.id)
    )
    if result.rowcount == 0:
        exists = db.query(models.SurplusListing.id).filter(models.SurplusListing.id == listing_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="Food listing not found")
        raise HTTPException(status_code=409, detail="This food is no longer available")
    db.commit()
    listing = db.query(models.SurplusListing).filter(models.SurplusListing.id == listing_id).first()
    return _listing_out(listing, db)


@router.post("/{listing_id}/collected", response_model=schemas.SurplusListingOut)
def mark_collected(
    listing_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    if user.role != "Food Rescue Partner":
        raise HTTPException(status_code=403, detail="Only rescue partners can confirm collection")
    listing = db.query(models.SurplusListing).filter(models.SurplusListing.id == listing_id).first()
    if not listing or listing.claimed_by_id != user.id:
        raise HTTPException(status_code=404, detail="Your claimed listing was not found")
    if listing.status != "Claimed":
        raise HTTPException(status_code=409, detail="This listing is not awaiting pickup")
    listing.status = "Collected"
    db.commit()
    db.refresh(listing)
    return _listing_out(listing, db)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_user),
):
    listing = db.query(models.SurplusListing).filter(
        models.SurplusListing.id == listing_id,
        models.SurplusListing.posted_by_id == user.id,
    ).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Your listing was not found")
    if listing.status != "Available":
        raise HTTPException(status_code=409, detail="Only unclaimed food can be withdrawn")
    listing.status = "Withdrawn"
    db.commit()
