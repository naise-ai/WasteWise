from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session

import models


def sync_waste_record_to_rescue(
    db: Session,
    record: models.WasteRecord,
    canteen: models.User,
) -> models.SurplusListing | None:
    """Mirror safe overproduction records into the rescue board once per record."""
    listing = db.query(models.SurplusListing).filter(
        models.SurplusListing.source_record_id == record.id
    ).first()
    eligible = record.reason == "Overproduction" and record.wasted > 0

    if not eligible:
        if listing and listing.status == "Available":
            listing.status = "Withdrawn"
        return listing

    if listing and listing.status != "Available":
        # A reserved, collected, withdrawn, or expired offer must never be
        # silently reopened by editing the original waste record.
        return listing

    today = date.today()
    if record.date == today:
        deadline = datetime.utcnow() + timedelta(hours=4)
        status = "Available"
    else:
        deadline = datetime.combine(record.date + timedelta(days=1), time.min)
        status = "Expired"

    context = record.notes.strip() if record.notes and record.notes.strip() else ""
    safety_note = "Listed from an overproduction log. Canteen staff should only share food kept safely and untouched."
    notes = f"{context} {safety_note}".strip()

    if listing is None:
        listing = models.SurplusListing(
            source_record_id=record.id,
            posted_by_id=canteen.id,
            status=status,
            created_at=datetime.utcnow(),
        )
        db.add(listing)

    listing.food_name = record.food_item_name
    listing.quantity = record.wasted
    listing.unit = "kg"
    listing.pickup_location = canteen.canteen_name or "Canteen pickup desk"
    listing.available_until = deadline
    listing.notes = notes
    listing.status = status
    return listing
