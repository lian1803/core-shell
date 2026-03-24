# Backend Main Entry Point
"""
Marketing Tool Backend API
Naver Place Marketing Analysis Tool
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import router, get_driver, close_driver, http_exception_handler


# Lifespan manager for WebDriver initialization/cleanup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Initialize WebDriver on startup
    print("Initializing Selenium WebDriver...")
    get_driver()  # Force initialization

    yield  # Application runs here

    # Cleanup on shutdown
    print("Closing Selenium WebDriver...")
    close_driver()


# Create FastAPI app
app = FastAPI(
    title="Marketing Tool API",
    description="Naver Place Marketing Analysis Tool API",
    version="1.0.0",
    lifespan=lifespan,
    exception_handlers={404: http_exception_handler},
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "marketing-tool-api"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Marketing Tool API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    import os

    # Get port from environment variable, default to 8000
    port = int(os.getenv("BACKEND_PORT", 8000))
    host = os.getenv("BACKEND_HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload when using lifespan
    )
