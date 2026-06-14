INSERT INTO library.books (id, title, authors, subjects, courses, isbn, publication_year, publisher, description, digital_copy_url, popularity)
VALUES
  ('book-clean-code', 'Clean Code', ARRAY['Robert C. Martin'], ARRAY['software engineering','programming','code quality'], ARRAY['CS301','CS401'], '9780132350884', 2008, 'Prentice Hall', 'Practical guidance for writing readable, maintainable software.', 'https://library.example.edu/ebooks/clean-code', 98),
  ('book-algorithms', 'Introduction to Algorithms', ARRAY['Thomas H. Cormen','Charles E. Leiserson','Ronald L. Rivest','Clifford Stein'], ARRAY['algorithms','data structures','computer science'], ARRAY['CS201','CS302'], '9780262046305', 2022, 'MIT Press', 'Comprehensive textbook on algorithm design and analysis.', NULL, 95),
  ('book-db-systems', 'Database System Concepts', ARRAY['Abraham Silberschatz','Henry F. Korth','S. Sudarshan'], ARRAY['databases','sql','transactions'], ARRAY['CS305','IT303'], '9780078022159', 2019, 'McGraw Hill', 'Foundational concepts for relational databases and transaction systems.', NULL, 89),
  ('book-ai-modern', 'Artificial Intelligence: A Modern Approach', ARRAY['Stuart Russell','Peter Norvig'], ARRAY['artificial intelligence','machine learning','agents'], ARRAY['CS411','AI501'], '9780134610993', 2020, 'Pearson', 'Core AI textbook covering search, reasoning, learning, and agents.', NULL, 97),
  ('book-os', 'Operating System Concepts', ARRAY['Abraham Silberschatz','Peter B. Galvin','Greg Gagne'], ARRAY['operating systems','processes','memory'], ARRAY['CS304'], '9781119800361', 2021, 'Wiley', 'Operating systems textbook covering process management, storage, and security.', NULL, 85),
  ('book-atomic-habits', 'Atomic Habits', ARRAY['James Clear'], ARRAY['productivity','habits','self improvement'], ARRAY['GEN101'], '9780735211292', 2018, 'Avery', 'A practical guide to building better habits and systems.', 'https://library.example.edu/ebooks/atomic-habits', 92)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.book_copies (id, book_id, barcode, status, floor, shelf)
VALUES
  ('copy-clean-1', 'book-clean-code', 'LIB-CC-001', 'available', '2', 'CS-SE-14'),
  ('copy-clean-2', 'book-clean-code', 'LIB-CC-002', 'borrowed', '2', 'CS-SE-14'),
  ('copy-algo-1', 'book-algorithms', 'LIB-AL-001', 'reserved', '2', 'CS-AL-02'),
  ('copy-algo-2', 'book-algorithms', 'LIB-AL-002', 'available', '2', 'CS-AL-02'),
  ('copy-db-1', 'book-db-systems', 'LIB-DB-001', 'available', '3', 'CS-DB-07'),
  ('copy-ai-1', 'book-ai-modern', 'LIB-AI-001', 'borrowed', '3', 'CS-AI-01'),
  ('copy-ai-2', 'book-ai-modern', 'LIB-AI-002', 'available', '3', 'CS-AI-01'),
  ('copy-os-1', 'book-os', 'LIB-OS-001', 'available', '2', 'CS-OS-10'),
  ('copy-habits-1', 'book-atomic-habits', 'LIB-GEN-101', 'available', '1', 'GEN-PROD-04')
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.loans (id, student_id, copy_id, due_date, fine_amount)
VALUES
  ('loan-demo-1', 'stu-1001', 'copy-clean-2', now() + interval '3 days', 0),
  ('loan-demo-2', 'stu-1001', 'copy-ai-1', now() - interval '2 days', 25)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.reservations (id, student_id, book_id, status)
VALUES
  ('reservation-demo-1', 'stu-1002', 'book-algorithms', 'active'),
  ('reservation-demo-2', 'stu-1003', 'book-ai-modern', 'fulfilled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.counters (id, name, opens_at, closes_at, location)
VALUES
  ('counter-main', 'Main Meals', '07:30', '21:30', 'Student Center Ground Floor'),
  ('counter-south', 'South Indian', '07:00', '14:00', 'Student Center East Wing'),
  ('counter-cafe', 'Cafe Lab', '08:00', '23:00', 'Innovation Block'),
  ('counter-healthy', 'Healthy Bowl Bar', '11:00', '20:00', 'Sports Complex')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.menu_items (id, name, category, diet, allergens, calories, protein_grams, price, counter_id, is_available, tags)
VALUES
  ('food-idli', 'Idli Sambar', 'breakfast', 'veg', ARRAY[]::TEXT[], 310, 11, 40, 'counter-south', true, ARRAY['light','south indian']),
  ('food-poha', 'Vegetable Poha', 'breakfast', 'vegan', ARRAY['peanuts'], 260, 8, 35, 'counter-main', true, ARRAY['low cost']),
  ('food-paneer-wrap', 'Paneer Tikka Wrap', 'lunch', 'veg', ARRAY['dairy','gluten'], 520, 24, 95, 'counter-cafe', true, ARRAY['popular','protein']),
  ('food-chicken-rice', 'Chicken Rice Bowl', 'lunch', 'non-veg', ARRAY[]::TEXT[], 640, 38, 120, 'counter-main', true, ARRAY['protein']),
  ('food-jain-thali', 'Jain Thali', 'lunch', 'jain', ARRAY['dairy'], 590, 21, 85, 'counter-main', true, ARRAY['jain']),
  ('food-salad-bowl', 'Chickpea Salad Bowl', 'lunch', 'vegan', ARRAY[]::TEXT[], 430, 19, 90, 'counter-healthy', true, ARRAY['healthy','vegan']),
  ('food-masala-dosa', 'Masala Dosa', 'dinner', 'veg', ARRAY[]::TEXT[], 480, 12, 65, 'counter-south', true, ARRAY['south indian']),
  ('food-rajma-rice', 'Rajma Rice', 'dinner', 'veg', ARRAY[]::TEXT[], 560, 22, 70, 'counter-main', true, ARRAY['low cost']),
  ('food-tea', 'Masala Tea', 'beverage', 'veg', ARRAY['dairy'], 90, 3, 15, 'counter-cafe', true, ARRAY['beverage']),
  ('food-samosa', 'Samosa', 'snack', 'vegan', ARRAY['gluten'], 240, 5, 20, 'counter-main', true, ARRAY['low cost','snack'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.daily_menus (id, menu_date, day_of_week, breakfast, lunch, dinner, specials)
VALUES
  ('menu-monday', current_date, 'monday', ARRAY['food-idli','food-tea'], ARRAY['food-paneer-wrap','food-jain-thali'], ARRAY['food-rajma-rice'], ARRAY['food-samosa']),
  ('menu-tuesday', current_date + 1, 'tuesday', ARRAY['food-poha','food-tea'], ARRAY['food-chicken-rice','food-salad-bowl'], ARRAY['food-masala-dosa'], ARRAY['food-paneer-wrap']),
  ('menu-wednesday', current_date + 2, 'wednesday', ARRAY['food-idli','food-poha'], ARRAY['food-paneer-wrap','food-salad-bowl'], ARRAY['food-rajma-rice'], ARRAY['food-tea']),
  ('menu-thursday', current_date + 3, 'thursday', ARRAY['food-poha','food-tea'], ARRAY['food-jain-thali','food-chicken-rice'], ARRAY['food-masala-dosa'], ARRAY['food-samosa']),
  ('menu-friday', current_date + 4, 'friday', ARRAY['food-idli','food-tea'], ARRAY['food-paneer-wrap','food-chicken-rice'], ARRAY['food-rajma-rice'], ARRAY['food-salad-bowl'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.feedback (id, student_id, item_id, rating, message)
VALUES
  ('feedback-demo-1', 'stu-1001', 'food-paneer-wrap', 5, 'Good protein option.'),
  ('feedback-demo-2', 'stu-1002', 'food-jain-thali', 4, 'Useful Jain lunch option.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.clubs (id, name, category, description, contact_email)
VALUES
  ('club-tech', 'TechNova Club', 'technical', 'Workshops, hackathons, and builder sessions.', 'technova@example.edu'),
  ('club-culture', 'Rangmanch Cultural Society', 'cultural', 'Music, theatre, dance, and campus festivals.', 'rangmanch@example.edu'),
  ('club-sports', 'Arena Sports Council', 'sports', 'Inter-department tournaments and sports meets.', 'arena@example.edu'),
  ('club-ai', 'AI Research Circle', 'technical', 'Reading groups and applied AI demos.', 'ai-circle@example.edu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.events (id, title, club_id, category, starts_at, ends_at, venue, description, is_free, requires_registration, capacity, tags, status)
VALUES
  ('event-mcp-workshop', 'MCP Tool Calling Workshop', 'club-ai', 'workshop', current_date + time '15:00', current_date + time '17:00', 'Innovation Lab 2', 'Hands-on session on connecting campus systems through MCP servers.', true, true, 60, ARRAY['ai','mcp','backend'], 'scheduled'),
  ('event-techfest', 'Tech Fest Prototype Sprint', 'club-tech', 'hackathon', (current_date + 1) + time '10:00', (current_date + 1) + time '18:00', 'Auditorium Block', 'One-day sprint for student teams building campus technology prototypes.', true, true, 120, ARRAY['hackathon','prototype'], 'scheduled'),
  ('event-music-night', 'Acoustic Music Night', 'club-culture', 'cultural', (current_date + 2) + time '19:00', (current_date + 2) + time '21:00', 'Open Air Theatre', 'Student performances and open mic sets.', true, false, 300, ARRAY['music','open mic'], 'scheduled'),
  ('event-basketball', 'Interdepartment Basketball Finals', 'club-sports', 'sports', current_date + time '18:30', current_date + time '20:30', 'Main Court', 'Final match between CSE and ECE departments.', true, false, 500, ARRAY['basketball','finals'], 'scheduled'),
  ('event-cloud-seminar', 'Cloud Native Systems Seminar', 'club-tech', 'seminar', (current_date + 4) + time '11:00', (current_date + 4) + time '12:30', 'Seminar Hall A', 'Guest talk on containers, observability, and resilient services.', true, true, 90, ARRAY['cloud','devops'], 'scheduled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.sessions (id, event_id, title, starts_at, ends_at, speaker, room)
VALUES
  ('session-mcp-1', 'event-mcp-workshop', 'MCP Architecture Basics', current_date + time '15:00', current_date + time '15:45', 'Prof. Meera Shah', 'Innovation Lab 2'),
  ('session-mcp-2', 'event-mcp-workshop', 'Build a Campus Tool Server', current_date + time '16:00', current_date + time '17:00', 'AI Research Circle', 'Innovation Lab 2'),
  ('session-tech-1', 'event-techfest', 'Problem Statement Briefing', (current_date + 1) + time '10:00', (current_date + 1) + time '10:30', 'TechNova Club', 'Auditorium')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.registrations (id, event_id, student_id, status)
VALUES
  ('registration-demo-1', 'event-mcp-workshop', 'stu-1001', 'registered'),
  ('registration-demo-2', 'event-techfest', 'stu-1002', 'registered')
ON CONFLICT (event_id, student_id) DO NOTHING;

INSERT INTO academics.faculty (id, name, department, email, office)
VALUES
  ('fac-ai', 'Dr. Meera Shah', 'Computer Science', 'meera.shah@example.edu', 'CSE-304'),
  ('fac-db', 'Prof. Arjun Nair', 'Information Technology', 'arjun.nair@example.edu', 'IT-212'),
  ('fac-math', 'Dr. Kavya Rao', 'Mathematics', 'kavya.rao@example.edu', 'SCI-118')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.courses (id, code, title, department, semester, credits, prerequisites, faculty_id, description)
VALUES
  ('course-cs201', 'CS201', 'Data Structures', 'Computer Science', 3, 4, ARRAY['CS101'], 'fac-math', 'Linear and non-linear data structures with algorithmic analysis.'),
  ('course-cs305', 'CS305', 'Database Management Systems', 'Computer Science', 5, 4, ARRAY['CS201'], 'fac-db', 'Relational modeling, SQL, transactions, indexes, and normalization.'),
  ('course-cs411', 'CS411', 'Artificial Intelligence', 'Computer Science', 7, 3, ARRAY['CS201','MA201'], 'fac-ai', 'Search, knowledge representation, planning, machine learning basics, and intelligent agents.'),
  ('course-it303', 'IT303', 'Web Engineering', 'Information Technology', 5, 3, ARRAY['CS201'], 'fac-db', 'Modern web application architecture, APIs, security, and deployment.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.syllabi (id, course_code, units, textbooks)
VALUES
  ('syllabus-cs305', 'CS305', '[{"title":"Relational Model and SQL","topics":["relational algebra","normalization","joins","aggregations"],"outcomes":["Design normalized schemas","Write analytical SQL queries"]},{"title":"Transactions and Indexes","topics":["ACID","locking","B+ trees","query plans"],"outcomes":["Explain transaction isolation","Choose indexes for workloads"]}]'::jsonb, ARRAY['Database System Concepts']),
  ('syllabus-cs411', 'CS411', '[{"title":"Intelligent Agents and Search","topics":["agents","uninformed search","heuristic search","A*"],"outcomes":["Model problems as search spaces","Compare search strategies"]},{"title":"Knowledge and Learning","topics":["logic","probabilistic reasoning","machine learning basics","tool calling"],"outcomes":["Represent knowledge","Explain AI-assisted systems"]}]'::jsonb, ARRAY['Artificial Intelligence: A Modern Approach'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.policies (id, title, category, body)
VALUES
  ('policy-attendance', 'Attendance Policy', 'attendance', 'Students must maintain at least 75% attendance in each course. Medical condonation can be requested through the department office within seven working days.'),
  ('policy-exam', 'Examination Policy', 'exam', 'Mid-semester and end-semester exams are mandatory. Students must carry college ID cards and report 20 minutes before the scheduled start time.'),
  ('policy-grading', 'Grading Policy', 'grading', 'Final grades use continuous assessment, lab work, mid-semester exams, and end-semester exams.'),
  ('policy-lab', 'Computer Lab Rules', 'lab', 'Food and drinks are not allowed in labs. Students must use assigned systems and report hardware issues to the lab assistant.'),
  ('policy-library', 'Library Rules', 'library', 'Books are issued for 14 days. Renewals are allowed when there is no active reservation. Late returns attract a daily fine.'),
  ('policy-hostel', 'Hostel Rules', 'hostel', 'Hostel entry closes at 10:30 PM on weekdays. Late entry requires prior warden approval.'),
  ('policy-scholarship', 'Scholarship Information', 'scholarship', 'Merit and need-based scholarship applications open every semester.'),
  ('policy-fees', 'Fee Deadlines', 'fees', 'Semester fee payment closes two weeks after registration. Late payment may include a penalty.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.calendar_items (id, title, item_type, item_date, department, course_code)
VALUES
  ('cal-registration', 'Semester Registration', 'registration', (current_date + 5) + time '09:00', 'all', NULL),
  ('cal-midsem', 'Mid-Semester Exams Begin', 'exam', (current_date + 35) + time '09:00', 'all', NULL),
  ('cal-tech-holiday', 'Founders Day Holiday', 'holiday', current_date + 12, 'all', NULL),
  ('cal-ai-assignment', 'AI Assignment 1 Deadline', 'assignment', (current_date + 10) + time '23:59', 'Computer Science', 'CS411')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.notices (id, title, body, department)
VALUES
  ('notice-cse-lab', 'CSE lab slot change', 'CS305 database lab for Batch B moves to Friday 2 PM this week.', 'Computer Science'),
  ('notice-ai-reading', 'AI reading group', 'CS411 students should read the agents chapter before Monday.', 'Computer Science'),
  ('notice-fees', 'Fee payment window', 'Semester fee payment window closes next Friday.', 'all')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.exam_schedules (id, course_code, exam_type, starts_at, ends_at, venue)
VALUES
  ('exam-cs305-mid', 'CS305', 'mid-semester', (current_date + 35) + time '09:00', (current_date + 35) + time '11:00', 'Exam Hall 2'),
  ('exam-cs411-quiz', 'CS411', 'quiz', (current_date + 14) + time '10:00', (current_date + 14) + time '10:45', 'CSE-201')
ON CONFLICT (id) DO NOTHING;

-- Extra mock data for richer local demos.
-- public.users intentionally remains empty; it is filled only through registration.

INSERT INTO library.books (id, title, authors, subjects, courses, isbn, publication_year, publisher, description, digital_copy_url, popularity)
VALUES
  ('book-design-patterns', 'Design Patterns', ARRAY['Erich Gamma','Richard Helm','Ralph Johnson','John Vlissides'], ARRAY['software engineering','object oriented design','architecture'], ARRAY['CS301','CS401'], '9780201633610', 1994, 'Addison-Wesley', 'Classic catalog of reusable object-oriented design patterns.', NULL, 91),
  ('book-computer-networks', 'Computer Networks', ARRAY['Andrew S. Tanenbaum','David J. Wetherall'], ARRAY['networks','protocols','internet'], ARRAY['CS306','IT304'], '9780132126953', 2011, 'Pearson', 'Networking fundamentals from physical layer to applications.', NULL, 84),
  ('book-discrete-math', 'Discrete Mathematics and Its Applications', ARRAY['Kenneth H. Rosen'], ARRAY['mathematics','discrete structures','logic'], ARRAY['MA201','CS201'], '9781259676512', 2018, 'McGraw Hill', 'Discrete mathematics textbook for computer science foundations.', NULL, 82),
  ('book-deep-learning', 'Deep Learning', ARRAY['Ian Goodfellow','Yoshua Bengio','Aaron Courville'], ARRAY['machine learning','deep learning','ai'], ARRAY['AI501','CS411'], '9780262035613', 2016, 'MIT Press', 'Foundational deep learning concepts and architectures.', 'https://library.example.edu/ebooks/deep-learning', 94),
  ('book-refactoring', 'Refactoring', ARRAY['Martin Fowler'], ARRAY['software engineering','code quality','refactoring'], ARRAY['CS301','CS401'], '9780134757599', 2018, 'Addison-Wesley', 'Improving the design of existing code through disciplined refactoring.', NULL, 88)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.book_copies (id, book_id, barcode, status, floor, shelf)
VALUES
  ('copy-patterns-1', 'book-design-patterns', 'LIB-DP-001', 'available', '2', 'CS-SE-18'),
  ('copy-networks-1', 'book-computer-networks', 'LIB-CN-001', 'available', '3', 'CS-NET-04'),
  ('copy-discrete-1', 'book-discrete-math', 'LIB-DM-001', 'borrowed', '1', 'MATH-DS-09'),
  ('copy-deep-1', 'book-deep-learning', 'LIB-DL-001', 'available', '3', 'CS-AI-06'),
  ('copy-refactor-1', 'book-refactoring', 'LIB-RF-001', 'maintenance', '2', 'CS-SE-19')
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.loans (id, student_id, copy_id, due_date, fine_amount)
VALUES
  ('loan-demo-3', 'stu-1004', 'copy-discrete-1', now() + interval '6 days', 0),
  ('loan-demo-4', 'stu-1005', 'copy-clean-2', now() + interval '1 day', 0),
  ('loan-demo-5', 'stu-1006', 'copy-ai-1', now() - interval '4 days', 50),
  ('loan-demo-6', 'stu-1007', 'copy-algo-1', now() + interval '9 days', 0),
  ('loan-demo-7', 'stu-1008', 'copy-refactor-1', now() - interval '1 day', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO library.reservations (id, student_id, book_id, status)
VALUES
  ('reservation-demo-3', 'stu-1004', 'book-deep-learning', 'active'),
  ('reservation-demo-4', 'stu-1005', 'book-design-patterns', 'active'),
  ('reservation-demo-5', 'stu-1006', 'book-computer-networks', 'cancelled'),
  ('reservation-demo-6', 'stu-1007', 'book-refactoring', 'active'),
  ('reservation-demo-7', 'stu-1008', 'book-atomic-habits', 'fulfilled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.counters (id, name, opens_at, closes_at, location)
VALUES
  ('counter-dessert', 'Dessert Studio', '12:00', '22:00', 'Student Center Atrium'),
  ('counter-juice', 'Fresh Juice Bar', '08:00', '20:00', 'Sports Complex Lobby'),
  ('counter-night', 'Night Canteen', '20:00', '02:00', 'Hostel Block C'),
  ('counter-grill', 'Campus Grill', '11:30', '21:00', 'Food Court North'),
  ('counter-bakery', 'Bakery Corner', '07:30', '19:00', 'Library Plaza')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.menu_items (id, name, category, diet, allergens, calories, protein_grams, price, counter_id, is_available, tags)
VALUES
  ('food-fruit-bowl', 'Seasonal Fruit Bowl', 'snack', 'vegan', ARRAY[]::TEXT[], 180, 4, 55, 'counter-juice', true, ARRAY['healthy','fresh']),
  ('food-veg-biryani', 'Vegetable Biryani', 'lunch', 'veg', ARRAY['dairy'], 610, 16, 90, 'counter-main', true, ARRAY['popular','rice']),
  ('food-egg-roll', 'Egg Roll', 'snack', 'non-veg', ARRAY['egg','gluten'], 430, 18, 75, 'counter-grill', true, ARRAY['quick bite']),
  ('food-brownie', 'Chocolate Brownie', 'snack', 'veg', ARRAY['dairy','gluten'], 360, 6, 60, 'counter-dessert', true, ARRAY['dessert']),
  ('food-lemonade', 'Mint Lemonade', 'beverage', 'vegan', ARRAY[]::TEXT[], 110, 1, 35, 'counter-juice', true, ARRAY['beverage','summer'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.daily_menus (id, menu_date, day_of_week, breakfast, lunch, dinner, specials)
VALUES
  ('menu-saturday', current_date + 5, 'saturday', ARRAY['food-poha','food-tea'], ARRAY['food-veg-biryani','food-salad-bowl'], ARRAY['food-masala-dosa'], ARRAY['food-brownie']),
  ('menu-sunday', current_date + 6, 'sunday', ARRAY['food-idli','food-lemonade'], ARRAY['food-paneer-wrap','food-fruit-bowl'], ARRAY['food-rajma-rice'], ARRAY['food-samosa']),
  ('menu-next-monday', current_date + 7, 'monday', ARRAY['food-poha','food-tea'], ARRAY['food-chicken-rice','food-jain-thali'], ARRAY['food-masala-dosa'], ARRAY['food-egg-roll']),
  ('menu-next-tuesday', current_date + 8, 'tuesday', ARRAY['food-idli','food-fruit-bowl'], ARRAY['food-paneer-wrap','food-veg-biryani'], ARRAY['food-rajma-rice'], ARRAY['food-lemonade']),
  ('menu-next-wednesday', current_date + 9, 'wednesday', ARRAY['food-poha','food-tea'], ARRAY['food-salad-bowl','food-jain-thali'], ARRAY['food-masala-dosa'], ARRAY['food-brownie'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO cafeteria.feedback (id, student_id, item_id, rating, message)
VALUES
  ('feedback-demo-3', 'stu-1003', 'food-fruit-bowl', 5, 'Fresh and good before practice.'),
  ('feedback-demo-4', 'stu-1004', 'food-veg-biryani', 4, 'Good portion size.'),
  ('feedback-demo-5', 'stu-1005', 'food-egg-roll', 3, 'Tasty but a bit oily.'),
  ('feedback-demo-6', 'stu-1006', 'food-brownie', 5, 'Best dessert on campus.'),
  ('feedback-demo-7', 'stu-1007', 'food-lemonade', 4, 'Refreshing during afternoon classes.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.clubs (id, name, category, description, contact_email)
VALUES
  ('club-robotics', 'Robotics Society', 'technical', 'Autonomous bots, embedded systems, and competitions.', 'robotics@example.edu'),
  ('club-literary', 'Literary Circle', 'cultural', 'Debates, writing workshops, and poetry meets.', 'literary@example.edu'),
  ('club-eco', 'Eco Campus Collective', 'social', 'Sustainability drives and climate awareness.', 'eco@example.edu'),
  ('club-photo', 'ShutterUp Photography Club', 'creative', 'Photo walks, editing sessions, and exhibitions.', 'photo@example.edu'),
  ('club-entrepreneur', 'Startup Cell', 'entrepreneurship', 'Founder talks, pitch practice, and startup mentoring.', 'startup@example.edu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.events (id, title, club_id, category, starts_at, ends_at, venue, description, is_free, requires_registration, capacity, tags, status)
VALUES
  ('event-robotics-demo', 'Line Follower Bot Demo', 'club-robotics', 'technical', (current_date + 3) + time '14:00', (current_date + 3) + time '16:00', 'Robotics Lab', 'Student teams demonstrate line follower bots and sensor tuning.', true, true, 40, ARRAY['robotics','embedded'], 'scheduled'),
  ('event-poetry-slam', 'Open Poetry Slam', 'club-literary', 'cultural', (current_date + 5) + time '18:00', (current_date + 5) + time '20:00', 'Mini Auditorium', 'Open mic poetry evening for students.', true, false, 120, ARRAY['poetry','open mic'], 'scheduled'),
  ('event-clean-drive', 'Campus Clean Drive', 'club-eco', 'workshop', (current_date + 6) + time '07:30', (current_date + 6) + time '09:30', 'Main Gate', 'Morning cleanliness and recycling awareness drive.', true, true, 80, ARRAY['sustainability','volunteer'], 'scheduled'),
  ('event-photo-walk', 'Golden Hour Photo Walk', 'club-photo', 'workshop', (current_date + 7) + time '17:00', (current_date + 7) + time '18:30', 'Old Campus Garden', 'Guided campus photography walk.', true, true, 35, ARRAY['photography','creative'], 'scheduled'),
  ('event-pitch-night', 'Student Startup Pitch Night', 'club-entrepreneur', 'seminar', (current_date + 8) + time '16:00', (current_date + 8) + time '19:00', 'Incubation Center', 'Pitch practice with faculty and alumni feedback.', true, true, 70, ARRAY['startup','pitch'], 'scheduled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.sessions (id, event_id, title, starts_at, ends_at, speaker, room)
VALUES
  ('session-robotics-1', 'event-robotics-demo', 'Sensor Calibration Basics', (current_date + 3) + time '14:00', (current_date + 3) + time '14:45', 'Robotics Society', 'Robotics Lab'),
  ('session-poetry-1', 'event-poetry-slam', 'Featured Student Performances', (current_date + 5) + time '18:15', (current_date + 5) + time '19:30', 'Literary Circle', 'Mini Auditorium'),
  ('session-clean-1', 'event-clean-drive', 'Waste Segregation Briefing', (current_date + 6) + time '07:30', (current_date + 6) + time '08:00', 'Eco Campus Collective', 'Main Gate'),
  ('session-photo-1', 'event-photo-walk', 'Composition Walkthrough', (current_date + 7) + time '17:00', (current_date + 7) + time '17:30', 'ShutterUp Team', 'Old Campus Garden'),
  ('session-pitch-1', 'event-pitch-night', 'Pitch Feedback Round', (current_date + 8) + time '17:00', (current_date + 8) + time '18:30', 'Startup Cell Mentors', 'Incubation Center')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events.registrations (id, event_id, student_id, status)
VALUES
  ('registration-demo-3', 'event-robotics-demo', 'stu-1003', 'registered'),
  ('registration-demo-4', 'event-clean-drive', 'stu-1004', 'registered'),
  ('registration-demo-5', 'event-photo-walk', 'stu-1005', 'waitlisted'),
  ('registration-demo-6', 'event-pitch-night', 'stu-1006', 'registered'),
  ('registration-demo-7', 'event-mcp-workshop', 'stu-1007', 'cancelled')
ON CONFLICT (event_id, student_id) DO NOTHING;

INSERT INTO academics.faculty (id, name, department, email, office)
VALUES
  ('fac-networks', 'Prof. Rhea Menon', 'Computer Science', 'rhea.menon@example.edu', 'CSE-210'),
  ('fac-os', 'Dr. Vikram Sethi', 'Computer Science', 'vikram.sethi@example.edu', 'CSE-218'),
  ('fac-ece', 'Prof. Nandini Iyer', 'Electronics', 'nandini.iyer@example.edu', 'ECE-105'),
  ('fac-mgmt', 'Dr. Farhan Qureshi', 'Management Studies', 'farhan.qureshi@example.edu', 'MGMT-011'),
  ('fac-english', 'Prof. Ananya Sen', 'Humanities', 'ananya.sen@example.edu', 'HUM-204')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.courses (id, code, title, department, semester, credits, prerequisites, faculty_id, description)
VALUES
  ('course-cs306', 'CS306', 'Computer Networks', 'Computer Science', 5, 4, ARRAY['CS201'], 'fac-networks', 'Layered network architecture, routing, transport protocols, and applications.'),
  ('course-cs304', 'CS304', 'Operating Systems', 'Computer Science', 5, 4, ARRAY['CS201'], 'fac-os', 'Processes, scheduling, memory management, file systems, and concurrency.'),
  ('course-ec201', 'EC201', 'Digital Electronics', 'Electronics', 3, 3, ARRAY['PH101'], 'fac-ece', 'Logic gates, combinational circuits, sequential circuits, and digital design.'),
  ('course-mg201', 'MG201', 'Innovation Management', 'Management Studies', 3, 2, ARRAY[]::TEXT[], 'fac-mgmt', 'Innovation frameworks, product thinking, and market validation.'),
  ('course-hu101', 'HU101', 'Communication Skills', 'Humanities', 1, 2, ARRAY[]::TEXT[], 'fac-english', 'Academic writing, presentations, interviews, and collaborative communication.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.syllabi (id, course_code, units, textbooks)
VALUES
  ('syllabus-cs306', 'CS306', '[{"title":"Network Layers","topics":["OSI model","TCP/IP","switching"],"outcomes":["Explain layered architecture","Compare switching techniques"]},{"title":"Routing and Transport","topics":["routing algorithms","TCP","UDP"],"outcomes":["Trace packet flow","Analyze reliable transport"]}]'::jsonb, ARRAY['Computer Networks']),
  ('syllabus-cs304', 'CS304', '[{"title":"Processes and Scheduling","topics":["process states","threads","CPU scheduling"],"outcomes":["Compare schedulers","Model process lifecycle"]},{"title":"Memory and Files","topics":["paging","segmentation","file systems"],"outcomes":["Explain virtual memory","Describe file allocation"]}]'::jsonb, ARRAY['Operating System Concepts']),
  ('syllabus-ec201', 'EC201', '[{"title":"Logic Design","topics":["boolean algebra","gates","K-map"],"outcomes":["Simplify logic functions","Build combinational circuits"]},{"title":"Sequential Systems","topics":["flip-flops","counters","registers"],"outcomes":["Design basic sequential circuits"]}]'::jsonb, ARRAY['Digital Design']),
  ('syllabus-mg201', 'MG201', '[{"title":"Innovation Basics","topics":["idea validation","customer discovery"],"outcomes":["Frame a problem","Validate assumptions"]},{"title":"Product Strategy","topics":["MVP","market sizing","pitching"],"outcomes":["Prepare a basic product pitch"]}]'::jsonb, ARRAY['Innovation and Entrepreneurship']),
  ('syllabus-hu101', 'HU101', '[{"title":"Academic Communication","topics":["emails","reports","summaries"],"outcomes":["Write clear academic documents"]},{"title":"Presentations","topics":["slides","delivery","Q&A"],"outcomes":["Deliver structured presentations"]}]'::jsonb, ARRAY['Technical Communication'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.policies (id, title, category, body)
VALUES
  ('policy-internship', 'Internship Policy', 'general', 'Students may apply for approved internships after completing department eligibility requirements and faculty mentor approval.'),
  ('policy-project', 'Final Year Project Policy', 'general', 'Final year projects require a registered guide, periodic reviews, and a final demonstration with documentation.'),
  ('policy-revaluation', 'Exam Revaluation Policy', 'exam', 'Students may apply for revaluation within five working days of result publication through the examination cell.'),
  ('policy-lab-attendance', 'Lab Attendance Policy', 'attendance', 'Lab attendance is tracked separately and missed lab sessions must be compensated with faculty approval.'),
  ('policy-anti-ragging', 'Anti-Ragging Policy', 'general', 'The campus has zero tolerance for ragging, harassment, or intimidation. Violations must be reported immediately.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.calendar_items (id, title, item_type, item_date, department, course_code)
VALUES
  ('cal-db-assignment', 'DBMS Normalization Assignment', 'assignment', (current_date + 6) + time '23:59', 'Computer Science', 'CS305'),
  ('cal-networks-lab', 'Networks Lab Practical', 'exam', (current_date + 18) + time '14:00', 'Computer Science', 'CS306'),
  ('cal-cultural-day', 'Cultural Day Holiday', 'holiday', current_date + 20, 'all', NULL),
  ('cal-project-review', 'Mini Project Review 1', 'review', (current_date + 16) + time '10:00', 'Information Technology', 'IT303'),
  ('cal-sports-meet', 'Annual Sports Meet', 'event', (current_date + 25) + time '08:00', 'all', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.notices (id, title, body, department)
VALUES
  ('notice-networks-lab', 'Networks lab kit list', 'CS306 students should bring Ethernet cables for next lab.', 'Computer Science'),
  ('notice-os-tutorial', 'OS tutorial moved', 'CS304 tutorial moves to Room CSE-112 this Thursday.', 'Computer Science'),
  ('notice-ece-workshop', 'Digital electronics workshop', 'EC201 students can attend the breadboard design workshop on Saturday.', 'Electronics'),
  ('notice-communication-viva', 'Communication viva schedule', 'HU101 viva slots will be published by Friday evening.', 'Humanities'),
  ('notice-startup-credits', 'Startup elective briefing', 'MG201 students should attend the startup elective briefing in MGMT-011.', 'Management Studies')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academics.exam_schedules (id, course_code, exam_type, starts_at, ends_at, venue)
VALUES
  ('exam-cs306-mid', 'CS306', 'mid-semester', (current_date + 36) + time '09:00', (current_date + 36) + time '11:00', 'Exam Hall 3'),
  ('exam-cs304-mid', 'CS304', 'mid-semester', (current_date + 37) + time '09:00', (current_date + 37) + time '11:00', 'Exam Hall 2'),
  ('exam-ec201-lab', 'EC201', 'lab', (current_date + 21) + time '13:00', (current_date + 21) + time '15:00', 'ECE Lab 1'),
  ('exam-mg201-quiz', 'MG201', 'quiz', (current_date + 12) + time '10:00', (current_date + 12) + time '10:30', 'MGMT-011'),
  ('exam-hu101-quiz', 'HU101', 'quiz', (current_date + 11) + time '15:00', (current_date + 11) + time '15:30', 'HUM-204')
ON CONFLICT (id) DO NOTHING;
