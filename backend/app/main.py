import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import risk, safety, statistics, upload
from app.api import equipment, incidents
from app.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Программный модуль оценки производственных рисков ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством» на основе статистических моделей",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(safety.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/api/info")
async def info():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "methods": ["risk_matrix", "fmea", "statistics", "poisson", "trend"],
        "departments": [
            "Цех горно-шахтного оборудования",
            "Экспериментальное производство",
            "Цех спецоборудования",
            "Цех КИПиА",
            "Институт горной автоматики",
        ],
    }
