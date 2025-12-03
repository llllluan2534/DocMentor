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
from ..services.export_service import ExportService
from ..utils.security import get_current_user
from ..models.user import User

router = APIRouter(prefix="/analysis", tags=["Document Analysis"])

@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate document summary
    
    - **document_id**: Document to summarize
    - **length**: "short" (5 sentences), "medium" (1-2 paragraphs), "long" (detailed)
    """
    analysis_service = AnalysisService()
    
    result = await analysis_service.generate_summary(
        db=db,
        user=current_user,
        document_id=request.document_id,
        length=request.length
    )
    
    return {
        **result,
        'created_at': datetime.utcnow()
    }

@router.post("/concepts", response_model=ConceptsResponse)
async def extract_concepts(
    request: ConceptsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract key concepts from document
    
    - **document_id**: Document to analyze
    - **max_concepts**: Maximum number of concepts to extract (1-20)
    """
    analysis_service = AnalysisService()
    
    result = await analysis_service.extract_concepts(
        db=db,
        user=current_user,
        document_id=request.document_id,
        max_concepts=request.max_concepts
    )
    
    return result

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz from document
    
    - **document_id**: Document to create quiz from
    - **num_questions**: Number of questions (1-20)
    - **difficulty**: "easy", "medium", or "hard"
    """
    analysis_service = AnalysisService()
    
    result = await analysis_service.generate_quiz(
        db=db,
        user=current_user,
        document_id=request.document_id,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )
    
    return result

@router.post("/quiz/export/pdf")
async def export_summary_pdf(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate summary and export to PDF
    
    Returns PDF file for download.
    """
    
    # Tạo tóm tắt
    analysis_service = AnalysisService()
    result = await analysis_service.generate_summary(
        db=db,
        user=current_user,
        document_id=request.document_id,
        length=request.length
    )
    
@router.post("/summary/export/pdf")
async def export_summary_pdf(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate summary and export to PDF
    
    Returns PDF file for download.
    """
    
    # Tạo tóm tắt
    analysis_service = AnalysisService()
    result = await analysis_service.generate_summary(
        db=db,
        user=current_user,
        document_id=request.document_id,
        length=request.length
    )
    
    # Xuất tóm tắt ra PDF
    export_service = ExportService()
    pdf_path = export_service.export_summary_to_pdf(
        document_title=result['document_title'],
        summary=result['summary'],
        metadata={
            'length': result['length'],
            'word_count': result['word_count']
        }
    )
    
    # Return file
    return FileResponse(
        path=pdf_path,
        media_type='application/pdf',
        filename=os.path.basename(pdf_path),
        headers={"Content-Disposition": f"attachment; filename={os.path.basename(pdf_path)}"}
    )
    
# Export quiz to PDF
@router.post("/quiz/export/pdf")
async def export_quiz_pdf(
    request: QuizRequest,
    include_answers: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz and export to PDF
    
    - **include_answers**: Include answer key in PDF
    
    Returns PDF file for download
    """
    # Generate quiz
    analysis_service = AnalysisService()
    result = await analysis_service.generate_quiz(
        db=db,
        user=current_user,
        document_id=request.document_id,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )
    
    # Export to PDF
    export_service = ExportService()
    pdf_path = export_service.export_quiz_to_pdf(
        document_title=result['document_title'],
        questions=result['questions'],
        difficulty=result['difficulty'],
        include_answers=include_answers
    )
    
    # Return file
    return FileResponse(
        path=pdf_path,
        media_type='application/pdf',
        filename=os.path.basename(pdf_path),
        headers={"Content-Disposition": f"attachment; filename={os.path.basename(pdf_path)}"}
    )