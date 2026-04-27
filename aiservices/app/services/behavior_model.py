from typing import Dict, List


def _risk_level(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def analyze_behavior(activity_logs: List[Dict]) -> Dict:
    if not activity_logs:
        return {
            "bully_score": 0.0,
            "pattern": "insufficient data",
            "risk_level": "low",
            "explanation": "No behavioral history available yet.",
        }

    repeated_target_events = sum(1 for log in activity_logs if log.get("repeatedTargeting"))
    avg_toxicity = sum(log.get("toxicity", 0) for log in activity_logs) / max(len(activity_logs), 1)
    toxic_spikes = sum(1 for log in activity_logs if log.get("toxicity", 0) >= 0.7)

    score = min(
        0.99,
        (avg_toxicity * 0.45)
        + ((repeated_target_events / len(activity_logs)) * 0.35)
        + ((toxic_spikes / len(activity_logs)) * 0.20),
    )

    if repeated_target_events >= 3:
        pattern = "repeated targeting"
    elif toxic_spikes >= 2:
        pattern = "toxic burst behavior"
    else:
        pattern = "normal"

    return {
        "bully_score": round(float(score), 2),
        "pattern": pattern,
        "risk_level": _risk_level(score),
        "explanation": "Behavior score combines repeated targeting frequency and toxicity spikes.",
    }
