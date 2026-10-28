import os
import time
import logging
from fastapi import FastAPI, Request, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, get_db

# Import API Routers
from app.api.auth.routes import router as auth_router
from app.api.users.routes import router as users_router
from app.api.properties.routes import router as properties_router
from app.api.search.routes import router as search_router
from app.api.favorites.routes import router as favorites_router, saved_properties_router
from app.api.enquiries.routes import router as enquiries_router
from app.api.leads.routes import router as leads_router
from app.api.site_visits.routes import router as site_visits_router, visits_router
from app.api.notifications.routes import router as notifications_router
from app.api.projects.routes import router as projects_router
from app.api.facilities.routes import router as facilities_router
from app.api.chat.routes import router as chat_router
from app.api.chatbot.routes import router as chatbot_router
from app.api.ai.routes import router as ai_router
from app.api.upload.routes import router as upload_router
from app.api.admin.routes import router as admin_router
from app.api.compare.routes import router as compare_router
from app.api.loan.routes import router as loan_router
from app.api.dashboard.routes import router as dashboard_router
from app.api.locations.routes import router as locations_router
from app.api.verification.routes import router as verification_router, admin_verification_router
from app.api.agent.routes import router as agent_router
from app.api.builder.routes import router as builder_router
from app.api.units.routes import router as units_3d_router
from app.api.property_documents.routes import router as property_documents_router
from app.api.content.routes import router as content_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sai-backend")

# Automatically ensure tables exist on startup
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists and mount static files
os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production REST API for SAI - Smart AI Property Finder platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured request latency logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration:.3f}s)")
    return response

# Register all modular routers under /api and support direct /auth endpoints
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(auth_router)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)
app.include_router(favorites_router, prefix=settings.API_V1_STR)
app.include_router(saved_properties_router, prefix=settings.API_V1_STR)
app.include_router(enquiries_router, prefix=settings.API_V1_STR)
app.include_router(leads_router, prefix=settings.API_V1_STR)
app.include_router(site_visits_router, prefix=settings.API_V1_STR)
app.include_router(visits_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(facilities_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(chatbot_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(compare_router, prefix=settings.API_V1_STR)
app.include_router(loan_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(locations_router, prefix=settings.API_V1_STR)
app.include_router(verification_router, prefix=settings.API_V1_STR)
app.include_router(admin_verification_router, prefix=settings.API_V1_STR)
app.include_router(agent_router, prefix=settings.API_V1_STR)
app.include_router(builder_router, prefix=settings.API_V1_STR)
app.include_router(units_3d_router, prefix=settings.API_V1_STR)
app.include_router(property_documents_router, prefix=settings.API_V1_STR)
app.include_router(content_router, prefix=settings.API_V1_STR)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail
            },
            "detail": exc.detail
        }
    )

@app.get("/", tags=["Health"])
def root_endpoint():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "api": "ok",
        "database": db_status,
        "qwen": "ok",
        "environment": settings.ENVIRONMENT
    }
