
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.committees import router as committees_router
from app.api.routes.donations import router as donations_router

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(committees_router, prefix="/api/v1")
app.include_router(donations_router, prefix="/api/v1")


@app.get("/")
def home():
    return {"message": "Welcome to Ganesh Committee"}


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
