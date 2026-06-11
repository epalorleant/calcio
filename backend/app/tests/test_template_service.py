"""Tests for template session datetime handling."""
from datetime import datetime, time
from zoneinfo import ZoneInfo

from app.services.template_service import combine_template_date_and_time, to_app_timezone


def test_combine_template_date_and_time_uses_app_timezone():
    recurrence_start = datetime(2025, 6, 10, 10, 0, tzinfo=ZoneInfo("UTC"))
    session_dt = combine_template_date_and_time(
        recurrence_start,
        time(21, 30),
        tz=ZoneInfo("Europe/Paris"),
    )

    local = session_dt.astimezone(ZoneInfo("Europe/Paris"))
    assert local.date().isoformat() == "2025-06-10"
    assert local.hour == 21
    assert local.minute == 30


def test_to_app_timezone_from_utc():
    value = datetime(2025, 1, 5, 23, 0, tzinfo=ZoneInfo("UTC"))
    local = to_app_timezone(value, ZoneInfo("Europe/Paris"))

    assert local.date().isoformat() == "2025-01-06"
    assert local.hour == 0
