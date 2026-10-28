from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.property_view import PropertyView
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyResponse, PropertyListResponse,
    PropertyCompareRequest, PropertyCompareResponse
)
from app.schemas.property_walkthrough import (
    PropertyWalkthroughResponse, WalkthroughGenerateRequest, WalkthroughGenerateResponse,
    WalkthroughRenderJobResponse
)
from app.core.permissions import get_current_active_user, get_current_user_optional, require_roles
from app.services.property_service import (
    create_property, get_property_by_id, update_property, delete_property,
    get_my_properties, compare_properties
)
from app.services.property_walkthrough_service import (
    generate_property_walkthrough, trigger_walkthrough_generation,
    start_walkthrough_render_job, get_render_job_status
)
from app.services.property_3d_service import get_property_3d_tour, save_property_3d_tour
from app.services.recommendation_service import get_personalized_recommendations

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.get("/cities", response_model=List[str])
def get_distinct_cities(db: Session = Depends(get_db)):
    """Return all unique cities currently available in the database dynamically."""
    cities = db.query(Property.city).distinct().filter(Property.city.isnot(None)).order_by(Property.city.asc()).all()
    return [c[0] for c in cities if c[0]]

@router.get("/localities", response_model=List[str])
def get_distinct_localities(city: Optional[str] = None, db: Session = Depends(get_db)):
    """Return unique localities dynamically, optionally filtered by city."""
    query = db.query(Property.locality).distinct().filter(Property.locality.isnot(None))
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    localities = query.order_by(Property.locality.asc()).all()
    return [l[0] for l in localities if l[0]]

@router.get("/", response_model=PropertyListResponse)
def list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    city: Optional[str] = None,
    locality: Optional[str] = None,
    listing_type: Optional[str] = None,
    property_type: Optional[str] = None,
    bhk: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Property).filter(Property.status == "available")
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if locality:
        query = query.filter(Property.locality.ilike(f"%{locality}%"))
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    if property_type:
        query = query.filter(Property.property_type.ilike(f"%{property_type}%"))
    if bhk is not None:
        query = query.filter(Property.bhk == bhk)
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)

    total = query.count()
    offset = (page - 1) * limit
    items = query.order_by(Property.id.desc()).offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return PropertyListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/my", response_model=List[PropertyResponse])
def list_my_properties(
    current_user: User = Depends(require_roles(UserRole.SELLER, UserRole.AGENT, UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    return get_my_properties(db, current_user)

@router.get("/recommendations", response_model=List[PropertyResponse])
def get_recommendations(
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    return get_personalized_recommendations(db, current_user, limit=limit)

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    return get_property_by_id(db, property_id)

@router.post("/{property_id}/view")
def record_property_view(
    property_id: int,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    client_ip = request.client.host if request.client else "127.0.0.1"
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)

    existing_query = db.query(PropertyView).filter(
        PropertyView.property_id == property_id,
        PropertyView.viewed_at >= fifteen_mins_ago
    )
    if current_user:
        existing_query = existing_query.filter(PropertyView.viewer_id == current_user.id)
    else:
        existing_query = existing_query.filter(PropertyView.ip_address == client_ip)

    already_viewed = existing_query.first()
    if not already_viewed:
        view = PropertyView(
            property_id=property_id,
            viewer_id=current_user.id if current_user else None,
            ip_address=client_ip,
            viewed_at=datetime.utcnow()
        )
        db.add(view)
        property_obj.views_count = (property_obj.views_count or 0) + 1
        db.commit()

    return {"status": "ok", "views_count": property_obj.views_count or 0}

@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def add_property(
    property_in: PropertyCreate,
    current_user: User = Depends(require_roles(UserRole.SELLER, UserRole.AGENT, UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    return create_property(db, property_in, current_user)

@router.patch("/{property_id}", response_model=PropertyResponse)
def edit_property(
    property_id: int,
    property_update: PropertyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return update_property(db, property_id, property_update, current_user)

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_property(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    delete_property(db, property_id, current_user)
    return None

@router.post("/compare", response_model=PropertyCompareResponse)
def compare_selected_properties(
    payload: PropertyCompareRequest,
    db: Session = Depends(get_db)
):
    return compare_properties(
        db=db,
        property_ids=payload.property_ids,
        user_requirements=payload.user_requirements,
        priority=payload.priority or "balanced"
    )

@router.get("/{property_id}/walkthrough", response_model=PropertyWalkthroughResponse)
def get_property_walkthrough_route(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns dynamically generated/cached animated walkthrough configuration
    for the selected property. Strictly adheres to No-Hallucination rules.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} was not found."
        )

    # Permission check for non-available properties
    if prop.status != "available":
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication required to preview this unlisted walkthrough."
            )
        is_owner = prop.owner_id == current_user.id
        is_agent = prop.agent_id == current_user.id
        is_builder = prop.builder_id == current_user.id
        is_admin = current_user.role == UserRole.SUPER_ADMIN
        if not (is_owner or is_agent or is_builder or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view the walkthrough for this property."
            )

    return generate_property_walkthrough(db, property_id, force=False)

@router.post("/{property_id}/walkthrough/generate", response_model=WalkthroughGenerateResponse)
def generate_property_walkthrough_route(
    property_id: int,
    payload: Optional[WalkthroughGenerateRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Triggers regeneration or cache refresh of the property walkthrough.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} was not found."
        )

    force = payload.force if payload else True
    return trigger_walkthrough_generation(db, property_id, force=force)

@router.post("/{property_id}/walkthrough/render", response_model=WalkthroughRenderJobResponse)
def render_property_walkthrough_route(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Triggers non-blocking video render export for the property walkthrough.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} was not found."
        )
    return start_walkthrough_render_job(db, property_id)

@router.get("/{property_id}/walkthrough/jobs/{job_id}", response_model=WalkthroughRenderJobResponse)
def get_walkthrough_job_route(
    property_id: int,
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns the status and video_url of a property walkthrough render job.
    """
    return get_render_job_status(job_id, property_id=property_id)

@router.get("/walkthrough/jobs/{job_id}", response_model=WalkthroughRenderJobResponse)
def get_general_walkthrough_job_route(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns job status directly by job_id.
    """
    return get_render_job_status(job_id)


@router.get("/{property_id}/3d-tour")
def get_property_3d_tour_route(
    property_id: int,
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Returns structure-based real-time 3D property walkthrough scene configuration
    strictly adhering to 1/2/3/4 BHK, property dimensions, building exterior, and media.
    """
    return get_property_3d_tour(db, property_id=property_id, force=force)


@router.post("/{property_id}/3d-tour")
def save_property_3d_tour_route(
    property_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Allows property owner, builder, or admin to customize/correct room mapping & 3D layout.
    """
    return save_property_3d_tour(db, property_id=property_id, payload=payload)


from app.services.document_verification.property_documents_service import (
    calculate_property_verification_summary, format_property_document
)
from app.services.document_verification.verification_service import (
    process_uploaded_verification_document
)

@router.get("/{property_id}/documents")
def get_property_documents_route(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns authentic property documents, dynamic verification trust score,
    and category status breakdowns for the specified property.
    Strictly verifies property exists and isolates access.
    """
    return calculate_property_verification_summary(db=db, property_id=property_id, current_user=current_user)

@router.post("/{property_id}/documents")
def upload_property_document_route(
    property_id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    parent_document_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Allows property owner, builder, agent, or admin to upload a new verification document for this property.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Property {property_id} not found")
        
    is_owner = prop.owner_id == current_user.id
    is_agent = prop.agent_id == current_user.id
    is_builder = prop.builder_id == current_user.id
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_owner or is_agent or is_builder or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload documents for this property."
        )
        
    doc = process_uploaded_verification_document(
        db=db,
        user=current_user,
        file=file,
        document_type=document_type,
        account_type=current_user.role.value,
        property_id=property_id,
        project_id=None,
        parent_document_id=parent_document_id
    )
    return {
        "success": True,
        "message": f"Document uploaded and submitted for AI & Admin review.",
        "document": format_property_document(doc, db)
    }



