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