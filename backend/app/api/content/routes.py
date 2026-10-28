from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.cms import WebsiteBanner, PlatformAnnouncement, PlatformFAQ, PropertyCategory
from app.schemas.admin import BannerResponse, AnnouncementResponse, FAQResponse, CategoryResponse

router = APIRouter(prefix="/content", tags=["Public Content"])

@router.get("/banners", response_model=List[BannerResponse])
def get_public_banners(db: Session = Depends(get_db)):
    return db.query(WebsiteBanner).filter(WebsiteBanner.is_active == True).order_by(WebsiteBanner.display_order.asc()).all()

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_public_announcements(db: Session = Depends(get_db)):
    return db.query(PlatformAnnouncement).filter(PlatformAnnouncement.is_active == True).order_by(PlatformAnnouncement.created_at.desc()).all()

@router.get("/faqs", response_model=List[FAQResponse])
def get_public_faqs(db: Session = Depends(get_db)):
    return db.query(PlatformFAQ).filter(PlatformFAQ.is_active == True).order_by(PlatformFAQ.display_order.asc()).all()

@router.get("/categories", response_model=List[CategoryResponse])
def get_public_categories(db: Session = Depends(get_db)):
    return db.query(PropertyCategory).filter(PropertyCategory.is_active == True).order_by(PropertyCategory.display_order.asc()).all()
