# API Routes
"""
API endpoints for Marketing Tool
Following RESTful conventions
"""

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
import os
from datetime import datetime
from contextlib import asynccontextmanager

from models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisStatus,
    ErrorResponse,
)

router = APIRouter(prefix="/analyze", tags=["analysis"])


# In-memory storage for demo (replace with database in production)
analysis_requests: dict = {}

# Global webdriver instance (will be initialized at startup)
driver_instance = None


def get_driver():
    """Get or create Selenium WebDriver instance"""
    global driver_instance

    if driver_instance is None:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options

        # Configure Chrome options for headless mode
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in background
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")

        # Initialize driver
        service = Service()
        driver_instance = webdriver.Chrome(service=service, options=chrome_options)

    return driver_instance


def close_driver():
    """Close Selenium WebDriver instance"""
    global driver_instance

    if driver_instance is not None:
        driver_instance.quit()
        driver_instance = None


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Create new analysis request

    POST /api/analyze

    Request body:
    {
      "business_name": "강남 양주 축구교실",
      "region": "서울 강남구"
    }
    """
    request_id = str(uuid.uuid4())

    # Create analysis request
    analysis_requests[request_id] = {
        "id": request_id,
        "business_name": request.business_name,
        "region": request.region,
        "status": AnalysisStatus.PENDING,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    # Trigger analysis in background
    background_tasks.add_task(run_analysis_task, request_id, request)

    return AnalysisResponse(
        id=request_id,
        business_name=request.business_name,
        region=request.region,
        status=AnalysisStatus.PENDING,
        created_at=None,
        updated_at=None,
    )


def run_analysis_task(request_id: str, request: AnalysisRequest):
    """
    Background task to run analysis
    This runs the actual crawling and data collection
    """
    try:
        from services.analysis_service import AnalysisService

        # Update status to PROCESSING
        analysis_requests[request_id]["status"] = AnalysisStatus.PROCESSING
        analysis_requests[request_id]["updated_at"] = datetime.utcnow().isoformat()

        # Get driver instance
        driver = get_driver()

        # Create analysis service
        service = AnalysisService(driver)

        # Run analysis
        result = service.analyze(request)

        # Update status
        analysis_requests[request_id]["status"] = AnalysisStatus.COMPLETED
        analysis_requests[request_id]["updated_at"] = datetime.utcnow().isoformat()

        # Store full result
        analysis_requests[request_id].update(result)

        print(f"Analysis completed for {request_id}")

    except Exception as e:
        print(f"Analysis failed for {request_id}: {e}")
        analysis_requests[request_id]["status"] = AnalysisStatus.FAILED
        analysis_requests[request_id]["updated_at"] = datetime.utcnow().isoformat()


@router.get("/{request_id}", response_model=AnalysisResponse)
async def get_analysis(request_id: str):
    """
    Get analysis result by ID

    GET /api/analyze/{request_id}
    """
    if request_id not in analysis_requests:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis request not found: {request_id}"
        )

    request_data = analysis_requests[request_id]

    # Return full data if completed
    if request_data.get("status") == AnalysisStatus.COMPLETED:
        return AnalysisResponse(
            id=request_data["id"],
            business_name=request_data["business_name"],
            region=request_data.get("region"),
            status=request_data["status"],
            created_at=request_data.get("created_at"),
            updated_at=request_data.get("updated_at"),
            place_info=request_data.get("place_info"),
            photo_info=request_data.get("photo_info"),
            review_info=request_data.get("review_info"),
            channel_info=request_data.get("channel_info"),
            keyword_stats=request_data.get("keyword_stats"),
            current_rank=request_data.get("current_rank"),
            expanded_keywords=request_data.get("expanded_keywords"),
            diagnosis_comments=request_data.get("diagnosis_comments"),
        )
    else:
        # Return basic info while processing
        return AnalysisResponse(
            id=request_data["id"],
            business_name=request_data["business_name"],
            region=request_data.get("region"),
            status=request_data["status"],
            created_at=request_data.get("created_at"),
            updated_at=request_data.get("updated_at"),
        )


@router.get("", response_model=List[AnalysisResponse])
async def list_analyses():
    """
    List all analysis requests

    GET /api/analyze
    """
    # TODO: Implement pagination
    # return await db.list_analyses(limit=50, offset=0)

    return list(analysis_requests.values())


# ===== Error Handlers =====

async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return ErrorResponse(
        error={
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
        }
    ), exc.status_code


# ===== PPT Download Endpoint =====

@router.get("/{request_id}/download")
async def download_proposal(request_id: str):
    """
    Download generated proposal (PPT)

    GET /api/analyze/{request_id}/download
    """
    if request_id not in analysis_requests:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis request not found: {request_id}"
        )

    request_data = analysis_requests[request_id]

    if request_data.get("status") != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis is not completed yet"
        )

    # Generate PPT if not exists
    if "ppt_file_path" not in request_data:
        from generators.ppt_generator import PPTGenerator
        import os

        # Create output directory
        output_dir = os.getenv("PPT_OUTPUT_PATH", "./output")
        os.makedirs(output_dir, exist_ok=True)

        # Generate PPT
        ppt_generator = PPTGenerator()
        ppt_file_path = ppt_generator.generate_proposal(request_data, output_dir)

        # Store file path
        analysis_requests[request_id]["ppt_file_path"] = ppt_file_path
    else:
        ppt_file_path = request_data["ppt_file_path"]

    # Return file
    from fastapi.responses import FileResponse

    return FileResponse(
        path=ppt_file_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=f"marketing_proposal_{request_id}.pptx"
    )
