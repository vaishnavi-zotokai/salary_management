from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate,
    EmployeeResponse, EmployeeListResponse, InsightsResponse,
)
from app.services import employee_service

router = APIRouter()


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search:    str | None = Query(None),
    country:   str | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
):
    items, total = employee_service.get_employees(
        db, page, page_size, search, country, department
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    return employee_service.create_employee(db, data)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = employee_service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)
):
    employee = employee_service.update_employee(db, employee_id, data)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    deleted = employee_service.delete_employee(db, employee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")


@router.get("/insights/query", response_model=InsightsResponse)
def get_insights(
    country:   str = Query(...),
    job_title: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return employee_service.get_insights(db, country, job_title)