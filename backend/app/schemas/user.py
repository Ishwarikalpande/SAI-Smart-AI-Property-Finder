from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.BUYER

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    otp: Optional[str] = Field(None, min_length=6, max_length=6)

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

class BuyerProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    preferred_city: Optional[str] = "Pune"
    preferred_language: Optional[str] = "en"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_bhk: Optional[int] = None
    accessibility_mode: Optional[bool] = False

class AgentProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = 1
    rera_id: Optional[str] = None

class BuilderProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: Optional[str] = None
    developer_registration_no: Optional[str] = None
    office_address: Optional[str] = None

