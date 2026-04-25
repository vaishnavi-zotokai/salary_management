from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import date, datetime


class EmployeeCreate(BaseModel):
    full_name:  str
    job_title:  str
    country:    str
    salary:     float
    currency:   Optional[str] = "USD"
    department: Optional[str] = None
    email:      Optional[str] = None
    hire_date:  Optional[date] = None

    @field_validator("salary")
    @classmethod
    def salary_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Salary must be a positive number")
        return v

    @field_validator("full_name", "job_title", "country")
    @classmethod
    def must_not_be_blank(cls, v):
        if not v or not v.strip():
            raise ValueError("Field must not be blank")
        return v.strip()


class EmployeeUpdate(BaseModel):
    full_name:  Optional[str] = None
    job_title:  Optional[str] = None
    country:    Optional[str] = None
    salary:     Optional[float] = None
    currency:   Optional[str] = None
    department: Optional[str] = None
    email:      Optional[str] = None
    hire_date:  Optional[date] = None

    @field_validator("salary")
    @classmethod
    def salary_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Salary must be a positive number")
        return v


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    full_name:  str
    job_title:  str
    country:    str
    salary:     float
    currency:   str
    department: Optional[str] = None
    email:      Optional[str] = None
    hire_date:  Optional[date] = None
    created_at: Optional[datetime] = None


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page:  int
    page_size: int


class InsightsResponse(BaseModel):
    country:        str
    job_title:      Optional[str] = None
    min_salary:     Optional[float] = None
    max_salary:     Optional[float] = None
    avg_salary:     Optional[float] = None
    employee_count: int