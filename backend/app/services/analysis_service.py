import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..schemas.analysis import (
    SummaryRequest,
    SummaryResponse,
    ConceptsRequest,
    ConceptsResponse,
    QuizRequest,
    QuizResponse
)
from ..services.analysis_service import AnalysisService
# Giả sử bạn đã có ExportService, nếu chưa thì cần tạo dummy
from ..services.export_service import ExportService 
from ..utils.security import get_current_user
from ..models.user import User

router = APIRouter(prefix="/analysis", tags=["Document Analysis"])
analysis_service = AnalysisService() # Init service 1 lần

@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate document summary"""
    result = await analysis_service.generate_summary(
        db=db,
        user=current_user,
        document_id=request.document_id,
        length=request.length
    )
    # Merge result with created_at if needed, or rely on schema default
    return {**result, 'created_at': datetime.utcnow()}

@router.post("/concepts", response_model=ConceptsResponse)
async def extract_concepts(
    request: ConceptsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract key concepts"""
    return await analysis_service.extract_concepts(
        db=db,
        user=current_user,
        document_id=request.document_id,
        max_concepts=request.max_concepts
    )

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate quiz"""
    return await analysis_service.generate_quiz(
        db=db,
        user=current_user,
        document_id=request.document_id,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )

# --- EXPORT FEATURES ---

@router.post("/summary/export/pdf")
async def export_summary_pdf(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate summary and export to PDF"""
    # 1. Tạo nội dung tóm tắt
    result = await analysis_service.generate_summary(
        db=db,
        user=current_user,
        document_id=request.document_id,
        length=request.length
    )
    
    # 2. Xuất ra file PDF
    export_service = ExportService()
    pdf_path = export_service.export_summary_to_pdf(
        document_title=result['document_title'],
        summary=result['summary'],
        metadata={
            'length': result['length'],
            'word_count': result['word_count']
        }
    )
    
    # 3. Trả về file
    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type='application/pdf',
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/quiz/export/pdf")
async def export_quiz_pdf(
    request: QuizRequest,
    include_answers: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate quiz and export to PDF"""
    # 1. Tạo nội dung Quiz
    result = await analysis_service.generate_quiz(
        db=db,
        user=current_user,
        document_id=request.document_id,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )
    
    # 2. Xuất ra file PDF
    export_service = ExportService()
    pdf_path = export_service.export_quiz_to_pdf(
        document_title=result['document_title'],
        questions=result['questions'],
        difficulty=result['difficulty'],
        include_answers=include_answers
    )
    
    # 3. Trả về file
    filename = os.path.basename(pdf_path)
    return FileResponse(
        path=pdf_path,
        media_type='application/pdf',
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )