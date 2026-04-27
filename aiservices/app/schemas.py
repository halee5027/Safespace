from typing import List, Optional

from pydantic import BaseModel, Field


class TextRequest(BaseModel):
    message: str = Field(default="")


class TextResponse(BaseModel):
    toxicity: float
    category: str
    severity: str
    explanation: str


class ImageRequest(BaseModel):
    caption: str = Field(default="")
    image_base64: str = Field(default="")


class ImageResponse(BaseModel):
    abuse_detected: bool
    type: str
    confidence: float
    severity: str
    explanation: str


class ActivityLog(BaseModel):
    toxicity: float = 0
    repeatedTargeting: bool = False
    timestamp: Optional[str] = None


class BehaviorRequest(BaseModel):
    activity_logs: List[ActivityLog] = []


class BehaviorResponse(BaseModel):
    bully_score: float
    pattern: str
    risk_level: str
    explanation: str
