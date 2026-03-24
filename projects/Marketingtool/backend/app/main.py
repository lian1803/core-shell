"""
Marketing Tool Backend - Main FastAPI Application
"""
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import init_db, close_db
from app.routers import auth, diagnosis, admin, api
from app.services.scheduler_service import SchedulerService

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("[Startup] Initializing database...")
    await init_db()

    print("[Startup] Starting scheduler...")
    scheduler = SchedulerService()
    await scheduler.start()
    app.state.scheduler = scheduler

    print("[Startup] Marketing Tool ready!")

    yield

    # Shutdown
    print("[Shutdown] Stopping scheduler...")
    await scheduler.stop()

    print("[Shutdown] Closing database...")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="Marketing Tool API",
    description="AI-powered marketing automation for small businesses",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
static_dir = Path(__file__).parent.parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Templates
templates_dir = Path(__file__).parent.parent / "templates"
templates_dir.mkdir(exist_ok=True)
templates = Jinja2Templates(directory=str(templates_dir))

# Include routers
app.include_router(auth.router)
app.include_router(diagnosis.router)
app.include_router(admin.router)
app.include_router(api.router)


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Main page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
