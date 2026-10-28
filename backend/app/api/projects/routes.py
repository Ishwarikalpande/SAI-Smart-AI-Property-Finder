from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.project import Project, Building, Floor, Unit
from app.schemas.project import ProjectCreate, ProjectResponse, UnitCreate, UnitResponse
from app.core.permissions import require_roles, get_current_active_user

router = APIRouter(prefix="/projects", tags=["Builder Projects"])

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.status == "active")
    if city:
        query = query.filter(Project.city.ilike(f"%{city}%"))
    return query.order_by(Project.created_at.desc()).all()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(require_roles(UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    proj = Project(
        builder_id=current_user.id,
        **project_in.model_dump()
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return proj

@router.post("/{project_id}/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def add_unit(
    project_id: int,
    unit_in: UnitCreate,
    current_user: User = Depends(require_roles(UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this project")

    unit = Unit(
        project_id=project_id,
        floor_id=unit_in.floor_id,
        unit_number=unit_in.unit_number,
        bhk=unit_in.bhk,
        area_sqft=unit_in.area_sqft,
        carpet_area=unit_in.carpet_area,
        price=unit_in.price,
        parking=unit_in.parking,
        status=unit_in.status or "available"
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit
