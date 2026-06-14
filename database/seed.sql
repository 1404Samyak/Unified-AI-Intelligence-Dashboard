INSERT INTO library.books (id, title, authors, subjects, courses, isbn, publication_year, publisher, description, digital_copy_url, popularity)
VALUES
  ('book-clean-code', 'Clean Code', ARRAY['Robert C. Martin'], ARRAY['software engineering','programming','code quality'], ARRAY['CS301','CS401'], '9780132350884', 2008, 'Prentice Hall', 'Practical guidance for writing readable, maintainable software.', 'https://library.example.edu/ebooks/clean-code', 98),
  ('book-algorithms', 'Introduction to Algorithms', ARRAY['Thomas H. Cormen','Charles E. Leiserson','Ronald L. Rivest','Clifford Stein'], ARRAY['algorithms','data structures','computer science'], ARRAY['CS201','CS302'], '9780262046305', 2022, 'MIT Press', 'Comprehensive textbook on algorithm design and analysis.', NULL, 95),
  ('book-db-systems', 'Database System Concepts', ARRAY['Abraham Silberschatz','Henry F. Korth','S. Sudarshan'], ARRAY['databases','sql','transactions'], ARRAY['CS305','IT303'], '9780078022159', 2019, 'McGraw Hill', 'Foundational concepts for relational databases and transaction systems.', NULL, 89)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.book_copies (id, book_id, barcode, status, floor, shelf)
VALUES
  ('copy-clean-1', 'book-clean-code', 'LIB-CC-001', 'available', '2', 'CS-SE-14'),
  ('copy-clean-2', 'book-clean-code', 'LIB-CC-002', 'borrowed', '2', 'CS-SE-14'),
  ('copy-algo-1', 'book-algorithms', 'LIB-AL-001', 'reserved', '2', 'CS-AL-02'),
  ('copy-db-1', 'book-db-systems', 'LIB-DB-001', 'available', '3', 'CS-DB-07')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.counters (id, name, opens_at, closes_at, location)
VALUES
  ('counter-main', 'Main Meals', '07:30', '21:30', 'Student Center Ground Floor'),
  ('counter-south', 'South Indian', '07:00', '14:00', 'Student Center East Wing'),
  ('counter-cafe', 'Cafe Lab', '08:00', '23:00', 'Innovation Block')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.menu_items (id, name, category, diet, allergens, calories, protein_grams, price, counter_id, is_available, tags)
VALUES
  ('food-idli', 'Idli Sambar', 'breakfast', 'veg', ARRAY[]::TEXT[], 310, 11, 40, 'counter-south', true, ARRAY['light','south indian']),
  ('food-paneer-wrap', 'Paneer Tikka Wrap', 'lunch', 'veg', ARRAY['dairy','gluten'], 520, 24, 95, 'counter-cafe', true, ARRAY['popular','protein']),
  ('food-jain-thali', 'Jain Thali', 'lunch', 'jain', ARRAY['dairy'], 590, 21, 85, 'counter-main', true, ARRAY['jain'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.clubs (id, name, category, description, contact_email)
VALUES
  ('club-tech', 'TechNova Club', 'technical', 'Workshops, hackathons, and builder sessions.', 'technova@example.edu'),
  ('club-ai', 'AI Research Circle', 'technical', 'Reading groups and applied AI demos.', 'ai-circle@example.edu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.events (id, title, club_id, category, starts_at, ends_at, venue, description, is_free, requires_registration, capacity, tags, status)
VALUES
  ('event-mcp-workshop', 'MCP Tool Calling Workshop', 'club-ai', 'workshop', now() + interval '3 hours', now() + interval '5 hours', 'Innovation Lab 2', 'Hands-on session on connecting campus systems through MCP servers.', true, true, 60, ARRAY['ai','mcp','backend'], 'scheduled'),
  ('event-techfest', 'Tech Fest Prototype Sprint', 'club-tech', 'hackathon', now() + interval '1 day', now() + interval '1 day 8 hours', 'Auditorium Block', 'One-day sprint for student teams building campus technology prototypes.', true, true, 120, ARRAY['hackathon','prototype'], 'scheduled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.faculty (id, name, department, email, office)
VALUES
  ('fac-ai', 'Dr. Meera Shah', 'Computer Science', 'meera.shah@example.edu', 'CSE-304'),
  ('fac-db', 'Prof. Arjun Nair', 'Information Technology', 'arjun.nair@example.edu', 'IT-212')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.courses (id, code, title, department, semester, credits, prerequisites, faculty_id, description)
VALUES
  ('course-cs305', 'CS305', 'Database Management Systems', 'Computer Science', 5, 4, ARRAY['CS201'], 'fac-db', 'Relational modeling, SQL, transactions, indexes, and normalization.'),
  ('course-cs411', 'CS411', 'Artificial Intelligence', 'Computer Science', 7, 3, ARRAY['CS201','MA201'], 'fac-ai', 'Search, knowledge representation, planning, machine learning basics, and intelligent agents.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.policies (id, title, category, body)
VALUES
  ('policy-attendance', 'Attendance Policy', 'attendance', 'Students must maintain at least 75% attendance in each course.'),
  ('policy-exam', 'Examination Policy', 'exam', 'Mid-semester and end-semester exams are mandatory.'),
  ('policy-grading', 'Grading Policy', 'grading', 'Final grades use continuous assessment, lab work, mid-semester exams, and end-semester exams.')
ON CONFLICT (id) DO NOTHING;
