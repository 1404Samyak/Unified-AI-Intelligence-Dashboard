export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonRecord = Record<string, JsonValue>;

export type StudentContext = {
  studentId?: string;
  name?: string;
  department?: string;
  semester?: number;
  dietaryPreference?: "veg" | "non-veg" | "jain" | "vegan";
  interests?: string[];
};

export type ToolAudience = "student";

export type CampusToolInfo = {
  domain: "library" | "cafeteria" | "events" | "academics";
  name: string;
  description: string;
  audience: ToolAudience;
};

export type LibraryBook = {
  id: string;
  title: string;
  authors: string[];
  subjects: string[];
  courses: string[];
  isbn: string;
  year: number;
  publisher: string;
  description: string;
  digitalCopyUrl?: string;
  popularity: number;
  createdAt: string;
};

export type BookCopy = {
  id: string;
  bookId: string;
  barcode: string;
  status: "available" | "borrowed" | "reserved" | "maintenance";
  floor: string;
  shelf: string;
};

export type LibraryLoan = {
  id: string;
  studentId: string;
  copyId: string;
  dueDate: string;
  fineAmount: number;
};

export type CafeteriaMenuItem = {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "beverage";
  diet: "veg" | "non-veg" | "jain" | "vegan";
  allergens: string[];
  calories: number;
  proteinGrams: number;
  price: number;
  counterId: string;
  isAvailable: boolean;
  tags: string[];
};

export type CafeteriaCounter = {
  id: string;
  name: string;
  opensAt: string;
  closesAt: string;
  location: string;
};

export type DailyMenu = {
  date: string;
  dayOfWeek: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  specials: string[];
};

export type CampusEvent = {
  id: string;
  title: string;
  clubId: string;
  category: "technical" | "cultural" | "sports" | "workshop" | "seminar" | "hackathon";
  startsAt: string;
  endsAt: string;
  venue: string;
  description: string;
  isFree: boolean;
  requiresRegistration: boolean;
  capacity: number;
  tags: string[];
  status: "scheduled" | "cancelled" | "completed";
};

export type EventClub = {
  id: string;
  name: string;
  category: string;
  description: string;
  contactEmail: string;
};

export type EventSession = {
  id: string;
  eventId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  speaker: string;
  room: string;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: number;
  credits: number;
  prerequisites: string[];
  facultyId: string;
  description: string;
};

export type Faculty = {
  id: string;
  name: string;
  department: string;
  email: string;
  office: string;
};

export type AcademicPolicy = {
  id: string;
  title: string;
  category:
    | "attendance"
    | "exam"
    | "grading"
    | "lab"
    | "library"
    | "hostel"
    | "scholarship"
    | "fees"
    | "general";
  body: string;
  updatedAt: string;
};
