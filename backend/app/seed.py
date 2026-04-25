import random
import string
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.employee import Employee

COUNTRIES = [
    "United States", "United Kingdom", "Germany", "India",
    "Canada", "Australia", "France", "Brazil", "Singapore", "Japan"
]

JOB_TITLES = [
    "Software Engineer", "Senior Software Engineer", "Product Manager",
    "Data Analyst", "DevOps Engineer", "UX Designer", "HR Manager",
    "Marketing Manager", "Finance Analyst", "Sales Executive",
    "Engineering Manager", "Data Scientist", "QA Engineer", "Scrum Master"
]

DEPARTMENTS = [
    "Engineering", "Product", "Design", "Data", "HR",
    "Finance", "Marketing", "Sales", "Operations", "Legal"
]

SALARY_RANGE = {
    "Software Engineer":        (60000,  120000),
    "Senior Software Engineer": (100000, 180000),
    "Product Manager":          (90000,  160000),
    "Data Analyst":             (55000,  110000),
    "DevOps Engineer":          (80000,  150000),
    "UX Designer":              (65000,  120000),
    "HR Manager":               (55000,  100000),
    "Marketing Manager":        (60000,  110000),
    "Finance Analyst":          (60000,  115000),
    "Sales Executive":          (50000,  100000),
    "Engineering Manager":      (130000, 220000),
    "Data Scientist":           (90000,  170000),
    "QA Engineer":              (55000,  105000),
    "Scrum Master":             (80000,  140000),
}


def load_names(filepath: str) -> list[str]:
    with open(filepath) as f:
        return [
            name.strip()
            for line in f
            for name in line.split(",")
            if name.strip()
        ]


def random_email(full_name: str, idx: int) -> str:
    clean = full_name.lower().replace(" ", ".")
    return f"{clean}.{idx}@company.com"


def random_hire_date() -> date:
    start = date(2015, 1, 1)
    return start + timedelta(days=random.randint(0, 3650))


def generate_employees(first_names, last_names, count=10000):
    employees = []
    for i in range(count):
        first  = random.choice(first_names)
        last   = random.choice(last_names)
        name   = f"{first} {last}"
        title  = random.choice(JOB_TITLES)
        lo, hi = SALARY_RANGE[title]

        employees.append({
            "full_name":  name,
            "job_title":  title,
            "country":    random.choice(COUNTRIES),
            "salary":     round(random.uniform(lo, hi), 2),
            "currency":   "USD",
            "department": random.choice(DEPARTMENTS),
            "email":      random_email(name, i),
            "hire_date":  random_hire_date(),
        })
    return employees


def seed(batch_size=500):
    first_names = load_names("first_names.txt")
    last_names  = load_names("last_names.txt")

    print(f"Loaded {len(first_names)} first names, {len(last_names)} last names")

    employees = generate_employees(first_names, last_names)
    print(f"Generated {len(employees)} employees — inserting...")

    db: Session = SessionLocal()
    try:
        # Wipe existing data so script is idempotent
        db.query(Employee).delete()
        db.commit()

        # Bulk insert in batches
        for i in range(0, len(employees), batch_size):
            batch = employees[i : i + batch_size]
            db.bulk_insert_mappings(Employee, batch)
            db.commit()
            print(f"  Inserted batch {i // batch_size + 1} / {len(employees) // batch_size}")

        total = db.query(Employee).count()
        print(f"Done. Total employees in DB: {total}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()