CREATE SCHEMA IF NOT EXISTS library;
CREATE SCHEMA IF NOT EXISTS cafeteria;
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS academics;

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  year_of_study INTEGER,
  branch TEXT,
  semester INTEGER CHECK (semester IN (1, 2)),
  enrollment_number TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  subjects TEXT[] NOT NULL DEFAULT '{}',
  courses TEXT[] NOT NULL DEFAULT '{}',
  isbn TEXT NOT NULL DEFAULT '',
  publication_year INTEGER NOT NULL,
  publisher TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  digital_copy_url TEXT,
  popularity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library.book_copies (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES library.books(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
  floor TEXT NOT NULL,
  shelf TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS library.loans (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  copy_id TEXT NOT NULL REFERENCES library.book_copies(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NOT NULL,
  fine_amount NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS library.reservations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  book_id TEXT NOT NULL REFERENCES library.books(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'fulfilled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cafeteria.counters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cafeteria.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'beverage')),
  diet TEXT NOT NULL CHECK (diet IN ('veg', 'non-veg', 'jain', 'vegan')),
  allergens TEXT[] NOT NULL DEFAULT '{}',
  calories INTEGER NOT NULL DEFAULT 0,
  protein_grams NUMERIC(10,2) NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  counter_id TEXT NOT NULL REFERENCES cafeteria.counters(id),
  is_available BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cafeteria.daily_menus (
  id TEXT PRIMARY KEY,
  menu_date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  breakfast TEXT[] NOT NULL DEFAULT '{}',
  lunch TEXT[] NOT NULL DEFAULT '{}',
  dinner TEXT[] NOT NULL DEFAULT '{}',
  specials TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS cafeteria.feedback (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  item_id TEXT REFERENCES cafeteria.menu_items(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events.clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  contact_email TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  club_id TEXT NOT NULL REFERENCES events.clubs(id),
  category TEXT NOT NULL CHECK (category IN ('technical', 'cultural', 'sports', 'workshop', 'seminar', 'hackathon')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  description TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  requires_registration BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER NOT NULL DEFAULT 50,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'cancelled', 'completed'))
);

CREATE TABLE IF NOT EXISTS events.sessions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  speaker TEXT NOT NULL,
  room TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events.registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('registered', 'cancelled', 'waitlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, student_id)
);

CREATE TABLE IF NOT EXISTS academics.faculty (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  office TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academics.courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  credits NUMERIC(10,2) NOT NULL,
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  faculty_id TEXT NOT NULL REFERENCES academics.faculty(id),
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academics.syllabi (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL REFERENCES academics.courses(code) ON DELETE CASCADE,
  units JSONB NOT NULL DEFAULT '[]'::jsonb,
  textbooks TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academics.policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academics.calendar_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_date TIMESTAMPTZ NOT NULL,
  department TEXT NOT NULL DEFAULT 'all',
  course_code TEXT
);

CREATE TABLE IF NOT EXISTS academics.notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academics.exam_schedules (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL REFERENCES academics.courses(code) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('mid-semester', 'end-semester', 'lab', 'quiz')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL
);
