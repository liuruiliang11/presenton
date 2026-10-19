"""CJK-aware text capacity helpers for template V2 generation."""

from __future__ import annotations

import re
from typing import Any, Optional

# Latin capacity estimates use ~0.58em; CJK glyphs are closer to 1em.
LATIN_CHAR_WIDTH_EM = 0.58
CJK_CHAR_WIDTH_EM = 0.95
# Convert English-oriented maxLength into a visually safer CJK budget.
CJK_MAX_LENGTH_FACTOR = LATIN_CHAR_WIDTH_EM / CJK_CHAR_WIDTH_EM  # ~0.61
CJK_MIN_LENGTH_FACTOR = 0.35

_CJK_LANGUAGE_MARKERS = (
    "chinese",
    "zh",
    "zh-cn",
    "zh-tw",
    "zh-hans",
    "zh-hant",
    "japanese",
    "ja",
    "korean",
    "ko",
    "中文",
    "日文",
    "韩文",
    "한국어",
)

_CJK_CHAR_RE = re.compile(
    r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]"
)

# Prefer system CJK faces when templates use Latin display fonts.
CJK_FONT_FALLBACKS = (
    "PingFang SC",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    "Source Han Sans SC",
    "WenQuanYi Micro Hei",
    "sans-serif",
)


def is_cjk_language(language: Optional[str]) -> bool:
    if not language:
        return False
    normalized = str(language).strip().lower().replace("_", "-")
    if not normalized or normalized in {"auto", "auto-detect"}:
        return False
    return any(
        marker == normalized or normalized.startswith(f"{marker}-") or marker in normalized
        for marker in _CJK_LANGUAGE_MARKERS
    )


def text_has_cjk(text: Optional[str]) -> bool:
    if not text:
        return False
    return _CJK_CHAR_RE.search(text) is not None


def should_use_cjk_layout(
    language: Optional[str] = None,
    *texts: Optional[str],
) -> bool:
    if is_cjk_language(language):
        return True
    return any(text_has_cjk(text) for text in texts if text)


def cjk_character_width_em(*, bold: bool = False) -> float:
    return 1.0 if bold else CJK_CHAR_WIDTH_EM


def adjust_length_limits_for_cjk(
    min_length: Optional[int],
    max_length: Optional[int],
) -> tuple[Optional[int], Optional[int]]:
    """Tighten maxLength and relax minLength for CJK visual width."""
    new_max = max_length
    new_min = min_length

    if isinstance(max_length, int) and max_length > 0:
        new_max = max(4, int(max_length * CJK_MAX_LENGTH_FACTOR))

    if isinstance(min_length, int) and min_length > 0:
        relaxed = max(1, int(min_length * CJK_MIN_LENGTH_FACTOR))
        if isinstance(new_max, int) and new_max > 0:
            relaxed = min(relaxed, max(1, new_max // 2))
        # Avoid forcing padded Chinese copy into short labels/titles.
        new_min = min(relaxed, 12) if min_length > 12 else max(1, min(relaxed, min_length))

    if isinstance(new_min, int) and isinstance(new_max, int) and new_min > new_max:
        new_min = new_max

    return new_min, new_max


def adapt_json_schema_lengths_for_cjk(schema: Any) -> Any:
    """Recursively rewrite minLength/maxLength for CJK-safe generation."""
    if isinstance(schema, list):
        return [adapt_json_schema_lengths_for_cjk(item) for item in schema]

    if not isinstance(schema, dict):
        return schema

    adapted: dict[str, Any] = {}
    for key, value in schema.items():
        adapted[key] = adapt_json_schema_lengths_for_cjk(value)

    schema_type = adapted.get("type")
    is_string = schema_type == "string" or (
        isinstance(schema_type, list) and "string" in schema_type
    )
    if is_string and ("minLength" in adapted or "maxLength" in adapted):
        new_min, new_max = adjust_length_limits_for_cjk(
            adapted.get("minLength") if isinstance(adapted.get("minLength"), int) else None,
            adapted.get("maxLength") if isinstance(adapted.get("maxLength"), int) else None,
        )
        if new_min is not None:
            adapted["minLength"] = new_min
        if new_max is not None:
            adapted["maxLength"] = new_max

    return adapted


def clamp_value_to_schema(value: Any, schema: Any) -> Any:
    """Clamp/truncate generated values so they satisfy length constraints."""
    if not isinstance(schema, dict):
        return value

    if "$ref" in schema:
        return value

    if "anyOf" in schema and isinstance(schema["anyOf"], list):
        for option in schema["anyOf"]:
            return clamp_value_to_schema(value, option)
        return value

    if "oneOf" in schema and isinstance(schema["oneOf"], list):
        for option in schema["oneOf"]:
            return clamp_value_to_schema(value, option)
        return value

    schema_type = schema.get("type")
    if isinstance(schema_type, list):
        type_names = [item for item in schema_type if isinstance(item, str)]
    elif isinstance(schema_type, str):
        type_names = [schema_type]
    else:
        type_names = []

    if "object" in type_names and isinstance(value, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            return {
                key: clamp_value_to_schema(item, properties[key])
                if key in properties
                else item
                for key, item in value.items()
            }
        return value

    if "array" in type_names and isinstance(value, list):
        item_schema = schema.get("items")
        return [clamp_value_to_schema(item, item_schema) for item in value]

    if "string" in type_names and isinstance(value, str):
        text = value
        max_length = schema.get("maxLength")
        if isinstance(max_length, int) and max_length > 0 and len(text) > max_length:
            text = truncate_prefer_sentence(text, max_length)
        return text

    return value


def truncate_prefer_sentence(text: str, max_length: int) -> str:
    if len(text) <= max_length:
        return text
    clipped = text[:max_length]
    for sep in ("。", "！", "？", "；", ".", "!", "?", ";", "，", ",", " "):
        idx = clipped.rfind(sep)
        if idx >= max(8, max_length // 3):
            return clipped[: idx + (1 if sep in "。！？；.!?;" else 0)].rstrip()
    return clipped.rstrip()


def apply_cjk_font_fallback(font: Any) -> Any:
    """Attach CJK-capable fallbacks without removing the template font."""
    if not isinstance(font, dict):
        return font
    updated = dict(font)
    existing_name = str(updated.get("name") or updated.get("family") or "").strip()
    fallback_chain = list(CJK_FONT_FALLBACKS)
    if existing_name and existing_name not in fallback_chain:
        fallback_chain.insert(0, existing_name)
    # Keep primary name; browsers/PPT exporters that honor stacks get CJK coverage.
    updated["fallback"] = fallback_chain
    if not existing_name:
        updated["name"] = CJK_FONT_FALLBACKS[0]
    return updated


CJK_SLIDE_CONTENT_RULES = """
# CJK / Chinese Layout Rules
- Prefer concise copy. Chinese characters are wider than Latin letters.
- Never pad text to satisfy length; shorter accurate wording is better.
- Cover/title fields: keep titles short (about 8–16 Chinese characters when possible).
- Body fields: prefer compact sentences; avoid long stacked clauses in one field.
- If a field feels tight, shorten rather than wrapping awkwardly.
- Do not repeat the same phrase across overlapping title layers.
"""
