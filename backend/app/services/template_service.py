"""Service for session template operations."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .. import models
from ..core.config import settings


def combine_template_date_and_time(
    date: datetime,
    time_of_day: time,
    tz: ZoneInfo | None = None,
) -> datetime:
    """Combine a calendar date with a template wall-clock time in the app timezone."""
    app_tz = tz or ZoneInfo(settings.app_timezone)

    if date.tzinfo is None:
        local_date = date.date()
    else:
        local_date = date.astimezone(app_tz).date()

    return datetime.combine(local_date, time_of_day, tzinfo=app_tz)


def to_app_timezone(value: datetime, tz: ZoneInfo | None = None) -> datetime:
    """Normalize a datetime to the application timezone."""
    app_tz = tz or ZoneInfo(settings.app_timezone)
    if value.tzinfo is None:
        return value.replace(tzinfo=app_tz)
    return value.astimezone(app_tz)


class TemplateService:
    @staticmethod
    async def create_session_from_template(
        template: models.SessionTemplate,
        date: datetime,
        db: AsyncSession,
        max_players: Optional[int] = None,
    ) -> models.Session:
        """Create a single session from a template."""
        session_datetime = combine_template_date_and_time(date, template.time_of_day)

        session = models.Session(
            date=session_datetime,
            location=template.location,
            max_players=max_players or template.max_players,
            template_id=template.id,
            status=models.SessionStatus.PLANNED,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def generate_recurring_sessions(
        template: models.SessionTemplate,
        db: AsyncSession,
    ) -> list[models.Session]:
        """Generate all recurring sessions up to the end date."""
        if not template.recurrence_type or template.recurrence_type == models.RecurrenceType.NONE:
            return []

        if not template.recurrence_start or not template.recurrence_end:
            return []

        app_tz = ZoneInfo(settings.app_timezone)
        sessions = []
        current_date = to_app_timezone(template.recurrence_start, app_tz)
        recurrence_end = to_app_timezone(template.recurrence_end, app_tz)

        existing_result = await db.execute(
            select(models.Session.date).where(
                models.Session.template_id == template.id
            )
        )
        existing_dates = {
            to_app_timezone(existing_date, app_tz).date()
            for existing_date in existing_result.scalars().all()
        }

        if template.day_of_week is not None:
            days_ahead = template.day_of_week - current_date.weekday()
            if days_ahead < 0:
                days_ahead += 7
            if days_ahead > 0:
                current_date = current_date + timedelta(days=days_ahead)

        max_sessions = 200
        session_count = 0

        while current_date <= recurrence_end and session_count < max_sessions:
            if current_date.date() not in existing_dates:
                session = await TemplateService.create_session_from_template(
                    template, current_date, db, None
                )
                sessions.append(session)
                session_count += 1

            if template.recurrence_type == models.RecurrenceType.WEEKLY:
                current_date = current_date + timedelta(weeks=1)
            elif template.recurrence_type == models.RecurrenceType.BIWEEKLY:
                current_date = current_date + timedelta(weeks=2)
            elif template.recurrence_type == models.RecurrenceType.MONTHLY:
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)

            if template.day_of_week is not None:
                days_ahead = template.day_of_week - current_date.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                if days_ahead > 0:
                    current_date = current_date + timedelta(days=days_ahead)

        template.last_generated = datetime.now(timezone.utc)
        await db.commit()

        return sessions
