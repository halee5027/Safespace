import re
from typing import Dict, List

CATEGORY_KEYWORDS = {
    "threat": ["kill", "hurt", "attack", "die"],
    "hate_speech": ["vermin", "subhuman", "trash race", "go back","rascal", "scum","poriki", "filth", "demon", "beast"],
    "harassment": ["idiot", "loser", "stupid", "ugly", "worthless", "clown","nonsense", "fool", "dumb", "pathetic"],
}

SEVERE_PROFANITY_PATTERNS = [
    r"\bf+\W*u+\W*c+\W*k+(?:ing|er|ed|in)?\b",
    r"\bc+\W*u+\W*n+\W*t+\b",
    r"\bb+\W*i+\W*t+\W*c+\W*h+(?:es|y)?\b",
    r"\ba+\W*s+\W*s+\W*h+\W*o+\W*l+\W*e+\b",
    r"\bm+\W*o+\W*t+\W*h+\W*e+\W*r+\W*f+\W*u+\W*c+\W*k+\W*e+\W*r+\b",
]


def _normalize_message(message: str) -> str:
    translated = message.lower().translate(
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


def _count_regex_hits(patterns: List[str], text: str) -> int:
    return sum(1 for pattern in patterns if re.search(pattern, text, flags=re.IGNORECASE))


def _score_message(message: str) -> Dict[str, float]:
    normalized_msg = _normalize_message(message)
    scores = {"threat": 0.0, "hate_speech": 0.0, "harassment": 0.0}

    for category, keywords in CATEGORY_KEYWORDS.items():
        hit_count = sum(1 for word in keywords if word in normalized_msg)
        if hit_count:
            scores[category] = min(1.0, 0.35 + (hit_count * 0.22))

    profanity_hits = _count_regex_hits(SEVERE_PROFANITY_PATTERNS, normalized_msg)
    if profanity_hits > 0:
        scores["harassment"] = max(scores["harassment"], min(1.0, 0.63 + (profanity_hits * 0.16)))

    targeted_language = bool(re.search(r"\b(you|u|ur|you're|youre)\b", normalized_msg))
    if targeted_language and profanity_hits:
        scores["harassment"] = min(1.0, scores["harassment"] + 0.1)

    if profanity_hits >= 2:
        scores["harassment"] = max(scores["harassment"], 0.9)

    aggression_boost = 0.14 if message.isupper() and len(message) > 10 else 0.0
    exclamation_boost = min(0.2, message.count("!") * 0.04)

    for category in scores:
        scores[category] = min(1.0, scores[category] + aggression_boost + exclamation_boost)

    return scores


def _severity(score: float) -> str:
    if score >= 0.8:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def analyze_text(message: str) -> Dict:
    if not message.strip():
        return {
            "toxicity": 0.0,
            "category": "safe",
            "severity": "low",
            "explanation": "Empty message has no harmful indicators.",
        }

    scores = _score_message(message)
    category = max(scores, key=scores.get)
    toxicity = max(scores.values())

    if toxicity < 0.2:
        category = "safe"

    explanation = (
        f"Flagged due to {category.replace('_', ' ')} patterns and language intensity."
        if category != "safe"
        else "No strong bullying indicators detected."
    )

    return {
        "toxicity": round(float(toxicity), 2),
        "category": category,
        "severity": _severity(toxicity),
        "explanation": explanation,
    }
