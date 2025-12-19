# Session Template Feature Design

## Overview

Session Templates allow users to save common session configurations and quickly create sessions from them. This includes support for recurring sessions (weekly, bi-weekly, etc.) and one-time templates.

## Features

1. **Template Management**
   - Create, read, update, delete templates
   - Templates store: location, time, max_players, optional notes
   - Templates can be named and have descriptions

2. **Recurring Sessions**
   - Create sessions automatically based on schedule (weekly, bi-weekly, monthly)
   - Start date, end date, and recurrence pattern
   - Automatic session generation

3. **Quick Session Creation**
   - Create session from template with date override
   - Bulk create multiple sessions from template

## Database Design

### SessionTemplate Model

```python
class SessionTemplate(Base):
    __tablename__ = "session_templates"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    time_of_day: Mapped[time] = mapped_column(Time, nullable=False)  # e.g., 18:00
    day_of_week: Mapped[int | None] = mapped_column(Integer)  # 0=Monday, 6=Sunday, None for one-time
    max_players: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Recurrence settings
    recurrence_type: Mapped[RecurrenceType | None] = mapped_column(Enum(RecurrenceType))  # WEEKLY, BIWEEKLY, MONTHLY, NONE
    recurrence_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    recurrence_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_generated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Relationship to sessions created from this template
    sessions: Mapped[list["Session"]] = relationship(back_populates="template")
```

### Session Model Update

Add template relationship:
```python
template_id: Mapped[int | None] = mapped_column(ForeignKey("session_templates.id"), nullable=True)
template: Mapped["SessionTemplate | None"] = relationship(back_populates="sessions")
```

### RecurrenceType Enum

```python
class RecurrenceType(enum.Enum):
    NONE = "NONE"           # One-time template
    WEEKLY = "WEEKLY"       # Every week
    BIWEEKLY = "BIWEEKLY"   # Every 2 weeks
    MONTHLY = "MONTHLY"     # Every month
```

## API Design

### Endpoints

#### Template Management

```
GET    /session-templates              # List all templates
GET    /session-templates/{id}         # Get template details
POST   /session-templates              # Create template
PUT    /session-templates/{id}         # Update template
DELETE /session-templates/{id}         # Delete template
```

#### Session Creation from Template

```
POST   /session-templates/{id}/create-session     # Create single session from template
POST   /session-templates/{id}/create-sessions    # Create multiple sessions (bulk)
POST   /session-templates/{id}/generate-recurring  # Generate recurring sessions up to end date
```

### Request/Response Schemas

```python
class SessionTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: str
    time_of_day: time  # HH:MM format
    day_of_week: Optional[int] = None  # 0-6, None for one-time
    max_players: int = 10
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_start: Optional[datetime] = None
    recurrence_end: Optional[datetime] = None

class SessionTemplateRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: str
    time_of_day: time
    day_of_week: Optional[int]
    max_players: int
    active: bool
    recurrence_type: Optional[RecurrenceType]
    recurrence_start: Optional[datetime]
    recurrence_end: Optional[datetime]
    last_generated: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    session_count: int  # Number of sessions created from this template

class CreateSessionFromTemplate(BaseModel):
    date: datetime  # Override template date/time
    max_players: Optional[int] = None  # Override template max_players

class CreateSessionsFromTemplate(BaseModel):
    dates: list[datetime]  # Multiple dates
    max_players: Optional[int] = None
```

## Service Layer

### TemplateService

```python
class TemplateService:
    @staticmethod
    async def create_session_from_template(
        template: SessionTemplate,
        date: datetime,
        max_players: Optional[int] = None,
        db: AsyncSession
    ) -> Session:
        """Create a single session from template."""
        # Combine template date/time with provided date
        session_date = datetime.combine(date.date(), template.time_of_day)
        session_date = session_date.replace(tzinfo=date.tzinfo)
        
        session = Session(
            date=session_date,
            location=template.location,
            max_players=max_players or template.max_players,
            template_id=template.id,
        )
        db.add(session)
        await db.commit()
        return session
    
    @staticmethod
    async def generate_recurring_sessions(
        template: SessionTemplate,
        db: AsyncSession
    ) -> list[Session]:
        """Generate all recurring sessions up to end date."""
        if not template.recurrence_type or template.recurrence_type == RecurrenceType.NONE:
            return []
        
        if not template.recurrence_start or not template.recurrence_end:
            return []
        
        sessions = []
        current_date = template.recurrence_start
        
        # Get existing session dates to avoid duplicates
        existing_dates = await db.execute(
            select(Session.date).where(Session.template_id == template.id)
        )
        existing_dates_set = {d.date() for d in existing_dates.scalars().all()}
        
        while current_date <= template.recurrence_end:
            # Check if session already exists for this date
            if current_date.date() not in existing_dates_set:
                session = await TemplateService.create_session_from_template(
                    template, current_date, None, db
                )
                sessions.append(session)
            
            # Calculate next occurrence
            if template.recurrence_type == RecurrenceType.WEEKLY:
                current_date += timedelta(weeks=1)
            elif template.recurrence_type == RecurrenceType.BIWEEKLY:
                current_date += timedelta(weeks=2)
            elif template.recurrence_type == RecurrenceType.MONTHLY:
                # Add one month (approximate)
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
        
        # Update template last_generated
        template.last_generated = datetime.now(timezone.utc)
        await db.commit()
        
        return sessions
```

## Frontend Design

### Components

1. **TemplateList** - List all templates with actions
2. **TemplateForm** - Create/edit template
3. **TemplateCard** - Display template with quick actions
4. **RecurrenceSettings** - Configure recurrence pattern
5. **CreateSessionFromTemplate** - Modal/form to create session from template

### UI Flow

#### Template Management Page

```
/session-templates
├── Header: "Session Templates" + "Create Template" button
├── Template List (cards or table)
│   ├── Template name
│   ├── Location & time
│   ├── Recurrence info
│   ├── Actions: Edit, Delete, Create Session, Generate Recurring
└── Empty state: "No templates yet. Create your first template!"
```

#### Create Template Form

```
Fields:
- Name* (text input)
- Description (textarea)
- Location* (text input)
- Time* (time picker)
- Day of Week (dropdown: Monday-Sunday, or "One-time")
- Max Players* (number input)
- Recurrence Type (radio: None, Weekly, Bi-weekly, Monthly)
- Recurrence Start Date (date picker, shown if recurrence selected)
- Recurrence End Date (date picker, shown if recurrence selected)
```

#### Quick Create Session

```
Modal/Form:
- Template: [Selected template name] (read-only)
- Date* (datetime picker, pre-filled with template time)
- Max Players (number, pre-filled from template, editable)
- [Create Session] button
```

## Implementation Plan

### Phase 1: Basic Templates
1. Create database models and migration
2. Create API endpoints for CRUD operations
3. Create frontend template management page
4. Add "Create from Template" option in session creation

### Phase 2: Recurring Sessions
1. Add recurrence logic to service layer
2. Add "Generate Recurring" endpoint
3. Add recurrence UI components
4. Add background job/cron for automatic generation (optional)

### Phase 3: Advanced Features
1. Template usage statistics
2. Clone template functionality
3. Template categories/tags
4. Bulk operations

## Example Usage Scenarios

### Scenario 1: Weekly Futsal Session
- Template: "Weekly Tuesday Futsal"
- Location: "Community Gym"
- Time: 18:00
- Day: Tuesday (1)
- Recurrence: Weekly
- Start: 2024-01-01
- End: 2024-12-31
- Result: Automatically creates 52 sessions

### Scenario 2: One-time Template
- Template: "Tournament Match"
- Location: "Sports Center"
- Time: 14:00
- Day: None (one-time)
- Recurrence: None
- Usage: User manually creates sessions when needed

### Scenario 3: Monthly Session
- Template: "Monthly All-Star Game"
- Location: "Main Arena"
- Time: 19:00
- Day: First Saturday
- Recurrence: Monthly
- Result: Creates 12 sessions throughout the year

## Database Migration

```python
# alembic migration
def upgrade():
    op.create_table(
        'session_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('time_of_day', sa.Time(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=True),
        sa.Column('max_players', sa.Integer(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('recurrence_type', sa.Enum('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'), nullable=True),
        sa.Column('recurrence_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recurrence_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_generated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.add_column('sessions', sa.Column('template_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_session_template', 'sessions', 'session_templates', ['template_id'], ['id'])
```

## Benefits

1. **Time Saving**: Quick session creation for regular schedules
2. **Consistency**: Standardized session settings
3. **Automation**: Recurring sessions reduce manual work
4. **Flexibility**: Override template values when needed
5. **Organization**: Better session planning and management

## Future Enhancements

1. **Smart Scheduling**: Suggest optimal times based on player availability
2. **Template Analytics**: Track which templates are used most
3. **Template Sharing**: Share templates between users/organizations
4. **Auto-invitations**: Automatically invite regular players
5. **Template Presets**: Pre-built templates for common scenarios

