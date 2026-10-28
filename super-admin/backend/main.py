import os
import sys

# Ensure backend package from parent workspace is in Python path
workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
backend_dir = os.path.join(workspace_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.routes import router as admin_router
from app.api.content.routes import router as content_router

app = FastAPI(
    title="Smart AI Property Finder - Super Admin Dedicated Gateway",
    description="Isolated administrative API microservice for the SAI Super Admin Console",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration explicitly allowing Super Admin console
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Super Admin and Content routers
app.include_router(admin_router, prefix="/api/admin", tags=["Super Admin"])
app.include_router(content_router, prefix="/api/content", tags=["Public Content"])

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "super-admin-dedicated-gateway",
        "database": "sqlite:///sai.db",
        "auth_standard": "JWT + TOTP 2FA",
    }

if __name__ == "__main__":
    print("Starting SAI Super Admin Dedicated Gateway on http://127.0.0.1:8001 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
