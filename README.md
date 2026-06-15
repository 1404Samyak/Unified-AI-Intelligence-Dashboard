# Unified AI Intelligence Dashboard

A student-facing campus dashboard that connects scattered college systems through independent MCP servers. The AI backend talks to a hosted LLM API, discovers tools from each MCP server, executes the selected tools in real time, and returns one unified answer.

## What This Builds

- React + Vite dashboard with overview cards, assistant chat, tool traces, and tool registry.
- Node.js AI backend that acts as the MCP host/client manager.
- Four independent MCP servers:
  - Library MCP
  - Cafeteria MCP
  - Events MCP
  - Academics MCP
- One Postgres database design with separate schemas for each domain.
- Local mock-data fallback so the demo works even before Postgres data wiring is extended.
- Hosted LLM integration through a Groq/OpenAI-compatible chat completions API.
- Student login/register with signed bearer tokens.

## Architecture

```txt
React + Vite dashboard
  -> Node.js AI backend
      -> Hosted LLM API
      -> MCP client manager
          -> Library MCP server
          -> Cafeteria MCP server
          -> Events MCP server
          -> Academics MCP server
              -> domain repository/service layer
              -> Postgres schema or mock data
```

## Tech Stack

- Frontend: React, Vite, TypeScript, CSS, lucide-react
- Backend: Node.js 22, TypeScript, Express
- MCP: `@modelcontextprotocol/sdk`
- LLM: Groq/OpenAI-compatible hosted API
- Database: PostgreSQL, one database with four schemas
- Auth: signed bearer tokens, `public.users` table

## Project Structure

```txt
apps/
  api/                  # AI backend and MCP client manager
  web/                  # React + Vite dashboard
mcp-servers/
  library/              # Library MCP server
  cafeteria/            # Cafeteria MCP server
  events/               # Events MCP server
  academics/            # Academics MCP server
packages/
  shared/               # Shared types and demo campus data
  mcp-common/           # MCP HTTP server utilities
database/
  schema.sql
  seed.sql
```

## MCP Tool Coverage

Library tools:

```txt
search_books, get_book_details, check_book_availability, get_book_location,
find_books_by_author, find_books_by_subject, find_books_by_course,
get_new_arrivals, get_popular_books, get_related_books, get_library_hours,
get_user_borrowed_books, get_user_due_dates, get_user_fines, renew_book,
reserve_book, cancel_book_reservation, check_digital_copy_available,
search_journals, search_research_papers
```

Cafeteria tools:

```txt
get_today_menu, get_menu_by_date, get_weekly_menu, get_breakfast_menu,
get_lunch_menu, get_dinner_menu, search_food_items, filter_menu_by_diet,
filter_menu_by_allergen, get_food_item_details, get_food_nutrition,
get_food_price, get_available_counters, get_counter_timings,
get_cafeteria_hours, get_today_specials, get_low_cost_meals, get_veg_menu,
get_non_veg_menu, get_jain_menu, get_student_favorite_items,
rate_food_item, submit_menu_feedback
```

Events tools:

```txt
get_today_events, get_upcoming_events, search_events, get_event_details,
get_events_by_date, get_events_by_club, get_events_by_category,
get_technical_events, get_cultural_events, get_sports_events,
get_workshops, get_seminars, get_hackathons, get_event_schedule,
get_event_venue, get_events_near_now, get_free_events,
get_registration_required_events, check_event_registration_status,
register_for_event, cancel_event_registration, get_my_registered_events,
get_club_details, search_clubs
```

Academics tools:

```txt
search_academic_handbook, get_attendance_policy, get_exam_policy,
get_grading_policy, get_course_details, search_courses,
get_courses_by_department, get_courses_by_semester, get_course_prerequisites,
get_course_credits, get_syllabus, search_syllabus_topics,
get_faculty_details, search_faculty, get_academic_calendar,
get_exam_schedule, get_assignment_deadlines, get_holiday_list,
get_lab_rules, get_library_rules, get_hostel_rules, get_scholarship_info,
get_fee_deadlines, get_department_notices
```

## Setup

Use Node 22.

```bash
nvm use 22
npm install
```

Copy the environment template if you want to change ports or model name:

```bash
cp .env.example .env
```

For register/login to work, update `.env` with your local Postgres password. For LLM reasoning, add your hosted API key:

```txt
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/campus_dashboard
AUTH_SECRET=replace-this-with-any-long-random-string
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
```

The backend uses a Groq/OpenAI-compatible `/chat/completions` API for tool planning and answer synthesis. The API key belongs only in backend environment variables, never in the frontend.

For deployment on Render, configure the API backend service with:

```txt
DATABASE_URL=your_neon_database_url
AUTH_SECRET=replace-this-with-any-long-random-string
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
LIBRARY_MCP_URL=https://your-library-mcp.onrender.com/mcp
CAFETERIA_MCP_URL=https://your-cafeteria-mcp.onrender.com/mcp
EVENTS_MCP_URL=https://your-events-mcp.onrender.com/mcp
ACADEMICS_MCP_URL=https://your-academics-mcp.onrender.com/mcp
```

Start the full app:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:4000/api/health
http://localhost:4000/api/tools
http://localhost:4000/api/chat
```

MCP servers:

```txt
Library:    http://localhost:4101/mcp
Cafeteria: http://localhost:4102/mcp
Events:    http://localhost:4103/mcp
Academics: http://localhost:4104/mcp
```

## Postgres

The database design uses one Postgres database, one shared users table, and four campus schemas.

```txt
campus_dashboard
  public.users
  library.*
  cafeteria.*
  events.*
  academics.*
```

`public.users` is intentionally not seeded. It is filled only when students register from the app.

Start Postgres with Docker:

```bash
docker compose up -d postgres
```

Or apply schema manually:

```bash
export DATABASE_URL=postgres://campus:campus@localhost:5432/campus_dashboard
npm run db:schema
npm run db:seed
```

The current MVP repositories use seeded in-memory campus data for reliable demos. The SQL schema is ready for replacing repository methods with Postgres queries.

The MCP servers now try to preload campus data from Postgres when `DATABASE_URL` is configured. If Postgres is not available, they fall back to the built-in demo data. Register/login requires Postgres because user accounts must be stored in `public.users`.

## Student Auth

Student registration asks for:

```txt
name, year, branch, semester, enrollment number, email, password
```

The dashboard is student-facing. Students can search campus information, check availability, view menus, find events, read policies, and use student actions such as book reservations, event registration, and cafeteria feedback. Official campus records are read-only in this demo.

## Sample Queries

```txt
Is Clean Code available and what events are happening today?
What is for lunch today and do we have Jain options?
Show upcoming tech workshops and the AI course syllabus.
What is the attendance policy and my library fines?
Find database books and show DBMS course credits.
```

## Verification

```bash
npm run build
```

Verified locally:

- Full TypeScript/Vite build passes.
- MCP tool discovery works through `/api/tools`.
- Chat query routes to Library and Events MCP tools.
- Browser UI chat returns the expected answer and tool trace.

## Demo Video Flow

1. Show the problem: campus data split across library, cafeteria, events, and academics.
2. Open the dashboard overview and show four live source cards.
3. Open the Tools tab and show separate MCP tool registries.
4. Ask: `Is Clean Code available and what events are happening today?`
5. Show the answer and tool trace:
   - `library__check_book_availability`
   - `events__get_today_events`
6. Ask a cafeteria + academics query.
7. Briefly show the code structure for one MCP server:
   - tool handler
   - service layer
   - repository layer
8. Explain that there is no giant database dump; each domain is queried through its own MCP server.
