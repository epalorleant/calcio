# Session Template - Example Code Snippets

## Backend Examples

### Model Definition

```python
# backend/app/models.py

class RecurrenceType(enum.Enum):
    NONE = "NONE"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"


class SessionTemplate(Base):
    __tablename__ = "session_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    time_of_day: Mapped[time] = mapped_column(Time, nullable=False)
    day_of_week: Mapped[int | None] = mapped_column(Integer)  # 0=Monday, 6=Sunday
    max_players: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    recurrence_type: Mapped[RecurrenceType | None] = mapped_column(Enum(RecurrenceType))
    recurrence_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    recurrence_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_generated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    
    sessions: Mapped[list["Session"]] = relationship(back_populates="template")
```

### Service Implementation

```python
# backend/app/services/template_service.py

from datetime import datetime, time, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
        session_datetime = datetime.combine(
            date.date(),
            template.time_of_day,
            tzinfo=date.tzinfo or timezone.utc
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
            current_date = current_date + timedelta(days=days_ahead)
        
        # Generate sessions
        while current_date <= template.recurrence_end:
            if current_date.date() not in existing_dates:
                session = await TemplateService.create_session_from_template(
                    template, current_date, None, db
                )
                sessions.append(session)
            
            current_date = get_next_date(current_date)
            
            # If day of week is specified, ensure we stay on that day
            if template.day_of_week is not None:
                days_ahead = template.day_of_week - current_date.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                current_date = current_date + timedelta(days=days_ahead)
        
        # Update template's last_generated timestamp
        template.last_generated = datetime.now(timezone.utc)
        await db.commit()
        
        return sessions
```

### API Router Example

```python
# backend/app/routers/templates.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .. import models, schemas
from ..db import get_db
from ..services import template_service

router = APIRouter(prefix="/session-templates", tags=["templates"])


@router.post("/", response_model=schemas.SessionTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: schemas.SessionTemplateCreate,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionTemplateRead:
    template = models.SessionTemplate(
        name=template_in.name,
        description=template_in.description,
        location=template_in.location,
        time_of_day=template_in.time_of_day,
        day_of_week=template_in.day_of_week,
        max_players=template_in.max_players,
        recurrence_type=template_in.recurrence_type,
        recurrence_start=template_in.recurrence_start,
        recurrence_end=template_in.recurrence_end,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/", response_model=list[schemas.SessionTemplateRead])
async def list_templates(
    active: bool | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[schemas.SessionTemplateRead]:
    stmt = select(models.SessionTemplate)
    if active is not None:
        stmt = stmt.where(models.SessionTemplate.active == active)
    stmt = stmt.order_by(models.SessionTemplate.created_at.desc())
    
    result = await db.execute(stmt)
    templates = result.scalars().all()
    
    # Get session counts for each template
    for template in templates:
        count_result = await db.execute(
            select(func.count(models.Session.id)).where(
                models.Session.template_id == template.id
            )
        )
        template.session_count = count_result.scalar() or 0
    
    return templates


@router.post("/{template_id}/create-session", response_model=schemas.SessionRead)
async def create_session_from_template(
    template_id: int,
    payload: schemas.CreateSessionFromTemplate,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionRead:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    session = await template_service.TemplateService.create_session_from_template(
        template, payload.date, payload.max_players, db
    )
    return session


@router.post("/{template_id}/generate-recurring", response_model=list[schemas.SessionRead])
async def generate_recurring_sessions(
    template_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[schemas.SessionRead]:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    if not template.recurrence_type or template.recurrence_type == models.RecurrenceType.NONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template does not have recurrence enabled"
        )
    
    sessions = await template_service.TemplateService.generate_recurring_sessions(template, db)
    return sessions
```

## Frontend Examples

### Template Card Component

```typescript
// frontend/src/components/TemplateCard.tsx

import { memo } from "react";
import type { SessionTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";

interface TemplateCardProps {
  template: SessionTemplate;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateSession: (id: number) => void;
  onGenerateRecurring: (id: number) => void;
}

export const TemplateCard = memo(function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCreateSession,
  onGenerateRecurring,
}: TemplateCardProps) {
  const formatTime = (time: string) => {
    // time is in HH:MM format
    return time;
  };

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayName = template.day_of_week !== null ? dayNames[template.day_of_week] : "One-time";

  return (
    <div style={commonStyles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h3 style={commonStyles.smallHeading}>{template.name}</h3>
          {template.description && <p style={commonStyles.muted}>{template.description}</p>}
          <div style={{ marginTop: "0.5rem" }}>
            <p>
              <strong>Location:</strong> {template.location}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(template.time_of_day)}
              {template.day_of_week !== null && ` (${dayName})`}
            </p>
            <p>
              <strong>Max Players:</strong> {template.max_players}
            </p>
            {template.recurrence_type && (
              <p>
                <strong>Recurrence:</strong> {template.recurrence_type}
                {template.recurrence_start && template.recurrence_end && (
                  <span style={commonStyles.muted}>
                    {" "}
                    ({new Date(template.recurrence_start).toLocaleDateString()} -{" "}
                    {new Date(template.recurrence_end).toLocaleDateString()})
                  </span>
                )}
              </p>
            )}
            <p style={commonStyles.muted}>
              {template.session_count} session{template.session_count !== 1 ? "s" : ""} created
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
          <button style={commonStyles.button} onClick={() => onCreateSession(template.id)}>
            Create Session
          </button>
          {template.recurrence_type && template.recurrence_type !== "NONE" && (
            <button
              style={{ ...commonStyles.button, backgroundColor: "#059669" }}
              onClick={() => onGenerateRecurring(template.id)}
            >
              Generate Recurring
            </button>
          )}
          <button
            style={{ ...commonStyles.button, backgroundColor: "#6b7280" }}
            onClick={() => onEdit(template.id)}
          >
            Edit
          </button>
          <button
            style={{ ...commonStyles.button, backgroundColor: "#dc2626" }}
            onClick={() => onDelete(template.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});
```

### Create Session from Template Modal

```typescript
// frontend/src/components/CreateSessionFromTemplateModal.tsx

import { useState } from "react";
import type { SessionTemplate } from "../api/templates";
import { createSessionFromTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";

interface CreateSessionFromTemplateModalProps {
  template: SessionTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSessionFromTemplateModal({
  template,
  onClose,
  onSuccess,
}: CreateSessionFromTemplateModalProps) {
  const [date, setDate] = useState(() => {
    // Default to next occurrence of the day of week, or today
    const today = new Date();
    if (template.day_of_week !== null) {
      const daysAhead = template.day_of_week - today.getDay();
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysAhead < 0 ? daysAhead + 7 : daysAhead));
      return nextDate.toISOString().slice(0, 16);
    }
    return today.toISOString().slice(0, 16);
  });
  const [maxPlayers, setMaxPlayers] = useState(template.max_players);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sessionDate = new Date(date);
      // Combine with template time
      const [hours, minutes] = template.time_of_day.split(":").map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      await createSessionFromTemplate(template.id, {
        date: sessionDate.toISOString(),
        max_players: maxPlayers !== template.max_players ? maxPlayers : undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to create session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...commonStyles.card,
          maxWidth: "500px",
          width: "90%",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={commonStyles.heading}>Create Session from Template</h2>
        <p>
          <strong>Template:</strong> {template.name}
        </p>
        <p>
          <strong>Location:</strong> {template.location}
        </p>
        <p>
          <strong>Time:</strong> {template.time_of_day}
        </p>

        <form onSubmit={handleSubmit} style={commonStyles.form}>
          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Date</span>
            <input
              type="datetime-local"
              style={commonStyles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Max Players</span>
            <input
              type="number"
              min={2}
              max={30}
              style={commonStyles.input}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
          </label>

          {error && <p style={commonStyles.error}>{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" style={commonStyles.button} disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </button>
            <button
              type="button"
              style={{ ...commonStyles.button, backgroundColor: "#6b7280" }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Usage Examples

### Example 1: Weekly Tuesday Session

```python
# Create template
template = SessionTemplate(
    name="Weekly Tuesday Futsal",
    location="Community Gym",
    time_of_day=time(18, 0),  # 6:00 PM
    day_of_week=1,  # Tuesday
    max_players=10,
    recurrence_type=RecurrenceType.WEEKLY,
    recurrence_start=datetime(2024, 1, 1, tzinfo=timezone.utc),
    recurrence_end=datetime(2024, 12, 31, tzinfo=timezone.utc),
)

# Generate all sessions
sessions = await TemplateService.generate_recurring_sessions(template, db)
# Creates 52 sessions (one per week)
```

### Example 2: One-time Tournament Template

```python
# Create template
template = SessionTemplate(
    name="Tournament Match",
    location="Sports Center",
    time_of_day=time(14, 0),  # 2:00 PM
    day_of_week=None,  # One-time
    max_players=12,
    recurrence_type=RecurrenceType.NONE,
)

# Create session when needed
session = await TemplateService.create_session_from_template(
    template,
    datetime(2024, 6, 15, 14, 0),  # Specific date
    None,  # Use template max_players
    db
)
```

## Summary

This design provides:
- ✅ Flexible template system
- ✅ Recurring session support
- ✅ Quick session creation
- ✅ Clean separation of concerns
- ✅ Extensible architecture

The implementation can be done incrementally, starting with basic templates and adding recurrence features later.

