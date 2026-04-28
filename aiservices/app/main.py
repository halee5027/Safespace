from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    BehaviorRequest,
    BehaviorResponse,
    ImageRequest,
    ImageResponse,
    TextRequest,
    TextResponse,
)
from app.services.behavior_model import analyze_behavior
from app.services.image_model import analyze_image
from app.services.text_model import analyze_text

app = FastAPI(title="SafeSpace AI Services", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SafeSpace AI services"}


@app.post("/analyze/text", response_model=TextResponse)
def analyze_text_endpoint(payload: TextRequest):
    return analyze_text(payload.message)


@app.post("/analyze/image", response_model=ImageResponse)
def analyze_image_endpoint(payload: ImageRequest):
    return analyze_image(payload.caption, payload.image_base64)


@app.post("/analyze/behavior", response_model=BehaviorResponse)
def analyze_behavior_endpoint(payload: BehaviorRequest):
    logs = [log.model_dump() for log in payload.activity_logs]
    return analyze_behavior(logs)
