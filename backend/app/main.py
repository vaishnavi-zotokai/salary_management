from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.employees import router as employees_router
from app.routes.insights import router as insights_router

app = FastAPI(
    title="Salary Management API",
    description="HR salary management tool for 10,000 employees",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees_router, prefix="/employees", tags=["Employees"])
app.include_router(insights_router,  prefix="/insights",  tags=["Insights"])


@app.get("/health")
def health_check():
    return {"status": "ok"}