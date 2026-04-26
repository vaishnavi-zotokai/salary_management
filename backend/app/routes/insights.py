from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.employee import InsightsResponse, DepartmentInsightItem
from app.services import employee_service

router = APIRouter()


@router.get("", response_model=InsightsResponse)
def get_insights(
    country:   str = Query(...),
    job_title: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return employee_service.get_insights(db, country, job_title)


@router.get("/departments", response_model=list[DepartmentInsightItem])
def get_department_insights(
    country: str = Query(...),
    db: Session = Depends(get_db),
):
    return employee_service.get_department_insights(db, country)