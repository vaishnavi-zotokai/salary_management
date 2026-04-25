# Salary Management System

A full-stack salary management tool for 10,000 employees.

## Stack
- Backend: Python + FastAPI + SQLite
- Frontend: React (Vite)

## Setup

### Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

### Frontend
cd frontend
npm install
npm run dev

### Seed
cd backend
python -m app.seed