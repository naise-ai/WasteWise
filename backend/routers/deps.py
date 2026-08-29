# shared auth dependency used across all routers
from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
import models


def require_auth(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
) -> models.User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    return get_current_user(token, db)
