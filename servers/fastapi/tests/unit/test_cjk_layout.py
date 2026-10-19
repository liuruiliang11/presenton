from utils.cjk_layout import (
    adapt_json_schema_lengths_for_cjk,
    adjust_length_limits_for_cjk,
    clamp_value_to_schema,
    should_use_cjk_layout,
    truncate_prefer_sentence,
)


def test_should_use_cjk_layout_from_language_or_text():
    assert should_use_cjk_layout("Chinese")
    assert should_use_cjk_layout("zh-CN")
    assert should_use_cjk_layout(None, "大模型时代")
    assert not should_use_cjk_layout("English", "Hello world")


def test_adjust_length_limits_for_cjk_relaxes_min_and_tightens_max():
    new_min, new_max = adjust_length_limits_for_cjk(40, 80)
    assert new_max is not None and new_max < 80
    assert new_min is not None and new_min < 40
    assert new_min <= new_max


def test_adapt_json_schema_lengths_for_cjk():
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "minLength": 30, "maxLength": 60},
        },
    }
    adapted = adapt_json_schema_lengths_for_cjk(schema)
    title = adapted["properties"]["title"]
    assert title["maxLength"] < 60
    assert title["minLength"] < 30


def test_clamp_value_to_schema_truncates_long_strings():
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "maxLength": 8},
        },
    }
    clamped = clamp_value_to_schema(
        {"title": "这是一个明显过长的中文标题内容"},
        schema,
    )
    assert len(clamped["title"]) <= 8


def test_truncate_prefer_sentence():
    text = "第一句。第二句很长很长很长很长"
    assert truncate_prefer_sentence(text, 6).endswith("。") or len(
        truncate_prefer_sentence(text, 6)
    ) <= 6
