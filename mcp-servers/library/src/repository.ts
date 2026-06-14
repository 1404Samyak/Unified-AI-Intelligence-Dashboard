import { randomUUID } from "node:crypto";
import {
  bookCopies,
  libraryBooks,
  libraryLoans,
  type BookCopy,
  type LibraryBook,
  type LibraryLoan
} from "@campus/shared";

export type Reservation = {
  id: string;
  studentId: string;
  bookId: string;
  status: "active" | "cancelled" | "fulfilled";
  createdAt: string;
};

export type Journal = {
  id: string;
  title: string;
  subjects: string[];
  access: "open" | "campus-only";
};

export type ResearchPaper = {
  id: string;
  title: string;
  authors: string[];
  subjects: string[];
  year: number;
  url: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

const matchText = (query: string, values: string[]) => {
  const q = normalize(query);
  return values.some((value) => normalize(value).includes(q));
};

export class LibraryRepository {
  private books = [...libraryBooks];
  private copies = [...bookCopies];
  private loans = [...libraryLoans];
  private reservations: Reservation[] = [
    {
      id: "reservation-1",
      studentId: "stu-1002",
      bookId: "book-algorithms",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ];

  private notices = [
    {
      id: "notice-library-hours",
      title: "Extended library hours",
      body: "The central library remains open until 11 PM during exam preparation week.",
      createdAt: new Date().toISOString()
    }
  ];

  private journals: Journal[] = [
    { id: "journal-acm", title: "ACM Digital Library", subjects: ["computer science", "software engineering"], access: "campus-only" },
    { id: "journal-ieee", title: "IEEE Xplore", subjects: ["electronics", "ai", "networks"], access: "campus-only" },
    { id: "journal-doaj", title: "Directory of Open Access Journals", subjects: ["general", "research"], access: "open" }
  ];

  private papers: ResearchPaper[] = [
    {
      id: "paper-mcp-campus",
      title: "Tool-Oriented Campus Information Systems",
      authors: ["M. Shah", "A. Nair"],
      subjects: ["mcp", "campus systems", "ai"],
      year: 2026,
      url: "https://research.example.edu/papers/tool-campus"
    },
    {
      id: "paper-db-indexes",
      title: "Index Selection for Student Information Portals",
      authors: ["K. Rao"],
      subjects: ["database", "indexes"],
      year: 2025,
      url: "https://research.example.edu/papers/index-selection"
    }
  ];

  searchBooks(query = "", filters: { subject?: string; course?: string; author?: string } = {}) {
    return this.books.filter((book) => {
      const queryMatch =
        !query ||
        matchText(query, [
          book.title,
          book.description,
          book.publisher,
          ...book.authors,
          ...book.subjects,
          ...book.courses
        ]);
      const subjectMatch = !filters.subject || matchText(filters.subject, book.subjects);
      const courseMatch = !filters.course || matchText(filters.course, book.courses);
      const authorMatch = !filters.author || matchText(filters.author, book.authors);
      return queryMatch && subjectMatch && courseMatch && authorMatch;
    });
  }

  getBook(bookIdOrTitle: string) {
    const needle = normalize(bookIdOrTitle);
    return this.books.find((book) => book.id === bookIdOrTitle || normalize(book.title).includes(needle));
  }

  getCopiesByBook(bookId: string) {
    return this.copies.filter((copy) => copy.bookId === bookId);
  }

  getCopy(copyId: string) {
    return this.copies.find((copy) => copy.id === copyId);
  }

  listBooks() {
    return this.books;
  }

  listLoans(studentId: string) {
    return this.loans.filter((loan) => loan.studentId === studentId);
  }

  listReservations(studentId?: string) {
    return studentId ? this.reservations.filter((item) => item.studentId === studentId) : this.reservations;
  }

  listNotices() {
    return this.notices;
  }

  listJournals(query = "") {
    return this.journals.filter((journal) => !query || matchText(query, [journal.title, ...journal.subjects]));
  }

  listPapers(query = "") {
    return this.papers.filter((paper) => !query || matchText(query, [paper.title, ...paper.authors, ...paper.subjects]));
  }

  createBook(input: Omit<LibraryBook, "id" | "createdAt" | "popularity"> & { popularity?: number }) {
    const book: LibraryBook = {
      ...input,
      id: `book-${randomUUID()}`,
      popularity: input.popularity ?? 10,
      createdAt: new Date().toISOString()
    };
    this.books.push(book);
    return book;
  }

  updateBook(bookId: string, patch: Partial<LibraryBook>) {
    const book = this.books.find((item) => item.id === bookId);
    if (!book) return undefined;
    Object.assign(book, patch, { id: book.id });
    return book;
  }

  deleteBook(bookId: string) {
    const before = this.books.length;
    this.books = this.books.filter((book) => book.id !== bookId);
    this.copies = this.copies.filter((copy) => copy.bookId !== bookId);
    return before !== this.books.length;
  }

  createCopy(input: Omit<BookCopy, "id">) {
    const copy = { ...input, id: `copy-${randomUUID()}` };
    this.copies.push(copy);
    return copy;
  }

  updateCopyStatus(copyId: string, status: BookCopy["status"]) {
    const copy = this.copies.find((item) => item.id === copyId);
    if (!copy) return undefined;
    copy.status = status;
    return copy;
  }

  createReservation(studentId: string, bookId: string) {
    const reservation: Reservation = {
      id: `reservation-${randomUUID()}`,
      studentId,
      bookId,
      status: "active",
      createdAt: new Date().toISOString()
    };
    this.reservations.push(reservation);
    return reservation;
  }

  cancelReservation(reservationId: string) {
    const reservation = this.reservations.find((item) => item.id === reservationId);
    if (!reservation) return undefined;
    reservation.status = "cancelled";
    return reservation;
  }

  renewLoan(studentId: string, bookId: string) {
    const bookCopiesForBook = this.getCopiesByBook(bookId).map((copy) => copy.id);
    const loan = this.loans.find((item) => item.studentId === studentId && bookCopiesForBook.includes(item.copyId));
    if (!loan) return undefined;
    const due = new Date(loan.dueDate);
    due.setDate(due.getDate() + 7);
    loan.dueDate = due.toISOString();
    return loan;
  }

  createNotice(input: { title: string; body: string }) {
    const notice = { id: `notice-${randomUUID()}`, ...input, createdAt: new Date().toISOString() };
    this.notices.push(notice);
    return notice;
  }
}
