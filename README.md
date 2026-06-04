# Schedge

A full-stack scheduling application built with Next.js and Express, featuring calendar management, team coordination, event scheduling with weighted prioritization, and SMS/email reminders.

## Installation

Access the app at [`schedge.dev`](https://schedge.dev/).

---

## Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS
- Material UI

**Backend**

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- Twilio (SMS)
- Resend (Email)
- Cloudinary (Profile Pictures)
- node-cron (Schedule Reminders)

**Infrastructure**
- Azure Container Apps (frontend + backend)
- Docker
- Docker Hub
- Neon (PostgreSQL)

---

## Features

- **Authentication** — JWT-based auth with access/refresh token rotation, email verification, Google OAuth
- **Personal Scheduling** — Calendar view with date-based event browsing and pagination
- **Team Scheduling** — Shared team calendars, member management, team directory
- **Weighted Event Scheduling** — Events have integer weights (1–10); conflict detection prevents scheduling lower-priority events over higher-priority ones
- **Recurring Events** — Daily, weekly, monthly, and yearly recurrence with configurable span; bulk edit/delete future occurrences via `recurrence_id`
- **Requests** — Send and receive scheduling requests tied to specific events
- **Reminders** — Automated SMS and email reminders 30 minutes before events via cron job
- **Account Settings** — Profile editing, password change, avatar upload via Cloudinary
- **Public Profiles** — View other users' profiles and team memberships

---

## Project Structure

```
schedge/
├── frontend/          # Next.js application.
│   ├── app/
│   │   ├── (public)/    # Public pages like signin, signup, verify, etc.
│   │   ├── (protected)/ # Pages requiring authentication calendars, teams, etc.
│   ├── components/    # Calendar, EventsCard, AddEvent, Navbar, NumberField, etc.
│   └── api/           # api.ts — all fetch wrappers
│
└── backend/           # Express application
    ├── src/
    │   ├── routes/    # Backend routes (auth, teams, events, etc.)
    │   ├── middleware/ # Authentication check, validators.
    │   ├── services/  # Email, SMS and Profile Picture handlers.
    │   ├── jobs/      # Event reminders.
    │   ├── utils/     # Event conflict deterction.
    └── prisma/
        └── schema.prisma # Relational scheme and database configuration.
```

---

## Data Models

| Model          | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `User`         | Email, name, phone, hashed password, refresh token, avatar, verification |
| `Schedule`     | Personal schedule owned by a user                            |
| `TeamSchedule` | Schedule owned by a team                                     |
| `Event`        | Title, start/end time, weight, cycle, span, recurrence_id, schedule_type |
| `Team`         | Name, leader, members via Membership                         |
| `Membership`   | Join table: user ↔ team                                      |
| `Participates` | Join table: user ↔ event                                     |
| `Request`      | Sender, receiver, linked event, status                       |

---

## Deployment

The app is containerised and deployed to Azure Container Apps.

**Infrastructure**
| Resource           | Service                    |
| ------------------ | -------------------------- |
| Frontend           | Azure Container Apps       |
| Backend            | Azure Container Apps       |
| Database           | Neon (PostgreSQL)          |
| Container Registry | Docker Hub                 |
| Domain             | schedge.dev (Name.com)     |
| TLS                | Azure Managed Certificates |

## API Routes

### Auth (`/api`)
| Method | Route             | Description          |
| ------ | ----------------- | -------------------- |
| POST   | `/signup/`        | Register new user    |
| POST   | `/signin/`        | Sign in              |
| GET    | `/signout/`       | Sign out             |
| POST   | `/refresh`        | Refresh access token |
| GET    | `/user`           | Get current user     |
| PUT    | `/user/`          | Update profile       |
| PUT    | `/user/password/` | Change password      |
| PUT    | `/user/avatar/`   | Upload avatar        |
| GET    | `/users/`         | Search users         |
| GET    | `/users/:email/`  | Get public profile   |
| GET    | `/verify/`        | Verify email         |

### Events (`/api/event`)
| Method | Route                   | Description               |
| ------ | ----------------------- | ------------------------- |
| GET    | `/:schedule/`           | Get events for a schedule |
| POST   | `/:schedule/`           | Create event(s)           |
| PUT    | `/:schedule/:event_id/` | Edit event                |

### Schedules (`/api/schedule`)
| Method | Route     | Description              |
| ------ | --------- | ------------------------ |
| GET    | `/`       | Get personal schedule    |
| POST   | `/`       | Create personal schedule |
| GET    | `/:team/` | Get team schedule        |
| POST   | `/:team/` | Create team schedule     |

### Teams (`/api/team`)
| Method | Route                | Description      |
| ------ | -------------------- | ---------------- |
| GET    | `/`                  | Get user's teams |
| POST   | `/`                  | Create team      |
| GET    | `/:team_id/`         | Get team details |
| POST   | `/:team_id/members/` | Add member       |

### Requests (`/api/request`)
| Method | Route | Description           |
| ------ | ----- | --------------------- |
| GET    | `/`   | Get received requests |
| POST   | `/`   | Create request        |

---

## Weighted Interval Scheduling

Events have an integer weight from 1–10. When creating an event, the backend checks for conflicts with existing events in the same time window. If a higher or equal weight event exists in that window, the request returns a `409` with the conflicting events so the frontend can warn the user.

Future occurrences of recurring events can be edited or deleted in bulk via the shared `recurrence_id` field.