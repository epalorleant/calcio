# Session Template Implementation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  TemplateList  │  TemplateForm  │  CreateFromTemplate      │
│  (List View)   │  (Create/Edit) │  (Quick Create Modal)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
├─────────────────────────────────────────────────────────────┤
│  GET    /session-templates                                   │
│  POST   /session-templates                                   │
│  PUT    /session-templates/{id}                              │
│  DELETE /session-templates/{id}                              │
│  POST   /session-templates/{id}/create-session              │
│  POST   /session-templates/{id}/generate-recurring           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  TemplateService.create_session_from_template()             │
│  TemplateService.generate_recurring_sessions()              │
│  TemplateService.calculate_next_occurrence()                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  session_templates table                                     │
│  sessions.template_id (FK)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Create Weekly Template

```
User Action: Create "Tuesday Night Futsal" template
    │
    ├─> Frontend: TemplateForm
    │   ├─ Name: "Tuesday Night Futsal"
    │   ├─ Location: "Community Gym"
    │   ├─ Time: 18:00
    │   ├─ Day: Tuesday (1)
    │   ├─ Max Players: 10
    │   └─ Recurrence: Weekly (2024-01-01 to 2024-12-31)
    │
    ├─> API: POST /session-templates
    │   └─> Database: Insert template
    │
    └─> Result: Template created, ready for session generation
```

### Example 2: Generate Recurring Sessions

```
User Action: Click "Generate Recurring Sessions"
    │
    ├─> Frontend: Calls POST /session-templates/{id}/generate-recurring
    │
    ├─> API: TemplateService.generate_recurring_sessions()
    │   ├─ Calculate all dates between start and end
    │   ├─ Filter by day of week (Tuesday)
    │   ├─ Skip already created sessions
    │   └─ Create sessions for remaining dates
    │
    └─> Result: 52 sessions created (one per week)
```

### Example 3: Quick Create from Template

```
User Action: "Create Session" from template
    │
    ├─> Frontend: Opens modal with date picker
    │   ├─ Pre-fills: Location, Time, Max Players
    │   └─ User selects: Date
    │
    ├─> API: POST /session-templates/{id}/create-session
    │   └─> Service: Create session with template defaults
    │
    └─> Result: New session created, redirect to session detail
```

## Code Structure

### Backend Structure

```
backend/app/
├── models.py
│   └── SessionTemplate (new model)
│   └── Session (add template_id)
│
├── schemas.py
│   ├── SessionTemplateCreate
│   ├── SessionTemplateRead
│   ├── CreateSessionFromTemplate
│   └── CreateSessionsFromTemplate
│
├── routers/
│   └── templates.py (new router)
│
└── services/
    └── template_service.py (new service)
```

### Frontend Structure

```
frontend/src/
├── api/
│   └── templates.ts (new API client)
│
├── components/
│   ├── TemplateList.tsx
│   ├── TemplateForm.tsx
│   ├── TemplateCard.tsx
│   ├── RecurrenceSettings.tsx
│   └── CreateSessionFromTemplateModal.tsx
│
└── pages/
    └── TemplatesPage.tsx (new page)
```

## Key Design Decisions

### 1. Template vs Session Separation

**Decision**: Templates are separate entities, not sessions
- **Rationale**: Templates are reusable configurations, sessions are actual events
- **Benefit**: Can create many sessions from one template
- **Trade-off**: Need to maintain relationship between template and sessions

### 2. Recurrence Calculation

**Decision**: Calculate on-demand, not background job
- **Rationale**: Simpler implementation, user controls when to generate
- **Benefit**: No cron jobs needed, explicit user action
- **Trade-off**: User must manually trigger generation (can add cron later)

### 3. Date/Time Handling

**Decision**: Store time separately, combine with date on creation
- **Rationale**: Templates have time (18:00), sessions have full datetime
- **Benefit**: Flexible - can use same template for different dates
- **Implementation**: `datetime.combine(template_date.date(), template.time_of_day)`

### 4. Day of Week Storage

**Decision**: Store as integer (0=Monday, 6=Sunday)
- **Rationale**: Simple, standard approach
- **Benefit**: Easy to calculate next occurrence
- **Alternative Considered**: Store as enum, but integer is more flexible

### 5. Template Deletion

**Decision**: Soft delete (active flag) or cascade delete
- **Option A**: Cascade delete - removes template and all sessions
- **Option B**: Soft delete - marks inactive, keeps sessions
- **Recommendation**: Start with cascade, add soft delete if needed

## UI/UX Considerations

### Template List View

- **Card Layout**: Each template as a card showing key info
- **Quick Actions**: 
  - "Create Session" button (opens modal)
  - "Generate Recurring" button (with confirmation)
  - "Edit" and "Delete" buttons
- **Status Indicators**: 
  - Active/Inactive badge
  - Recurrence type badge
  - Session count badge

### Template Form

- **Progressive Disclosure**: 
  - Basic fields always visible
  - Recurrence settings shown only when recurrence type selected
- **Validation**:
  - Require recurrence dates if recurrence type selected
  - Validate end date is after start date
  - Validate day of week matches recurrence pattern

### Create Session Modal

- **Smart Defaults**: Pre-fill all fields from template
- **Override Capability**: Allow changing date and max_players
- **Quick Actions**: 
  - "Create & View" - creates and navigates to session
  - "Create & Add Another" - creates and stays in modal

## Error Handling

### Template Service Errors

1. **Invalid Date Range**: Recurrence end before start
2. **No Valid Dates**: Recurrence pattern produces no valid dates
3. **Template Not Found**: When creating from non-existent template
4. **Duplicate Sessions**: Attempt to create session that already exists

### User Feedback

- Success: Toast notification + redirect or refresh
- Error: Inline error messages + toast for critical errors
- Loading: Disable buttons, show spinner during operations

## Testing Strategy

### Unit Tests

1. **TemplateService Tests**:
   - `test_create_session_from_template()`
   - `test_generate_weekly_recurring()`
   - `test_generate_biweekly_recurring()`
   - `test_generate_monthly_recurring()`
   - `test_skip_existing_sessions()`

2. **API Tests**:
   - `test_create_template()`
   - `test_list_templates()`
   - `test_create_session_from_template()`
   - `test_generate_recurring_sessions()`

### Integration Tests

1. Create template → Generate recurring → Verify sessions created
2. Create template → Create session → Verify relationship
3. Delete template → Verify cascade behavior

## Migration Strategy

### Phase 1: Basic Implementation
1. Add database models
2. Create basic CRUD endpoints
3. Create simple frontend list/form
4. Test with manual session creation

### Phase 2: Recurring Sessions
1. Add recurrence logic
2. Add generate endpoint
3. Add recurrence UI
4. Test with various recurrence patterns

### Phase 3: Polish & Enhancements
1. Add template usage stats
2. Add bulk operations
3. Add template cloning
4. Add search/filter capabilities

## Performance Considerations

### Recurring Session Generation

**Challenge**: Generating many sessions at once (e.g., 52 weekly sessions)

**Solutions**:
1. **Batch Creation**: Create sessions in batches of 10-20
2. **Progress Indicator**: Show progress for large generations
3. **Background Job**: For very large generations, use background job
4. **Limit**: Cap generation at reasonable number (e.g., 100 sessions max)

### Template List Performance

**Optimization**:
- Paginate template list if many templates
- Lazy load session counts
- Cache template data in frontend

## Security Considerations

1. **Template Ownership**: If multi-user, add user_id to templates
2. **Validation**: Validate all template inputs server-side
3. **Rate Limiting**: Limit bulk session creation to prevent abuse
4. **Date Validation**: Prevent creating sessions in the past (optional)

## Future Enhancements

1. **Template Categories**: Group templates (e.g., "Regular", "Tournament", "Training")
2. **Template Sharing**: Share templates between users
3. **Auto-Generation**: Cron job to auto-generate recurring sessions
4. **Template Analytics**: Track which templates are used most
5. **Smart Scheduling**: Suggest optimal times based on player availability
6. **Template Presets**: Pre-built templates for common scenarios

