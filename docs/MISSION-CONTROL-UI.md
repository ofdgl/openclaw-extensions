# Mission Control UI

Web-based dashboard for monitoring and controlling the multi-agent system.

---

## Status

**Phase**: Planning  
**Priority**: Phase 2 (post-MVP)  
**Current**: No UI code yet (hook-based CLI only)

---

## Overview

Mission Control UI will be a **real-time web dashboard** separate from OpenClaw's `/_admin` interface, specifically designed for the multi-agent orchestration system.

**URL**: `http://your-vps:3001/mission-control`

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Mission Control UI (React + Vite)     │
│  Port: 3001                             │
└──────────────┬──────────────────────────┘
               │ WebSocket
               ▼
┌─────────────────────────────────────────┐
│  WebSocket Server (Node.js)             │
│  - SQLite DB connection                 │
│  - Real-time event push                 │
└──────────────┬──────────────────────────┘
               │ Read/Write
               ▼
┌─────────────────────────────────────────┐
│  SQLite Database                        │
│  - tasks, messages, activities          │
│  - agents, documents, notifications     │
└─────────────────────────────────────────┘
               ▲
               │ Write events
┌──────────────┴──────────────────────────┐
│  OpenClaw Gateway + Hooks               │
│  - Agents write to DB via hooks         │
└─────────────────────────────────────────┘
```

---

## Features

### 1. Activity Feed (Real-Time)

Live stream of all agent actions:

```
🔵 14:23  Admin posted comment on "Deploy VPS"
🟢 14:21  Security completed code review
🟡 14:18  Demo agent started task "Test sandbox"
🔴 14:15  Intern agent blocked (waiting for approval)
```

**Data Source**: `activities` table (SQLite)

---

### 2. Task Board (Kanban)

Drag-and-drop task management:

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Inbox     │  Assigned   │ In Progress │   Review    │    Done     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Task 1      │ Task 3      │ Task 5      │ Task 7      │ Task 9      │
│ Task 2      │ Task 4      │ Task 6      │ Task 8      │ Task 10     │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**Features**:
- Drag to change status
- Click to view task details
- Filter by agent
- Search by keyword

**Data Source**: `tasks` table (SQLite)

---

### 3. Agent Cards

Real-time agent status:

```
┌────────────────────────────────────────┐
│ 🤖 Admin Agent                         │
│ Status: ● Active                       │
│ Current: Reviewing deploy plan         │
│ Last seen: 2 minutes ago               │
│ Token usage: 12,405 today              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🔒 Security Agent                      │
│ Status: ⚪ Idle                        │
│ Current: None                          │
│ Last seen: 15 minutes ago              │
│ Token usage: 8,192 today               │
└────────────────────────────────────────┘
```

**Data Source**: `agents` table + heartbeat logs

---

### 4. Task Detail View

Full task context with comment thread:

```
┌─────────────────────────────────────────────────────────────┐
│ Task: Deploy VPS with Kamino Mode                           │
│ Status: In Progress          Assigned: Admin, Security      │
├─────────────────────────────────────────────────────────────┤
│ Description:                                                │
│ Set up VPS with original/kamino mode switching              │
│                                                              │
│ Created by: Admin on Feb 5, 2026 at 14:00                  │
├─────────────────────────────────────────────────────────────┤
│ 💬 Comments (3)                                             │
│                                                              │
│ Admin • 14:15                                               │
│ Starting deployment. @security please review firewall rules │
│                                                              │
│ Security • 14:20                                            │
│ UFW configured. SSH on port 2222, Gateway on 18789. ✅      │
│                                                              │
│ Admin • 14:23                                               │
│ Perfect. Moving to test phase.                              │
│                                                              │
│ [Type a comment...]                         [@mention ▼]   │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Threaded comments
- @mention autocomplete
- Markdown support
- Attach documents

---

### 5. Document Panel

Searchable document library:

```
┌─────────────────────────────────────────┐
│ 📄 Documents                            │
├─────────────────────────────────────────┤
│ 🔍 Search...                            │
├─────────────────────────────────────────┤
│ 📊 Security Audit Report (Security)     │
│ 📝 VPS Setup Notes (Admin)              │
│ 🎨 UI Mockup (Design, future)           │
│ 📋 Daily Standup - Feb 5 (Auto)         │
└─────────────────────────────────────────┘
```

**Data Source**: `documents` table

---

## Data Model (SQLite Schema)

```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,              -- "admin", "security", etc.
  display_name TEXT,                -- "Admin Agent"
  role TEXT,                        -- "Squad Lead"
  status TEXT DEFAULT 'idle',       -- idle | active | blocked
  current_task_id INTEGER,          -- FK to tasks
  session_key TEXT,                 -- "agent:admin:main"
  last_seen DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inbox',      -- inbox | assigned | in_progress | review | done | blocked
  priority INTEGER DEFAULT 0,
  created_by INTEGER,                -- FK to agents
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

CREATE TABLE task_assignments (
  task_id INTEGER,                   -- FK to tasks
  agent_id INTEGER,                  -- FK to agents
  PRIMARY KEY (task_id, agent_id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  task_id INTEGER,                   -- FK to tasks
  from_agent_id INTEGER,             -- FK to agents
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,                      -- Markdown
  type TEXT,                         -- deliverable | research | protocol
  task_id INTEGER,                    -- Optional FK to tasks
  created_by INTEGER,                 -- FK to agents
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,                -- task_created | message_sent | status_changed
  agent_id INTEGER,                  -- FK to agents
  task_id INTEGER,                    -- Optional FK to tasks
  message TEXT,                      -- Human-readable description
  metadata TEXT,                     -- JSON for extra data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  mentioned_agent_id INTEGER,        -- FK to agents
  from_agent_id INTEGER,             -- FK to agents
  task_id INTEGER,                    -- FK to tasks
  content TEXT,
  delivered BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for dev server and build
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **Socket.io-client** for WebSocket

### Backend
- **Node.js + Express**
- **Socket.io** for WebSocket server
- **better-sqlite3** for SQLite
- **TypeScript**

### Deployment
- Frontend: Static build served by Nginx
- Backend: PM2 process manager
- Database: SQLite file (`~/.openclaw/mission-control.db`)

---

## Implementation Plan (Phase 2)

### Step 1: Database Setup (2 hours)
- Create SQLite schema
- Write migration script
- Create seed data (4 agents)

### Step 2: Backend API (4 hours)
- Express server with REST endpoints
- WebSocket server for real-time updates
- SQLite query functions

### Step 3: Frontend UI (8 hours)
- Activity feed component
- Task board (Kanban)
- Agent cards
- Task detail view
- Document panel

### Step 4: Integration (3 hours)
- Update hooks to write to SQLite
- WebSocket event broadcasting
- Authentication (admin-only access)

### Step 5: Deployment (2 hours)
- Build frontend
- Configure Nginx
- PM2 setup for backend
- UFW firewall rule for port 3001

**Total**: ~19 hours

---

## Current Workaround (MVP)

While Mission Control UI is in Phase 2, use:

1. **Daily Standup Hook**: Automated summaries via WhatsApp
2. **JSONL Logs**: View with `jq`:
   ```bash
   # Activity feed
   tail -f ~/.openclaw/logs/security.jsonl | jq
   
   # Token usage
   jq -r 'select(.agent=="admin") | "\(.timestamp | split("T")[1][:5]) - \(.input_tokens + .output_tokens) tokens"' \
     ~/.openclaw/logs/billing.jsonl
   ```
3. **WORKING.md Files**: Check agent status:
   ```bash
   cat ~/.openclaw-kamino/workspaces/admin/memory/WORKING.md
   ```

---

## API Endpoints (Future)

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task (status, assign, etc.)
- `DELETE /api/tasks/:id` - Delete task

### Messages
- `GET /api/tasks/:id/messages` - Get comments for task
- `POST /api/tasks/:id/messages` - Post comment

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id` - Update agent status

### Activities
- `GET /api/activities` - Get activity feed (paginated)

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document

### WebSocket Events
- `activity:new` - New activity item
- `task:updated` - Task changed
- `message:new` - New comment
- `agent:status` - Agent status changed

---

## Security

- Admin-only access (check `contacts.yaml`)
- JWT authentication
- HTTPS required (Let's Encrypt)
- CORS restricted to VPS IP
- Rate limiting on API endpoints

---

## Next Steps

1. **Phase 1 (Now)**: Complete hook-based system, JSONL logs
2. **Phase 2 (Future)**: Build Mission Control UI with SQLite + WebSocket
3. **Phase 3 (Later)**: Mobile app, Telegram bot integration

**Question for user**: Should Mission Control UI be prioritized sooner, or stick with JSONL logs for MVP?
