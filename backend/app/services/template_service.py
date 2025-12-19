"""Service for session template operations."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from .. import models


class TemplateService:
    @staticmethod
    async def create_session_from_template(
        template: models.SessionTemplate,
        date: datetime,
        max_players: Optional[int] = None,
        db: AsyncSession,
    ) -> models.Session:
        """Create a single session from a template."""
        # Combine the date with the template's time
        # Ensure timezone awareness
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        
        # Combine date with template time
        session_datetime = datetime.combine(
            date.date(),
            template.time_of_day,
            tzinfo=date.tzinfo
        )
        
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
        
        sessions = []
        current_date = template.recurrence_start
        
        # Get existing session dates to avoid duplicates
        existing_result = await db.execute(
            select(models.Session.date).where(
                models.Session.template_id == template.id
            )
        )
        existing_dates = {d.date() for d in existing_result.scalars().all()}
        
        # Calculate date increment based on recurrence type
        def get_next_date(d: datetime) -> datetime:
            if template.recurrence_type == models.RecurrenceType.WEEKLY:
                return d + timedelta(weeks=1)
            elif template.recurrence_type == models.RecurrenceType.BIWEEKLY:
                return d + timedelta(weeks=2)
            elif template.recurrence_type == models.RecurrenceType.MONTHLY:
                # Add one month
                if d.month == 12:
                    return d.replace(year=d.year + 1, month=1)
                else:
                    return d.replace(month=d.month + 1)
            return d
        
        # Start from the first occurrence of the day of week
        if template.day_of_week is not None:
            # Find first occurrence of the day of week
            days_ahead = template.day_of_week - current_date.weekday()
            if days_ahead < 0:
                days_ahead += 7
            if days_ahead > 0:
                current_date = current_date + timedelta(days=days_ahead)
        
        # Limit generation to prevent excessive sessions
        max_sessions = 200
        session_count = 0
        
        # Generate sessions
        while current_date <= template.recurrence_end and session_count < max_sessions:
            if current_date.date() not in existing_dates:
                session = await TemplateService.create_session_from_template(
                    template, current_date, None, db
                )
                sessions.append(session)
                session_count += 1
            
            # Move to next occurrence
            if template.recurrence_type == models.RecurrenceType.WEEKLY:
                current_date = current_date + timedelta(weeks=1)
            elif template.recurrence_type == models.RecurrenceType.BIWEEKLY:
                current_date = current_date + timedelta(weeks=2)
            elif template.recurrence_type == models.RecurrenceType.MONTHLY:
                # Add one month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            # If day of week is specified, ensure we stay on that day
            if template.day_of_week is not None:
                days_ahead = template.day_of_week - current_date.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                if days_ahead > 0:
                    current_date = current_date + timedelta(days=days_ahead)
        
        # Update template's last_generated timestamp
        template.last_generated = datetime.now(timezone.utc)
        await db.commit()
        
        return sessions

