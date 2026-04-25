from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    employee = Employee(**data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def get_employee(db: Session, employee_id: int) -> Employee | None:
    return db.query(Employee).filter(Employee.id == employee_id).first()


def get_employees(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    country: str | None = None,
) -> tuple[list[Employee], int]:
    query = db.query(Employee)

    if search:
        query = query.filter(Employee.full_name.ilike(f"%{search}%"))
    if country:
        query = query.filter(Employee.country == country)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def update_employee(
    db: Session, employee_id: int, data: EmployeeUpdate
) -> Employee | None:
    employee = get_employee(db, employee_id)
    if not employee:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee_id: int) -> bool:
    employee = get_employee(db, employee_id)
    if not employee:
        return False
    db.delete(employee)
    db.commit()
    return True


def get_insights(
    db: Session,
    country: str,
    job_title: str | None = None,
) -> dict:
    query = db.query(
        func.min(Employee.salary).label("min_salary"),
        func.max(Employee.salary).label("max_salary"),
        func.avg(Employee.salary).label("avg_salary"),
        func.count(Employee.id).label("employee_count"),
    ).filter(Employee.country == country)

    if job_title:
        query = query.filter(Employee.job_title == job_title)

    result = query.one()

    return {
        "country":        country,
        "job_title":      job_title,
        "min_salary":     round(result.min_salary, 2) if result.min_salary else None,
        "max_salary":     round(result.max_salary, 2) if result.max_salary else None,
        "avg_salary":     round(result.avg_salary, 2) if result.avg_salary else None,
        "employee_count": result.employee_count,
    }