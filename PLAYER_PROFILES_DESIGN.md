# Player Profiles & User Accounts - Design Document

## Overview

This document outlines the design for implementing Player Profiles with user authentication and personal dashboards. The feature requires a multi-phase approach, starting with user accounts and authentication before building the profile dashboard.

---

## Phase 1: User Authentication & Accounts

### 1.1 Database Schema Changes

#### New `users` Table
```python
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Relationship to Player (one-to-one)
    player: Mapped["Player | None"] = relationship("Player", back_populates="user", uselist=False)
```

#### Update `players` Table
```python
class Player(Base):
    # ... existing fields ...
    
    # Link to user account (optional - for backward compatibility)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, unique=True)
    user: Mapped["User | None"] = relationship("User", back_populates="player")
    
    # New profile fields
    bio: Mapped[str | None] = mapped_column(Text)
    profile_picture_url: Mapped[str | None] = mapped_column(String(500))
    injury_status: Mapped[str | None] = mapped_column(String(100))  # "healthy", "injured", "recovering"
    injury_notes: Mapped[str | None] = mapped_column(Text)
    phone_number: Mapped[str | None] = mapped_column(String(20))
    preferred_contact_method: Mapped[str | None] = mapped_column(String(50))  # "email", "sms", "whatsapp"
```

### 1.2 Authentication System

#### Backend Components

**`backend/app/auth/`**
- `dependencies.py` - Auth dependencies (get_current_user, get_current_active_user)
- `security.py` - Password hashing, JWT token generation/verification
- `schemas.py` - Auth schemas (Token, UserLogin, UserRegister, UserRead)
- `router.py` - Auth endpoints (POST /auth/register, POST /auth/login, POST /auth/refresh)

**JWT Token Structure:**
```python
{
    "sub": "user_id",  # Subject (user ID)
    "email": "user@example.com",
    "exp": timestamp,
    "iat": timestamp
}
```

**Endpoints:**
- `POST /auth/register` - Register new user account
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout (client-side token removal)

#### Frontend Components

**`frontend/src/auth/`**
- `AuthContext.tsx` - Auth context provider
- `useAuth.ts` - Auth hook
- `LoginPage.tsx` - Login form
- `RegisterPage.tsx` - Registration form
- `ProtectedRoute.tsx` - Route wrapper for protected pages
- `api/auth.ts` - Auth API client

**Auth Flow:**
1. User registers/logs in
2. JWT token stored in localStorage or httpOnly cookie
3. Token included in API requests via axios interceptor
4. Token refresh on expiry
5. Redirect to login on 401

### 1.3 User-Player Association

**Options:**
1. **During Registration**: User can link to existing Player or create new Player
2. **After Registration**: User can claim/link their Player profile
3. **Admin Assignment**: Admin can link User to Player

**API Endpoints:**
- `POST /users/me/claim-player` - Claim an existing player profile
- `POST /users/me/create-player` - Create new player profile linked to user
- `GET /users/me/player` - Get current user's player profile

---

## Phase 2: Player Profile Dashboard

### 2.1 Profile Page Structure

**Route:** `/profile` or `/players/:id` (if viewing own profile, redirect to `/profile`)

**Sections:**

#### 2.1.1 Profile Header
- Profile picture (upload/change)
- Name
- Current rating
- Active status badge
- Edit profile button (if own profile)

#### 2.1.2 Quick Stats Cards
- Total matches played
- Win rate
- Total goals
- Total assists
- Average goals per match
- Current rating

#### 2.1.3 Statistics Overview
- **Rating Progression Chart**: Line chart showing rating over time
- **Goals & Assists Over Time**: Bar/line chart
- **Matches Played by Month**: Bar chart
- **Win/Loss Record**: Pie chart or stats cards

#### 2.1.4 Match History
- Table of recent matches
- Columns: Date, Opponent Team, Score, Goals, Assists, Rating Change
- Link to match details
- Filter by date range

#### 2.1.5 Position & Availability Analysis
- **Position Heat Map**: Visual representation of positions played
- **Availability Patterns**: Chart showing availability by day of week
- **Preferred Position**: Display and edit

#### 2.1.6 Head-to-Head Comparisons
- Compare stats with other players
- Win rate vs specific players
- Goals scored when playing with/against specific players

#### 2.1.7 Achievements & Milestones
- Badges for achievements (100 goals, perfect attendance, etc.)
- Milestones reached
- Streaks (consecutive sessions, goals in matches)

### 2.2 Profile Settings

**Editable Fields:**
- Bio/notes
- Profile picture
- Phone number
- Preferred contact method
- Injury status
- Preferred position
- Notification preferences

**API Endpoints:**
- `GET /players/{id}/profile` - Get full player profile with stats
- `PUT /players/{id}/profile` - Update profile (only own profile or admin)
- `POST /players/{id}/profile-picture` - Upload profile picture
- `GET /players/{id}/stats` - Get detailed statistics
- `GET /players/{id}/matches` - Get match history
- `GET /players/{id}/availability-patterns` - Get availability analysis

---

## Phase 3: Enhanced Features

### 3.1 Personal Dashboard

**Route:** `/dashboard` (user's personal dashboard)

**Features:**
- Upcoming sessions (with quick availability response)
- Recent match results
- Rating changes
- Personal goals/targets
- Notifications
- Quick actions (set availability, view profile, etc.)

### 3.2 Notifications System

**Types:**
- Session reminders
- Availability deadline reminders
- Match result notifications
- Rating change notifications
- Achievement unlocks
- Comments/mentions

**Delivery Methods:**
- In-app notifications
- Email notifications
- SMS (optional)
- Push notifications (future mobile app)

### 3.3 Privacy & Permissions

**Profile Visibility:**
- Public: All stats visible to everyone
- Private: Only basic info visible
- Friends only: Stats visible to linked players

**Data Access:**
- Players can only edit their own profile
- Admins can edit any profile
- Viewers can see public profiles

---

## Implementation Phases

### Phase 1: Foundation (High Priority)
1. ✅ Add user authentication system
2. ✅ Create user accounts
3. ✅ Link users to players
4. ✅ Protect API endpoints
5. ✅ Add login/register pages

### Phase 2: Basic Profiles (Medium Priority)
1. ✅ Add profile fields to Player model
2. ✅ Create profile page UI
3. ✅ Display basic stats
4. ✅ Profile editing
5. ✅ Profile picture upload

### Phase 3: Advanced Features (Lower Priority)
1. ✅ Statistics dashboard
2. ✅ Charts and visualizations
3. ✅ Match history
4. ✅ Availability patterns
5. ✅ Head-to-head comparisons

### Phase 4: Personalization (Future)
1. ✅ Personal dashboard
2. ✅ Notifications
3. ✅ Achievements
4. ✅ Goals/targets
5. ✅ Social features

---

## Database Migration Strategy

### Migration 1: Add User Accounts
```python
# alembic/versions/002_add_user_accounts.py
- Create users table
- Add user_id to players table (nullable)
- Create foreign key relationship
```

### Migration 2: Add Profile Fields
```python
# alembic/versions/003_add_player_profile_fields.py
- Add bio, profile_picture_url, injury_status, etc. to players
- Add phone_number, preferred_contact_method
```

### Migration 3: Data Migration (if needed)
- Link existing players to new user accounts (manual or script)
- Set default values for new fields

---

## Security Considerations

1. **Password Security**
   - Use bcrypt for password hashing
   - Enforce password strength requirements
   - Implement password reset flow

2. **JWT Security**
   - Short-lived access tokens (15-30 min)
   - Longer-lived refresh tokens (7-30 days)
   - Store refresh tokens securely (httpOnly cookies preferred)
   - Implement token rotation

3. **API Security**
   - Rate limiting on auth endpoints
   - CSRF protection
   - Input validation and sanitization
   - SQL injection prevention (SQLAlchemy ORM handles this)

4. **Authorization**
   - Role-based access control (admin, player, viewer)
   - Resource-level permissions (can edit own profile only)
   - Admin override capabilities

---

## API Design

### Authentication Endpoints

```python
POST /auth/register
Request: {
    "email": "user@example.com",
    "username": "username",
    "password": "securepassword",
    "player_id": 123  # Optional: link to existing player
}
Response: {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "user": { ... }
}

POST /auth/login
Request: {
    "email": "user@example.com",
    "password": "password"
}
Response: {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer"
}

GET /auth/me
Headers: Authorization: Bearer <token>
Response: {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "player": { ... }  # If linked
}
```

### Profile Endpoints

```python
GET /players/{id}/profile
Response: {
    "id": 1,
    "name": "Player Name",
    "rating": 1025.5,
    "bio": "...",
    "profile_picture_url": "...",
    "stats": {
        "matches_played": 50,
        "wins": 30,
        "losses": 15,
        "draws": 5,
        "total_goals": 45,
        "total_assists": 20,
        "win_rate": 0.6
    },
    "recent_matches": [ ... ],
    "rating_history": [ ... ]
}

PUT /players/{id}/profile
Request: {
    "bio": "Updated bio",
    "preferred_position": "GK",
    "phone_number": "+33..."
}
```

---

## Frontend Architecture

### Component Structure

```
frontend/src/
├── auth/
│   ├── AuthContext.tsx
│   ├── useAuth.ts
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ProtectedRoute.tsx
│   └── api/
│       └── auth.ts
├── pages/
│   ├── ProfilePage.tsx          # Own profile
│   ├── PlayerProfilePage.tsx    # View other player's profile
│   └── DashboardPage.tsx        # Personal dashboard
├── components/
│   ├── ProfileHeader.tsx
│   ├── StatsCards.tsx
│   ├── RatingChart.tsx
│   ├── MatchHistoryTable.tsx
│   ├── AvailabilityPatternChart.tsx
│   └── ProfileEditForm.tsx
└── hooks/
    └── usePlayerStats.ts
```

### State Management

- Use React Context for auth state
- Use React Query or SWR for data fetching and caching
- Local state for form inputs

---

## User Experience Flow

### First-Time User
1. User visits app
2. Sees public sessions/players
3. Decides to create account
4. Registers → creates User account
5. Option to:
   - Link to existing Player (if name matches)
   - Create new Player profile
6. Redirected to profile setup
7. Completes profile (bio, picture, etc.)
8. Can now access personal dashboard

### Existing Player Creating Account
1. Player already exists in system (created by admin)
2. User registers with email
3. Claims existing player profile (by name or admin assignment)
4. Gets access to their profile dashboard
5. Can edit their profile

### Returning User
1. Logs in
2. Redirected to dashboard
3. Sees upcoming sessions, recent activity
4. Can navigate to profile, sessions, etc.

---

## Benefits of This Approach

1. **Security**: Proper authentication and authorization
2. **Personalization**: Each user has their own view
3. **Privacy**: Users control their data visibility
4. **Scalability**: Foundation for future features (notifications, social, etc.)
5. **Data Integrity**: User accounts ensure data belongs to real people
6. **Mobile Ready**: Authentication system enables future mobile app

---

## Migration Path for Existing Data

1. **Phase 1**: Add auth system (no breaking changes)
2. **Phase 2**: Users can register and claim existing players
3. **Phase 3**: Gradually migrate to user-based access
4. **Phase 4**: Optional: Require authentication for all actions

---

## Open Questions

1. **Should anonymous access remain?**
   - Option A: Keep public view, require auth for editing
   - Option B: Require auth for all access
   - Recommendation: Option A for better UX

2. **How to handle multiple players per user?**
   - One user = one player (simpler)
   - One user = multiple players (more complex, edge case)
   - Recommendation: Start with one-to-one, extend later if needed

3. **Profile picture storage?**
   - Local file storage
   - Cloud storage (S3, Cloudinary)
   - Recommendation: Start with local, migrate to cloud later

4. **Notification delivery?**
   - In-app only initially
   - Add email later
   - SMS as premium feature

---

## Conclusion

The Player Profiles feature should be built on a foundation of user authentication and accounts. This provides:
- Security and data ownership
- Personalization capabilities
- Foundation for future features
- Better user experience

The implementation should be phased, starting with authentication, then basic profiles, then advanced features.

