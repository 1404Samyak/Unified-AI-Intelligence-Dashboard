import type { ToolCallPlan } from "./types.js";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesAny = (message: string, words: string[]) =>
  words.some((word) => {
    if (word.includes(" ") || word.includes("-")) return message.includes(word);
    return new RegExp(`\\b${escapeRegex(word)}\\b`).test(message);
  });

const knownBookTitles = [
  "Clean Code",
  "Introduction to Algorithms",
  "Database System Concepts",
  "Artificial Intelligence: A Modern Approach",
  "Operating System Concepts",
  "Atomic Habits"
];

const knownFood = ["idli", "poha", "paneer", "chicken", "jain", "salad", "dosa", "rajma", "tea", "samosa"];

const extractBook = (message: string) =>
  knownBookTitles.find((title) => message.toLowerCase().includes(title.toLowerCase())) ?? "Clean Code";

const extractCourse = (message: string) => {
  const code = message.match(/\b[A-Z]{2,3}\d{3}\b/i)?.[0];
  if (code) return code.toUpperCase();
  if (message.includes("ai") || message.includes("artificial intelligence")) return "CS411";
  if (message.includes("database") || message.includes("dbms")) return "CS305";
  return "CS305";
};

export function fallbackRoute(message: string, studentId = "stu-1001"): ToolCallPlan[] {
  const lower = message.toLowerCase();
  const calls: ToolCallPlan[] = [];

  if (includesAny(lower, ["book", "library", "borrow", "available", "fine", "due", "journal", "paper", "digital copy", "ebook"])) {
    if (includesAny(lower, ["fine", "penalty"])) {
      calls.push({ qualifiedName: "library__get_user_fines", arguments: { studentId }, reason: "Question asks about library fines." });
    } else if (includesAny(lower, ["due", "borrowed", "issued"])) {
      calls.push({ qualifiedName: "library__get_user_due_dates", arguments: { studentId }, reason: "Question asks about borrowed books or due dates." });
    } else if (includesAny(lower, ["journal"])) {
      calls.push({ qualifiedName: "library__search_journals", arguments: { query: message }, reason: "Question asks about journals." });
    } else if (includesAny(lower, ["paper", "research"])) {
      calls.push({ qualifiedName: "library__search_research_papers", arguments: { query: message }, reason: "Question asks about research papers." });
    } else if (includesAny(lower, ["digital", "ebook", "e-book"])) {
      calls.push({ qualifiedName: "library__check_digital_copy_available", arguments: { bookIdOrTitle: extractBook(lower) }, reason: "Question asks about digital availability." });
    } else if (includesAny(lower, ["available", "availability"])) {
      calls.push({ qualifiedName: "library__check_book_availability", arguments: { bookIdOrTitle: extractBook(lower) }, reason: "Question asks whether a book is available." });
    } else {
      calls.push({ qualifiedName: "library__search_books", arguments: { query: extractBook(lower) }, reason: "Question appears to ask for a book search." });
    }
  }

  if (includesAny(lower, ["menu", "cafeteria", "lunch", "dinner", "breakfast", "food", "meal", "veg", "non veg", "jain", "allergen", "allergy", "price", "counter"])) {
    if (includesAny(lower, ["breakfast"])) {
      calls.push({ qualifiedName: "cafeteria__get_breakfast_menu", arguments: {}, reason: "Question asks about breakfast." });
    } else if (includesAny(lower, ["lunch"])) {
      calls.push({ qualifiedName: "cafeteria__get_lunch_menu", arguments: {}, reason: "Question asks about lunch." });
    } else if (includesAny(lower, ["dinner"])) {
      calls.push({ qualifiedName: "cafeteria__get_dinner_menu", arguments: {}, reason: "Question asks about dinner." });
    } else if (includesAny(lower, ["jain"])) {
      calls.push({ qualifiedName: "cafeteria__get_jain_menu", arguments: {}, reason: "Question asks for Jain food." });
    } else if (includesAny(lower, ["non veg", "non-veg", "chicken"])) {
      calls.push({ qualifiedName: "cafeteria__get_non_veg_menu", arguments: {}, reason: "Question asks for non-vegetarian food." });
    } else if (includesAny(lower, ["veg", "vegetarian"])) {
      calls.push({ qualifiedName: "cafeteria__get_veg_menu", arguments: {}, reason: "Question asks for vegetarian food." });
    } else if (includesAny(lower, ["cheap", "low cost", "budget", "under"])) {
      calls.push({ qualifiedName: "cafeteria__get_low_cost_meals", arguments: { maxPrice: 70 }, reason: "Question asks for low-cost meals." });
    } else if (knownFood.some((food) => lower.includes(food))) {
      const food = knownFood.find((item) => lower.includes(item)) ?? "";
      calls.push({ qualifiedName: "cafeteria__search_food_items", arguments: { query: food }, reason: "Question names a food item." });
    } else {
      calls.push({ qualifiedName: "cafeteria__get_today_menu", arguments: {}, reason: "Question asks about cafeteria menu." });
    }
  }

  if (includesAny(lower, ["event", "events", "workshop", "hackathon", "seminar", "club", "fest", "venue", "registration", "register", "sports", "cultural"])) {
    if (includesAny(lower, ["today", "now"])) {
      calls.push({ qualifiedName: "events__get_today_events", arguments: {}, reason: "Question asks about events today." });
    } else if (includesAny(lower, ["workshop"])) {
      calls.push({ qualifiedName: "events__get_workshops", arguments: {}, reason: "Question asks about workshops." });
    } else if (includesAny(lower, ["hackathon", "fest", "sprint"])) {
      calls.push({ qualifiedName: "events__get_hackathons", arguments: {}, reason: "Question asks about hackathons or fest events." });
    } else if (includesAny(lower, ["club"])) {
      calls.push({ qualifiedName: "events__search_clubs", arguments: { query: message }, reason: "Question asks about clubs." });
    } else {
      calls.push({ qualifiedName: "events__get_upcoming_events", arguments: { limit: 5 }, reason: "Question asks about upcoming events." });
    }
  }

  if (includesAny(lower, ["attendance", "policy", "exam", "grading", "course", "syllabus", "faculty", "calendar", "assignment", "holiday", "lab", "hostel", "scholarship", "fee", "academic"])) {
    if (includesAny(lower, ["attendance"])) {
      calls.push({ qualifiedName: "academics__get_attendance_policy", arguments: {}, reason: "Question asks about attendance policy." });
    } else if (includesAny(lower, ["exam"])) {
      calls.push({ qualifiedName: "academics__get_exam_schedule", arguments: {}, reason: "Question asks about exams." });
    } else if (includesAny(lower, ["grading"])) {
      calls.push({ qualifiedName: "academics__get_grading_policy", arguments: {}, reason: "Question asks about grading." });
    } else if (includesAny(lower, ["syllabus", "topic"])) {
      calls.push({ qualifiedName: "academics__get_syllabus", arguments: { courseCode: extractCourse(lower) }, reason: "Question asks about syllabus." });
    } else if (includesAny(lower, ["course", "credits", "prerequisite"])) {
      calls.push({ qualifiedName: "academics__get_course_details", arguments: { courseCodeOrId: extractCourse(lower) }, reason: "Question asks about course details." });
    } else if (includesAny(lower, ["holiday"])) {
      calls.push({ qualifiedName: "academics__get_holiday_list", arguments: {}, reason: "Question asks about holidays." });
    } else if (includesAny(lower, ["assignment", "deadline"])) {
      calls.push({ qualifiedName: "academics__get_assignment_deadlines", arguments: {}, reason: "Question asks about assignment deadlines." });
    } else {
      calls.push({ qualifiedName: "academics__search_academic_handbook", arguments: { query: message }, reason: "Question asks about academic handbook information." });
    }
  }

  if (calls.length === 0) {
    calls.push(
      { qualifiedName: "library__get_library_hours", arguments: {}, reason: "Default dashboard context." },
      { qualifiedName: "cafeteria__get_today_menu", arguments: {}, reason: "Default dashboard context." },
      { qualifiedName: "events__get_upcoming_events", arguments: { limit: 3 }, reason: "Default dashboard context." },
      { qualifiedName: "academics__get_department_notices", arguments: {}, reason: "Default dashboard context." }
    );
  }

  const unique = new Map<string, ToolCallPlan>();
  for (const call of calls) {
    unique.set(`${call.qualifiedName}:${JSON.stringify(call.arguments)}`, call);
  }
  return [...unique.values()].slice(0, 6);
}
