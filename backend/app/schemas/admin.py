from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models.user import UserRole

class UserStatusUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class ListingModerationUpdate(BaseModel):
    is_verified: Optional[bool] = None
    status: Optional[str] = None # "available", "pending", "under_review", "approved", "rejected", "suspended", "sold", "rented"
    badge: Optional[str] = None
    sponsored: Optional[bool] = None
    sponsored_label: Optional[str] = None
    rejection_reason: Optional[str] = None

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    reporter_id: int
    reason: str
    description: Optional[str] = None
    status: str
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

class AdminSystemStats(BaseModel):
    total_users: int
    total_buyers: int
    total_sellers: int
    total_agents: int
    total_builders: int
    total_properties: int
    active_listings: int
    total_enquiries: int
    total_site_visits: int
    open_reports: int

class AdminDashboardMetrics(BaseModel):
    # User counts
    total_users: int
    total_buyers: int
    total_owners: int
    total_agents: int
    total_builders: int
    total_admins: int

    # Property counts
    total_properties: int
    pending_properties: int
    approved_properties: int
    rejected_properties: int
    suspended_properties: int
    active_listings: int
    featured_properties: int

    # Verification counts
    pending_kyc: int
    verified_users: int
    rejected_verification: int
    pending_documents: int
    verified_documents: int

    # Complaints & Reports
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    open_reports: int

    # AI usage
    total_ai_searches: int
    total_ai_recommendations: int
    supported_languages_count: int

    # System Health
    database_status: str
    api_status: str
    qwen_status: str

    # Recent Audit Activity
    recent_activities: List[Dict[str, Any]] = []

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    requires_2fa: bool = False
    temp_token: Optional[str] = None

# CMS Schemas
class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    target_url: Optional[str] = None
    badge_text: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class BannerResponse(BannerCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    type: str = "INFO" # INFO, WARNING, SUCCESS, IMPORTANT, SYSTEM
    target_role: str = "all"
    is_active: bool = True

class AnnouncementResponse(AnnouncementCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

class FAQCreate(BaseModel):
    category: str = "General"
    question: str
    answer: str
    display_order: int = 0
    is_active: bool = True

class FAQResponse(FAQCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = "Home"
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class CategoryResponse(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

# Complaint Schemas
class ComplaintCreate(BaseModel):
    category: str # "fake_listing", "fraud", "incorrect_price", "user_behavior", "document_issue", "other"
    subject: str
    description: str
    property_id: Optional[int] = None
    priority: str = "MEDIUM"

class ComplaintStatusUpdate(BaseModel):
    status: str # "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"
    internal_notes: Optional[str] = None
    resolution: Optional[str] = None

class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    property_id: Optional[int] = None
    category: str
    subject: str
    description: str
    status: str
    priority: str
    internal_notes: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[int] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    property_title: Optional[str] = None

# RERA Schemas
class RERACreate(BaseModel):
    rera_number: str
    project_name: str
    promoter_name: str
    state: str = "Maharashtra"
    district: str = "Pune"
    project_type: str = "Residential"
    valid_until: Optional[datetime] = None
    status: str = "REGISTERED"
    verification_status: str = "VERIFIED"
    source_url: Optional[str] = None
    property_id: Optional[int] = None
    project_id: Optional[int] = None

class RERAResponse(RERACreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime

# Broadcast Notification Schema
class BroadcastNotificationRequest(BaseModel):
    target_role: str = "all" # all, buyer, seller, agent, builder, specific
    user_ids: Optional[List[int]] = None
    notification_type: str = "INFO" # INFO, WARNING, SUCCESS, IMPORTANT, SYSTEM
    title: str
    message: str

# Settings Schema
class SystemSettingUpdate(BaseModel):
    settings: Dict[str, Any]

# AI Config Schema
class AIConfigUpdate(BaseModel):
    ai_model: Optional[str] = None
    ai_max_tokens: Optional[int] = None
    ai_temperature: Optional[float] = None
    default_city: Optional[str] = None
    kyc_mandatory: Optional[bool] = None
    property_auto_approval: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
