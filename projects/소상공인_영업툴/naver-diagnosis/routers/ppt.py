"""
PPT 라우터
GET /ppt/generate/{history_id}: PPT 재생성
GET /ppt/download/{filename}: PPT 다운로드
"""
import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import DiagnosisHistory
from services.ppt_generator import PPTGenerator

router = APIRouter(prefix="/ppt", tags=["ppt"])


class PPTGenerateResponse(BaseModel):
    """PPT 생성 응답"""
    success: bool
    filename: str
    download_url: str


@router.get("/generate/{history_id}", response_model=PPTGenerateResponse)
async def generate_ppt(
    history_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    진단 이력을 기반으로 PPT 재생성

    - 기존 진단 데이터를 사용하여 새 PPT 파일 생성
    - DiagnosisHistory의 ppt_filename 업데이트
    """
    try:
        # 진단 이력 조회
        history = await db.get(DiagnosisHistory, history_id)

        if not history:
            raise HTTPException(status_code=404, detail="진단 이력을 찾을 수 없습니다")

        # PPT 생성에 필요한 데이터 구성
        data = {
            "business_name": history.business_name,
            "place_id": history.place_id,
            "address": history.address,
            "category": history.category,
            "place_url": history.place_url,
            "photo_count": history.photo_count,
            "review_count": history.review_count,
            "blog_review_count": history.blog_review_count,
            "has_menu": history.has_menu,
            "has_hours": history.has_hours,
            "has_price": history.has_price,
            "keywords": history.keywords,
            "photo_score": history.photo_score,
            "review_score": history.review_score,
            "blog_score": history.blog_score,
            "keyword_score": history.keyword_score,
            "info_score": history.info_score,
            "total_score": history.total_score,
            "grade": history.grade,
            "improvement_points": history.improvement_points,
        }

        # PPT 생성
        ppt_gen = PPTGenerator(output_dir="ppt_output")
        filename = ppt_gen.generate(data)

        # DB 업데이트
        history.ppt_filename = filename
        await db.commit()

        return PPTGenerateResponse(
            success=True,
            filename=filename,
            download_url=f"/ppt/download/{filename}"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPT 생성 실패: {str(e)}")


@router.get("/download/{filename}")
async def download_ppt(filename: str):
    """
    PPT 파일 다운로드

    - ppt_output 폴더에서 파일 제공
    """
    try:
        # 보안: 파일명에서 경로 이탈 방지
        safe_filename = os.path.basename(filename)
        filepath = os.path.join("ppt_output", safe_filename)

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")

        return FileResponse(
            path=filepath,
            filename=safe_filename,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 실패: {str(e)}")
