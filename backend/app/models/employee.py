from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name  = Column(String, nullable=False)
    job_title  = Column(String, nullable=False)
    country    = Column(String, nullable=False)
    salary     = Column(Float, nullable=False)
    currency   = Column(String, default="USD", nullable=False)
    department = Column(String, nullable=True)
    email      = Column(String, unique=True, nullable=True)
    hire_date  = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_country",       "country"),
        Index("idx_job_title",     "job_title"),
        Index("idx_country_title", "country", "job_title"),
        Index("idx_salary",        "salary"),
    )