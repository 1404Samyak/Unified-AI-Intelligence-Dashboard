import type {
  AcademicPolicy,
  BookCopy,
  CafeteriaCounter,
  CafeteriaMenuItem,
  CampusEvent,
  Course,
  DailyMenu,
  EventClub,
  EventSession,
  Faculty,
  LibraryBook,
  LibraryLoan
} from "./types.js";

const isoDate = (offsetDays: number, hour = 9, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

export const libraryBooks: LibraryBook[] = [
  {
    id: "book-clean-code",
    title: "Clean Code",
    authors: ["Robert C. Martin"],
    subjects: ["software engineering", "programming", "code quality"],
    courses: ["CS301", "CS401"],
    isbn: "9780132350884",
    year: 2008,
    publisher: "Prentice Hall",
    description: "Practical guidance for writing readable, maintainable software.",
    digitalCopyUrl: "https://library.example.edu/ebooks/clean-code",
    popularity: 98,
    createdAt: isoDate(-30)
  },
  {
    id: "book-algorithms",
    title: "Introduction to Algorithms",
    authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"],
    subjects: ["algorithms", "data structures", "computer science"],
    courses: ["CS201", "CS302"],
    isbn: "9780262046305",
    year: 2022,
    publisher: "MIT Press",
    description: "Comprehensive textbook on algorithm design and analysis.",
    popularity: 95,
    createdAt: isoDate(-18)
  },
  {
    id: "book-db-systems",
    title: "Database System Concepts",
    authors: ["Abraham Silberschatz", "Henry F. Korth", "S. Sudarshan"],
    subjects: ["databases", "sql", "transactions"],
    courses: ["CS305", "IT303"],
    isbn: "9780078022159",
    year: 2019,
    publisher: "McGraw Hill",
    description: "Foundational concepts for relational databases and transaction systems.",
    popularity: 89,
    createdAt: isoDate(-10)
  },
  {
    id: "book-ai-modern",
    title: "Artificial Intelligence: A Modern Approach",
    authors: ["Stuart Russell", "Peter Norvig"],
    subjects: ["artificial intelligence", "machine learning", "agents"],
    courses: ["CS411", "AI501"],
    isbn: "9780134610993",
    year: 2020,
    publisher: "Pearson",
    description: "Core AI textbook covering search, reasoning, learning, and agents.",
    popularity: 97,
    createdAt: isoDate(-7)
  },
  {
    id: "book-os",
    title: "Operating System Concepts",
    authors: ["Abraham Silberschatz", "Peter B. Galvin", "Greg Gagne"],
    subjects: ["operating systems", "processes", "memory"],
    courses: ["CS304"],
    isbn: "9781119800361",
    year: 2021,
    publisher: "Wiley",
    description: "Operating systems textbook covering process management, storage, and security.",
    popularity: 85,
    createdAt: isoDate(-12)
  },
  {
    id: "book-atomic-habits",
    title: "Atomic Habits",
    authors: ["James Clear"],
    subjects: ["productivity", "habits", "self improvement"],
    courses: ["GEN101"],
    isbn: "9780735211292",
    year: 2018,
    publisher: "Avery",
    description: "A practical guide to building better habits and systems.",
    popularity: 92,
    createdAt: isoDate(-3)
  }
];

export const bookCopies: BookCopy[] = [
  { id: "copy-clean-1", bookId: "book-clean-code", barcode: "LIB-CC-001", status: "available", floor: "2", shelf: "CS-SE-14" },
  { id: "copy-clean-2", bookId: "book-clean-code", barcode: "LIB-CC-002", status: "borrowed", floor: "2", shelf: "CS-SE-14" },
  { id: "copy-algo-1", bookId: "book-algorithms", barcode: "LIB-AL-001", status: "reserved", floor: "2", shelf: "CS-AL-02" },
  { id: "copy-algo-2", bookId: "book-algorithms", barcode: "LIB-AL-002", status: "available", floor: "2", shelf: "CS-AL-02" },
  { id: "copy-db-1", bookId: "book-db-systems", barcode: "LIB-DB-001", status: "available", floor: "3", shelf: "CS-DB-07" },
  { id: "copy-ai-1", bookId: "book-ai-modern", barcode: "LIB-AI-001", status: "borrowed", floor: "3", shelf: "CS-AI-01" },
  { id: "copy-ai-2", bookId: "book-ai-modern", barcode: "LIB-AI-002", status: "available", floor: "3", shelf: "CS-AI-01" },
  { id: "copy-os-1", bookId: "book-os", barcode: "LIB-OS-001", status: "available", floor: "2", shelf: "CS-OS-10" },
  { id: "copy-habits-1", bookId: "book-atomic-habits", barcode: "LIB-GEN-101", status: "available", floor: "1", shelf: "GEN-PROD-04" }
];

export const libraryLoans: LibraryLoan[] = [
  { id: "loan-1", studentId: "stu-1001", copyId: "copy-clean-2", dueDate: isoDate(3), fineAmount: 0 },
  { id: "loan-2", studentId: "stu-1001", copyId: "copy-ai-1", dueDate: isoDate(-2), fineAmount: 25 }
];

export const cafeteriaCounters: CafeteriaCounter[] = [
  { id: "counter-main", name: "Main Meals", opensAt: "07:30", closesAt: "21:30", location: "Student Center Ground Floor" },
  { id: "counter-south", name: "South Indian", opensAt: "07:00", closesAt: "14:00", location: "Student Center East Wing" },
  { id: "counter-cafe", name: "Cafe Lab", opensAt: "08:00", closesAt: "23:00", location: "Innovation Block" },
  { id: "counter-healthy", name: "Healthy Bowl Bar", opensAt: "11:00", closesAt: "20:00", location: "Sports Complex" }
];

export const cafeteriaItems: CafeteriaMenuItem[] = [
  { id: "food-idli", name: "Idli Sambar", category: "breakfast", diet: "veg", allergens: [], calories: 310, proteinGrams: 11, price: 40, counterId: "counter-south", isAvailable: true, tags: ["light", "south indian"] },
  { id: "food-poha", name: "Vegetable Poha", category: "breakfast", diet: "vegan", allergens: ["peanuts"], calories: 260, proteinGrams: 8, price: 35, counterId: "counter-main", isAvailable: true, tags: ["low cost"] },
  { id: "food-paneer-wrap", name: "Paneer Tikka Wrap", category: "lunch", diet: "veg", allergens: ["dairy", "gluten"], calories: 520, proteinGrams: 24, price: 95, counterId: "counter-cafe", isAvailable: true, tags: ["popular", "protein"] },
  { id: "food-chicken-rice", name: "Chicken Rice Bowl", category: "lunch", diet: "non-veg", allergens: [], calories: 640, proteinGrams: 38, price: 120, counterId: "counter-main", isAvailable: true, tags: ["protein"] },
  { id: "food-jain-thali", name: "Jain Thali", category: "lunch", diet: "jain", allergens: ["dairy"], calories: 590, proteinGrams: 21, price: 85, counterId: "counter-main", isAvailable: true, tags: ["jain"] },
  { id: "food-salad-bowl", name: "Chickpea Salad Bowl", category: "lunch", diet: "vegan", allergens: [], calories: 430, proteinGrams: 19, price: 90, counterId: "counter-healthy", isAvailable: true, tags: ["healthy", "vegan"] },
  { id: "food-masala-dosa", name: "Masala Dosa", category: "dinner", diet: "veg", allergens: [], calories: 480, proteinGrams: 12, price: 65, counterId: "counter-south", isAvailable: true, tags: ["south indian"] },
  { id: "food-rajma-rice", name: "Rajma Rice", category: "dinner", diet: "veg", allergens: [], calories: 560, proteinGrams: 22, price: 70, counterId: "counter-main", isAvailable: true, tags: ["low cost"] },
  { id: "food-tea", name: "Masala Tea", category: "beverage", diet: "veg", allergens: ["dairy"], calories: 90, proteinGrams: 3, price: 15, counterId: "counter-cafe", isAvailable: true, tags: ["beverage"] },
  { id: "food-samosa", name: "Samosa", category: "snack", diet: "vegan", allergens: ["gluten"], calories: 240, proteinGrams: 5, price: 20, counterId: "counter-main", isAvailable: true, tags: ["low cost", "snack"] }
];

export const weeklyMenus: DailyMenu[] = [
  { date: "template-monday", dayOfWeek: "monday", breakfast: ["food-idli", "food-tea"], lunch: ["food-paneer-wrap", "food-jain-thali"], dinner: ["food-rajma-rice"], specials: ["food-samosa"] },
  { date: "template-tuesday", dayOfWeek: "tuesday", breakfast: ["food-poha", "food-tea"], lunch: ["food-chicken-rice", "food-salad-bowl"], dinner: ["food-masala-dosa"], specials: ["food-paneer-wrap"] },
  { date: "template-wednesday", dayOfWeek: "wednesday", breakfast: ["food-idli", "food-poha"], lunch: ["food-paneer-wrap", "food-salad-bowl"], dinner: ["food-rajma-rice"], specials: ["food-tea"] },
  { date: "template-thursday", dayOfWeek: "thursday", breakfast: ["food-poha", "food-tea"], lunch: ["food-jain-thali", "food-chicken-rice"], dinner: ["food-masala-dosa"], specials: ["food-samosa"] },
  { date: "template-friday", dayOfWeek: "friday", breakfast: ["food-idli", "food-tea"], lunch: ["food-paneer-wrap", "food-chicken-rice"], dinner: ["food-rajma-rice"], specials: ["food-salad-bowl"] },
  { date: "template-saturday", dayOfWeek: "saturday", breakfast: ["food-poha", "food-tea"], lunch: ["food-jain-thali", "food-salad-bowl"], dinner: ["food-masala-dosa"], specials: ["food-samosa"] },
  { date: "template-sunday", dayOfWeek: "sunday", breakfast: ["food-idli", "food-tea"], lunch: ["food-chicken-rice", "food-paneer-wrap"], dinner: ["food-rajma-rice"], specials: ["food-samosa"] }
];

export const eventClubs: EventClub[] = [
  { id: "club-tech", name: "TechNova Club", category: "technical", description: "Workshops, hackathons, and builder sessions.", contactEmail: "technova@example.edu" },
  { id: "club-culture", name: "Rangmanch Cultural Society", category: "cultural", description: "Music, theatre, dance, and campus festivals.", contactEmail: "rangmanch@example.edu" },
  { id: "club-sports", name: "Arena Sports Council", category: "sports", description: "Inter-department tournaments and sports meets.", contactEmail: "arena@example.edu" },
  { id: "club-ai", name: "AI Research Circle", category: "technical", description: "Reading groups and applied AI demos.", contactEmail: "ai-circle@example.edu" }
];

export const campusEvents: CampusEvent[] = [
  {
    id: "event-mcp-workshop",
    title: "MCP Tool Calling Workshop",
    clubId: "club-ai",
    category: "workshop",
    startsAt: isoDate(0, 15, 0),
    endsAt: isoDate(0, 17, 0),
    venue: "Innovation Lab 2",
    description: "Hands-on session on connecting campus systems through MCP servers.",
    isFree: true,
    requiresRegistration: true,
    capacity: 60,
    tags: ["ai", "mcp", "backend"],
    status: "scheduled"
  },
  {
    id: "event-techfest",
    title: "Tech Fest Prototype Sprint",
    clubId: "club-tech",
    category: "hackathon",
    startsAt: isoDate(1, 10, 0),
    endsAt: isoDate(1, 18, 0),
    venue: "Auditorium Block",
    description: "One-day sprint for student teams building campus technology prototypes.",
    isFree: true,
    requiresRegistration: true,
    capacity: 120,
    tags: ["hackathon", "prototype", "team"],
    status: "scheduled"
  },
  {
    id: "event-music-night",
    title: "Acoustic Music Night",
    clubId: "club-culture",
    category: "cultural",
    startsAt: isoDate(2, 19, 0),
    endsAt: isoDate(2, 21, 0),
    venue: "Open Air Theatre",
    description: "Student performances and open mic sets.",
    isFree: true,
    requiresRegistration: false,
    capacity: 300,
    tags: ["music", "open mic"],
    status: "scheduled"
  },
  {
    id: "event-basketball",
    title: "Interdepartment Basketball Finals",
    clubId: "club-sports",
    category: "sports",
    startsAt: isoDate(0, 18, 30),
    endsAt: isoDate(0, 20, 30),
    venue: "Main Court",
    description: "Final match between CSE and ECE departments.",
    isFree: true,
    requiresRegistration: false,
    capacity: 500,
    tags: ["basketball", "finals"],
    status: "scheduled"
  },
  {
    id: "event-cloud-seminar",
    title: "Cloud Native Systems Seminar",
    clubId: "club-tech",
    category: "seminar",
    startsAt: isoDate(4, 11, 0),
    endsAt: isoDate(4, 12, 30),
    venue: "Seminar Hall A",
    description: "Guest talk on containers, observability, and resilient services.",
    isFree: true,
    requiresRegistration: true,
    capacity: 90,
    tags: ["cloud", "devops"],
    status: "scheduled"
  }
];

export const eventSessions: EventSession[] = [
  { id: "session-mcp-1", eventId: "event-mcp-workshop", title: "MCP Architecture Basics", startsAt: isoDate(0, 15, 0), endsAt: isoDate(0, 15, 45), speaker: "Prof. Meera Shah", room: "Innovation Lab 2" },
  { id: "session-mcp-2", eventId: "event-mcp-workshop", title: "Build a Campus Tool Server", startsAt: isoDate(0, 16, 0), endsAt: isoDate(0, 17, 0), speaker: "AI Research Circle", room: "Innovation Lab 2" },
  { id: "session-tech-1", eventId: "event-techfest", title: "Problem Statement Briefing", startsAt: isoDate(1, 10, 0), endsAt: isoDate(1, 10, 30), speaker: "TechNova Club", room: "Auditorium" }
];

export const faculties: Faculty[] = [
  { id: "fac-ai", name: "Dr. Meera Shah", department: "Computer Science", email: "meera.shah@example.edu", office: "CSE-304" },
  { id: "fac-db", name: "Prof. Arjun Nair", department: "Information Technology", email: "arjun.nair@example.edu", office: "IT-212" },
  { id: "fac-math", name: "Dr. Kavya Rao", department: "Mathematics", email: "kavya.rao@example.edu", office: "SCI-118" }
];

export const courses: Course[] = [
  { id: "course-cs201", code: "CS201", title: "Data Structures", department: "Computer Science", semester: 3, credits: 4, prerequisites: ["CS101"], facultyId: "fac-math", description: "Linear and non-linear data structures with algorithmic analysis." },
  { id: "course-cs305", code: "CS305", title: "Database Management Systems", department: "Computer Science", semester: 5, credits: 4, prerequisites: ["CS201"], facultyId: "fac-db", description: "Relational modeling, SQL, transactions, indexes, and normalization." },
  { id: "course-cs411", code: "CS411", title: "Artificial Intelligence", department: "Computer Science", semester: 7, credits: 3, prerequisites: ["CS201", "MA201"], facultyId: "fac-ai", description: "Search, knowledge representation, planning, machine learning basics, and intelligent agents." },
  { id: "course-it303", code: "IT303", title: "Web Engineering", department: "Information Technology", semester: 5, credits: 3, prerequisites: ["CS201"], facultyId: "fac-db", description: "Modern web application architecture, APIs, security, and deployment." }
];

export const academicPolicies: AcademicPolicy[] = [
  { id: "policy-attendance", title: "Attendance Policy", category: "attendance", body: "Students must maintain at least 75% attendance in each course. Medical condonation can be requested through the department office within seven working days.", updatedAt: isoDate(-12) },
  { id: "policy-exam", title: "Examination Policy", category: "exam", body: "Mid-semester and end-semester exams are mandatory. Students must carry college ID cards and report 20 minutes before the scheduled start time.", updatedAt: isoDate(-20) },
  { id: "policy-grading", title: "Grading Policy", category: "grading", body: "Final grades are calculated from continuous assessment, lab work, mid-semester exams, and end-semester exams according to the course evaluation plan.", updatedAt: isoDate(-18) },
  { id: "policy-lab", title: "Computer Lab Rules", category: "lab", body: "Food and drinks are not allowed in labs. Students must use assigned systems and report hardware or network issues to the lab assistant.", updatedAt: isoDate(-8) },
  { id: "policy-library", title: "Library Rules", category: "library", body: "Books are issued for 14 days. Renewals are allowed when there is no active reservation. Late returns attract a daily fine.", updatedAt: isoDate(-15) },
  { id: "policy-hostel", title: "Hostel Rules", category: "hostel", body: "Hostel entry closes at 10:30 PM on weekdays. Late entry requires prior approval from the warden.", updatedAt: isoDate(-22) },
  { id: "policy-scholarship", title: "Scholarship Information", category: "scholarship", body: "Merit and need-based scholarship applications open every semester. Students must submit income proof and academic records through the student portal.", updatedAt: isoDate(-2) },
  { id: "policy-fees", title: "Fee Deadlines", category: "fees", body: "Semester fee payment closes two weeks after registration. Late payment requires approval from accounts and may include a penalty.", updatedAt: isoDate(-5) }
];

export const academicCalendar = [
  { id: "cal-registration", title: "Semester Registration", type: "registration", date: isoDate(5, 9, 0), department: "all" },
  { id: "cal-midsem", title: "Mid-Semester Exams Begin", type: "exam", date: isoDate(35, 9, 0), department: "all" },
  { id: "cal-tech-holiday", title: "Founders Day Holiday", type: "holiday", date: isoDate(12, 0, 0), department: "all" },
  { id: "cal-ai-assignment", title: "AI Assignment 1 Deadline", type: "assignment", date: isoDate(10, 23, 59), department: "Computer Science", courseCode: "CS411" }
];
