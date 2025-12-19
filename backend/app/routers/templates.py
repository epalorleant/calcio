"""API router for session templates."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .. import models, schemas
from ..db import get_db
from ..services import template_service

router = APIRouter(prefix="/session-templates", tags=["templates"])


@router.post("/", response_model=schemas.SessionTemplateRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=schemas.SessionTemplateRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
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


@router.get("/", response_model=list[schemas.SessionTemplateWithCount])
@router.get("", response_model=list[schemas.SessionTemplateWithCount], include_in_schema=False)
async def list_templates(
    active: Optional[bool] = Query(default=None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
) -> list[schemas.SessionTemplateWithCount]:
    stmt = select(models.SessionTemplate)
    if active is not None:
        stmt = stmt.where(models.SessionTemplate.active == active)
    stmt = stmt.order_by(models.SessionTemplate.created_at.desc())
    
    result = await db.execute(stmt)
    templates = result.scalars().all()
    
    # Get session counts for each template
    templates_with_count = []
    for template in templates:
        count_result = await db.execute(
            select(func.count(models.Session.id)).where(
                models.Session.template_id == template.id
            )
        )
        session_count = count_result.scalar() or 0
        
        # Convert to schema with count
        template_data = schemas.SessionTemplateRead.model_validate(template)
        template_with_count = schemas.SessionTemplateWithCount(
            **template_data.model_dump(),
            session_count=session_count
        )
        templates_with_count.append(template_with_count)
    
    return templates_with_count


@router.get("/{template_id}", response_model=schemas.SessionTemplateWithCount)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionTemplateWithCount:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    # Get session count
    count_result = await db.execute(
        select(func.count(models.Session.id)).where(
            models.Session.template_id == template_id
        )
    )
    session_count = count_result.scalar() or 0
    
    template_data = schemas.SessionTemplateRead.model_validate(template)
    return schemas.SessionTemplateWithCount(
        **template_data.model_dump(),
        session_count=session_count
    )


@router.put("/{template_id}", response_model=schemas.SessionTemplateRead)
async def update_template(
    template_id: int,
    template_in: schemas.SessionTemplateUpdate,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionTemplateRead:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    updates = template_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(template, field, value)
    
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    # Delete template (sessions will keep template_id as null due to cascade behavior)
    stmt = delete(models.SessionTemplate).where(models.SessionTemplate.id == template_id)
    await db.execute(stmt)
    await db.commit()


@router.post("/{template_id}/create-session", response_model=schemas.SessionRead)
async def create_session_from_template(
    template_id: int,
    payload: schemas.CreateSessionFromTemplate,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionRead:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    if not template.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create session from inactive template"
        )
    
    session = await template_service.TemplateService.create_session_from_template(
        template, payload.date, db, payload.max_players
    )
    return session


@router.post("/{template_id}/create-sessions", response_model=list[schemas.SessionRead])
async def create_sessions_from_template(
    template_id: int,
    payload: schemas.CreateSessionsFromTemplate,
    db: AsyncSession = Depends(get_db),
) -> list[schemas.SessionRead]:
    template = await db.get(models.SessionTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    if not template.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create sessions from inactive template"
        )
    
    sessions = []
    for date in payload.dates:
        session = await template_service.TemplateService.create_session_from_template(
            template, date, db, payload.max_players
        )
        sessions.append(session)
    
    return sessions


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
    
    if not template.recurrence_start or not template.recurrence_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template recurrence dates are not set"
        )
    
    sessions = await template_service.TemplateService.generate_recurring_sessions(template, db)
    return sessions

