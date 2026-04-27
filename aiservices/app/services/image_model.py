import base64
import io
import re
from typing import Dict

import numpy as np
from PIL import Image


def _severity(confidence: float) -> str:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.45:
        return "medium"
    return "low"


def _normalize_caption(caption: str) -> str:
    translated = caption.lower().translate(
        str.maketrans(
            {
                "0": "o",
                "1": "i",
                "3": "e",
                "4": "a",
                "5": "s",
                "7": "t",
                "@": "a",
                "$": "s",
            }
        )
    )
    return re.sub(r"\s+", " ", translated).strip()


def _caption_signal(caption: str) -> Dict:
    lowered = _normalize_caption(caption)

    humiliation_keywords = ["meme", "humiliate", "shame", "clown", "roast", "embarrass", "bully"]
    harassment_keywords = ["ugly", "loser", "worthless", "fat", "idiot", "stupid", "freak"]
    sexual_keywords = ["nude", "naked", "nsfw", "porn", "xxx", "explicit", "sex tape", "leak"]
    violence_keywords = ["blood", "gore", "behead", "dead body", "stabbed", "graphic", "violence"]
    self_harm_keywords = ["suicide", "self harm", "cutting", "overdose", "hang yourself"]

    offensive = any(k in lowered for k in humiliation_keywords)
    harassment = any(k in lowered for k in harassment_keywords)
    sexual = any(k in lowered for k in sexual_keywords)
    violent = any(k in lowered for k in violence_keywords)
    self_harm = any(k in lowered for k in self_harm_keywords)

    confidence = 0.1
    abuse_type = "none"
    reasons = []

    if offensive:
        confidence += 0.34
        abuse_type = "offensive meme"
        reasons.append("offensive meme indicators")

    if harassment:
        confidence += 0.28
        abuse_type = "humiliation" if offensive else "harassment"
        reasons.append("harassment language")

    if sexual:
        confidence += 0.72
        abuse_type = "sexual content"
        reasons.append("sexual/NSFW indicators")

    if violent:
        confidence += 0.68
        abuse_type = "graphic violence"
        reasons.append("graphic violence indicators")

    if self_harm:
        confidence += 0.78
        abuse_type = "self-harm risk"
        reasons.append("self-harm indicators")

    severe_combo = sum(1 for flag in [sexual, violent, self_harm] if flag)
    if severe_combo >= 2:
        confidence = max(confidence, 0.9)
        reasons.append("multiple severe sensitive categories")

    return {
        "confidence": min(confidence, 0.96),
        "type": abuse_type,
        "reasons": reasons,
    }


def _image_signal(image_base64: str) -> float:
    if not image_base64:
        return 0.0

    try:
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(image)

        # Demo heuristic: memes often have high-contrast text overlays.
        grayscale = arr.mean(axis=2)
        contrast = float(np.std(grayscale) / 128.0)
        edge_like = float(np.mean(np.abs(np.diff(grayscale, axis=1))) / 255.0)

        return min(0.35, contrast * 0.3 + edge_like * 0.45)
    except Exception:
        return 0.0


def _visual_sensitive_signal(image_base64: str) -> Dict:
    if not image_base64:
        return {"confidence": 0.0, "type": "none", "reasons": []}

    try:
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(image).astype(np.float32) / 255.0

        r = arr[:, :, 0]
        g = arr[:, :, 1]
        b = arr[:, :, 2]
        brightness = arr.mean(axis=2)

        # Classic approximate skin mask in normalized YCrCb-like space.
        y = 0.299 * r + 0.587 * g + 0.114 * b
        cr = (r - y) * 0.713 + 0.5
        cb = (b - y) * 0.564 + 0.5
        skin_mask_ycrcb = (
            (cr >= 0.45)
            & (cr <= 0.63)
            & (cb >= 0.2)
            & (cb <= 0.45)
            & (r > g)
            & (g > b)
        )

        # Secondary broad RGB rule to catch more realistic skin tones.
        max_rgb = np.maximum(np.maximum(r, g), b)
        min_rgb = np.minimum(np.minimum(r, g), b)
        skin_mask_rgb = (
            (r > 0.37)
            & (g > 0.16)
            & (b > 0.08)
            & ((max_rgb - min_rgb) > 0.06)
            & (np.abs(r - g) > 0.06)
            & (r > g)
            & (r > b)
        )

        skin_mask = skin_mask_ycrcb | skin_mask_rgb
        skin_ratio = float(np.mean(skin_mask))

        # Graphic red regions + dark scenes can be an abuse indicator.
        red_mask = (r > 0.55) & (r > g * 1.28) & (r > b * 1.35) & (g < 0.35) & (b < 0.35)
        red_ratio = float(np.mean(red_mask))
        dark_ratio = float(np.mean(brightness < 0.22))

        # Meme-like text overlays are usually high contrast.
        grayscale = brightness
        contrast = float(np.std(grayscale))
        edge_like = float(np.mean(np.abs(np.diff(grayscale, axis=1))))
        extreme_ratio = float(np.mean((grayscale < 0.1) | (grayscale > 0.9)))

        sexual_score = 0.0
        if skin_ratio >= 0.3:
            sexual_score = min(0.92, 0.42 + (skin_ratio - 0.3) * 1.95)
            if skin_ratio >= 0.52:
                sexual_score = min(0.95, sexual_score + 0.12)

        violence_score = 0.0
        if red_ratio >= 0.08:
            violence_score = min(0.9, 0.44 + (red_ratio - 0.08) * 3.0 + dark_ratio * 0.35)
            if red_ratio >= 0.18 and dark_ratio >= 0.35:
                violence_score = max(violence_score, 0.82)

        meme_score = 0.0
        if contrast >= 0.24 and edge_like >= 0.16 and extreme_ratio >= 0.28:
            meme_score = min(0.72, 0.5 + (contrast - 0.24) * 0.8 + (edge_like - 0.16) * 0.9)

        scores = {
            "sexual content": sexual_score,
            "graphic violence": violence_score,
            "offensive meme": meme_score,
        }
        abuse_type = max(scores, key=scores.get)
        confidence = float(scores[abuse_type])

        reasons = []
        if sexual_score > 0:
            reasons.append("visual NSFW/body-exposure pattern")
        if violence_score > 0:
            reasons.append("visual blood/graphic pattern")
        if meme_score > 0:
            reasons.append("visual offensive meme/text-overlay pattern")

        if confidence < 0.35:
            return {"confidence": 0.0, "type": "none", "reasons": []}

        return {
            "confidence": min(confidence, 0.96),
            "type": abuse_type,
            "reasons": reasons,
        }
    except Exception:
        return {"confidence": 0.0, "type": "none", "reasons": []}


def analyze_image(caption: str, image_base64: str) -> Dict:
    caption_result = _caption_signal(caption)
    visual_result = _visual_sensitive_signal(image_base64)
    generic_visual_boost = _image_signal(image_base64)
    severe_visual_types = {"sexual content", "graphic violence", "self-harm risk"}

    # Combine caption and visual evidence so either modality can trigger risk.
    confidence = max(
        caption_result["confidence"],
        visual_result["confidence"],
        min(0.99, caption_result["confidence"] + (visual_result["confidence"] * 0.45) + generic_visual_boost),
    )

    # Visual-only escalation: if image evidence itself is severe, do not depend on caption boosts.
    if visual_result["type"] in severe_visual_types and visual_result["confidence"] >= 0.55:
        confidence = max(confidence, 0.8)

    abuse_detected = confidence >= 0.45
    abuse_type = "none"
    if abuse_detected:
        abuse_type = (
            visual_result["type"]
            if visual_result["confidence"] >= caption_result["confidence"]
            else caption_result["type"]
        )

    if abuse_detected:
        all_reasons = caption_result["reasons"] + visual_result["reasons"]
        reason_text = ", ".join(all_reasons) if all_reasons else "sensitive image indicators"
        explanation = f"Image/caption matched {reason_text}."
    else:
        explanation = "No strong harmful visual indicators detected."

    return {
        "abuse_detected": abuse_detected,
        "type": abuse_type,
        "confidence": round(confidence, 2),
        "severity": _severity(confidence),
        "explanation": explanation,
    }
