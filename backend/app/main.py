import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.health import router as health_router
from app.api.routes.hunts import router as hunts_router
from app.api.routes.participants import router as participants_router
from app.api.routes.submissions import router as submissions_router
from app.api.routes.teams import router as teams_router
from app.database import Base, engine
from app import models
from app.services.errors import ConflictError, InvalidRelationshipError, NotFoundError


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=os.getenv("APP_NAME", "PhotoWalk AI API"), lifespan=lifespan)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(hunts_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(participants_router, prefix="/api")
app.include_router(submissions_router, prefix="/api")


@app.exception_handler(NotFoundError)
async def handle_not_found(_, error: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(error)})


@app.exception_handler(ConflictError)
async def handle_conflict(_, error: ConflictError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": str(error)})


@app.exception_handler(InvalidRelationshipError)
async def handle_invalid_relationship(_, error: InvalidRelationshipError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(error)})
