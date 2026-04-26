import pytest
from fastapi.testclient import TestClient


# ── CRUD tests ────────────────────────────────────────────

def test_create_employee(client):
    response = client.post("/employees", json={
        "full_name":  "Jane Doe",
        "job_title":  "Software Engineer",
        "country":    "United States",
        "salary":     95000.00,
        "department": "Engineering",
        "email":      "jane.doe@company.com",
        "currency":   "USD",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Jane Doe"
    assert data["id"] is not None


def test_create_employee_missing_required_field(client):
    response = client.post("/employees", json={
        "full_name": "Jane Doe",
        # missing job_title, country, salary
    })
    assert response.status_code == 422


def test_create_employee_negative_salary(client):
    response = client.post("/employees", json={
        "full_name": "Jane Doe",
        "job_title": "Engineer",
        "country":   "United States",
        "salary":    -5000,
    })
    assert response.status_code == 422


def test_get_employees_empty(client):
    response = client.get("/employees")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_get_employees_with_data(client):
    client.post("/employees", json={
        "full_name": "John Smith",
        "job_title": "Data Analyst",
        "country":   "Canada",
        "salary":    75000,
    })
    response = client.get("/employees")
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_get_employees_pagination(client):
    for i in range(5):
        client.post("/employees", json={
            "full_name": f"Employee {i}",
            "job_title": "Engineer",
            "country":   "Germany",
            "salary":    80000,
            "email":     f"emp{i}@company.com",
        })
    response = client.get("/employees?page=1&page_size=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 5


def test_get_employee_by_id(client):
    created = client.post("/employees", json={
        "full_name": "Alice Brown",
        "job_title": "Designer",
        "country":   "UK",
        "salary":    70000,
    }).json()
    response = client.get(f"/employees/{created['id']}")
    assert response.status_code == 200
    assert response.json()["full_name"] == "Alice Brown"


def test_get_employee_not_found(client):
    response = client.get("/employees/99999")
    assert response.status_code == 404


def test_update_employee(client):
    created = client.post("/employees", json={
        "full_name": "Bob Lee",
        "job_title": "Manager",
        "country":   "Australia",
        "salary":    90000,
    }).json()
    response = client.put(f"/employees/{created['id']}", json={
        "salary": 110000,
    })
    assert response.status_code == 200
    assert response.json()["salary"] == 110000


def test_delete_employee(client):
    created = client.post("/employees", json={
        "full_name": "Sara Connor",
        "job_title": "QA Engineer",
        "country":   "United States",
        "salary":    65000,
    }).json()
    response = client.delete(f"/employees/{created['id']}")
    assert response.status_code == 204

    # Confirm it's gone
    response = client.get(f"/employees/{created['id']}")
    assert response.status_code == 404


# ── Insights tests ────────────────────────────────────────

def test_insights_by_country(client):
    for salary in [60000, 80000, 100000]:
        client.post("/employees", json={
            "full_name": f"Person {salary}",
            "job_title": "Engineer",
            "country":   "United States",
            "salary":    salary,
            "email":     f"person{salary}@company.com",
        })
    response = client.get("/insights?country=United States")
    assert response.status_code == 200
    data = response.json()
    assert data["min_salary"] == 60000
    assert data["max_salary"] == 100000
    assert data["avg_salary"] == 80000
    assert data["employee_count"] == 3


def test_insights_by_country_and_job_title(client):
    client.post("/employees", json={
        "full_name": "Dev One",
        "job_title": "Software Engineer",
        "country":   "India",
        "salary":    50000,
        "email":     "dev1@company.com",
    })
    client.post("/employees", json={
        "full_name": "Dev Two",
        "job_title": "Software Engineer",
        "country":   "India",
        "salary":    70000,
        "email":     "dev2@company.com",
    })
    response = client.get("/insights?country=India&job_title=Software Engineer")
    assert response.status_code == 200
    data = response.json()
    assert data["avg_salary"] == 60000


def test_insights_no_data(client):
    response = client.get("/insights?country=Mars")
    assert response.status_code == 200
    data = response.json()
    assert data["employee_count"] == 0


# ── Employee filter tests ─────────────────────────────────────

def test_search_employees_by_name(client):
    client.post("/employees", json={"full_name": "Alice Johnson", "job_title": "Engineer", "country": "Germany", "salary": 80000, "email": "alice@co.com"})
    client.post("/employees", json={"full_name": "Bob Smith",     "job_title": "Designer", "country": "Germany", "salary": 70000, "email": "bob@co.com"})

    response = client.get("/employees?search=alice")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["full_name"] == "Alice Johnson"


def test_filter_employees_by_country(client):
    client.post("/employees", json={"full_name": "Person A", "job_title": "Engineer", "country": "India",         "salary": 50000, "email": "a@co.com"})
    client.post("/employees", json={"full_name": "Person B", "job_title": "Engineer", "country": "United States", "salary": 90000, "email": "b@co.com"})
    client.post("/employees", json={"full_name": "Person C", "job_title": "Engineer", "country": "India",         "salary": 55000, "email": "c@co.com"})

    response = client.get("/employees?country=India")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(e["country"] == "India" for e in data["items"])


def test_filter_employees_by_department(client):
    client.post("/employees", json={"full_name": "Eng One",  "job_title": "Engineer",  "country": "Canada", "salary": 80000, "department": "Engineering", "email": "eng1@co.com"})
    client.post("/employees", json={"full_name": "Eng Two",  "job_title": "Engineer",  "country": "Canada", "salary": 85000, "department": "Engineering", "email": "eng2@co.com"})
    client.post("/employees", json={"full_name": "Mark Mgr", "job_title": "Manager",   "country": "Canada", "salary": 95000, "department": "Marketing",   "email": "mkr@co.com"})

    response = client.get("/employees?department=Engineering")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert all(e["department"] == "Engineering" for e in data["items"])


def test_search_returns_empty_when_no_match(client):
    client.post("/employees", json={"full_name": "Jane Doe", "job_title": "Engineer", "country": "France", "salary": 70000})
    response = client.get("/employees?search=zzznomatch")
    assert response.status_code == 200
    assert response.json()["total"] == 0


# ── Edge case tests ───────────────────────────────────────────

def test_update_employee_not_found(client):
    response = client.put("/employees/99999", json={"salary": 100000})
    assert response.status_code == 404


def test_delete_employee_not_found(client):
    response = client.delete("/employees/99999")
    assert response.status_code == 404


def test_create_employee_blank_name(client):
    response = client.post("/employees", json={
        "full_name": "   ",
        "job_title": "Engineer",
        "country":   "United States",
        "salary":    80000,
    })
    assert response.status_code == 422


def test_create_employee_zero_salary(client):
    response = client.post("/employees", json={
        "full_name": "Jane Doe",
        "job_title": "Engineer",
        "country":   "United States",
        "salary":    0,
    })
    assert response.status_code == 422


# ── Department insights tests ─────────────────────────────────

def _seed_departments(client):
    """Helper — creates 3 departments in United States with known avg salaries."""
    employees = [
        {"full_name": "Eng A", "job_title": "Engineer",  "country": "United States", "salary": 100000, "department": "Engineering", "email": "enga@co.com"},
        {"full_name": "Eng B", "job_title": "Engineer",  "country": "United States", "salary": 120000, "department": "Engineering", "email": "engb@co.com"},
        {"full_name": "HR A",  "job_title": "HR Manager","country": "United States", "salary":  70000, "department": "HR",          "email": "hra@co.com"},
        {"full_name": "Mkt A", "job_title": "Marketer",  "country": "United States", "salary":  80000, "department": "Marketing",   "email": "mkta@co.com"},
        {"full_name": "Mkt B", "job_title": "Marketer",  "country": "United States", "salary":  90000, "department": "Marketing",   "email": "mktb@co.com"},
    ]
    for e in employees:
        client.post("/employees", json=e)


def test_department_insights_returns_all_departments(client):
    _seed_departments(client)
    response = client.get("/insights/departments?country=United States")
    assert response.status_code == 200
    depts = {d["department"] for d in response.json()}
    assert depts == {"Engineering", "HR", "Marketing"}


def test_department_insights_correct_aggregates(client):
    _seed_departments(client)
    response = client.get("/insights/departments?country=United States")
    assert response.status_code == 200

    by_dept = {d["department"]: d for d in response.json()}

    eng = by_dept["Engineering"]
    assert eng["min_salary"] == 100000
    assert eng["max_salary"] == 120000
    assert eng["avg_salary"] == 110000
    assert eng["employee_count"] == 2

    hr = by_dept["HR"]
    assert hr["avg_salary"] == 70000
    assert hr["employee_count"] == 1


def test_department_insights_sorted_by_avg_salary_desc(client):
    _seed_departments(client)
    response = client.get("/insights/departments?country=United States")
    assert response.status_code == 200
    avgs = [d["avg_salary"] for d in response.json()]
    assert avgs == sorted(avgs, reverse=True)


def test_department_insights_excludes_null_department(client):
    # Employee with no department — should not appear in department insights
    client.post("/employees", json={
        "full_name": "No Dept",
        "job_title": "Engineer",
        "country":   "United States",
        "salary":    80000,
    })
    response = client.get("/insights/departments?country=United States")
    assert response.status_code == 200
    assert response.json() == []


def test_department_insights_scoped_to_country(client):
    _seed_departments(client)
    # Add an employee in a different country — should not appear
    client.post("/employees", json={
        "full_name":  "UK Eng",
        "job_title":  "Engineer",
        "country":    "United Kingdom",
        "salary":     90000,
        "department": "Engineering",
        "email":      "ukeng@co.com",
    })
    response = client.get("/insights/departments?country=United Kingdom")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["department"] == "Engineering"
    assert data[0]["employee_count"] == 1


def test_department_insights_unknown_country_returns_empty(client):
    response = client.get("/insights/departments?country=Atlantis")
    assert response.status_code == 200
    assert response.json() == []