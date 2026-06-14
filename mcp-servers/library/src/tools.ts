import { registerJsonTool } from "@campus/mcp-common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LibraryService } from "./service.js";

export function registerLibraryTools(server: McpServer, service: LibraryService) {
  registerJsonTool(server, "search_books", "Search library books by title, author, subject, course, ISBN, or description.", {
    query: z.string().default(""),
    subject: z.string().optional(),
    course: z.string().optional(),
    author: z.string().optional()
  }, (args) => service.searchBooks(args.query, args));

  registerJsonTool(server, "get_book_details", "Get full metadata and availability for a specific book.", {
    bookIdOrTitle: z.string()
  }, (args) => service.getBookDetails(args.bookIdOrTitle));

  registerJsonTool(server, "check_book_availability", "Check whether a specific book currently has available copies.", {
    bookIdOrTitle: z.string()
  }, (args) => service.checkBookAvailability(args.bookIdOrTitle));

  registerJsonTool(server, "get_book_location", "Find floor and shelf locations for copies of a book.", {
    bookIdOrTitle: z.string()
  }, (args) => service.getBookLocation(args.bookIdOrTitle));

  registerJsonTool(server, "find_books_by_author", "Find books written by an author.", {
    author: z.string()
  }, (args) => service.findBooksByAuthor(args.author));

  registerJsonTool(server, "find_books_by_subject", "Find books for a subject area.", {
    subject: z.string()
  }, (args) => service.findBooksBySubject(args.subject));

  registerJsonTool(server, "find_books_by_course", "Find recommended books mapped to a course code.", {
    course: z.string()
  }, (args) => service.findBooksByCourse(args.course));

  registerJsonTool(server, "get_new_arrivals", "List recently added library books.", {
    limit: z.number().int().min(1).max(20).default(5)
  }, (args) => service.getNewArrivals(args.limit));

  registerJsonTool(server, "get_popular_books", "List popular books based on borrow and search demand.", {
    limit: z.number().int().min(1).max(20).default(5)
  }, (args) => service.getPopularBooks(args.limit));

  registerJsonTool(server, "get_related_books", "Find books related to a selected book.", {
    bookIdOrTitle: z.string()
  }, (args) => service.getRelatedBooks(args.bookIdOrTitle));

  registerJsonTool(server, "get_library_hours", "Get current library hours and notices.", {}, () => service.getLibraryHours());

  registerJsonTool(server, "get_user_borrowed_books", "List books currently borrowed by a student.", {
    studentId: z.string()
  }, (args) => service.getUserBorrowedBooks(args.studentId));

  registerJsonTool(server, "get_user_due_dates", "List library due dates for a student.", {
    studentId: z.string()
  }, (args) => service.getUserDueDates(args.studentId));

  registerJsonTool(server, "get_user_fines", "Calculate pending library fines for a student.", {
    studentId: z.string()
  }, (args) => service.getUserFines(args.studentId));

  registerJsonTool(server, "renew_book", "Renew a borrowed book for a student when eligible.", {
    studentId: z.string(),
    bookIdOrTitle: z.string()
  }, (args) => service.renewBook(args.studentId, args.bookIdOrTitle));

  registerJsonTool(server, "reserve_book", "Reserve a book for a student.", {
    studentId: z.string(),
    bookIdOrTitle: z.string()
  }, (args) => service.reserveBook(args.studentId, args.bookIdOrTitle));

  registerJsonTool(server, "cancel_book_reservation", "Cancel a student's active book reservation.", {
    reservationId: z.string()
  }, (args) => service.cancelBookReservation(args.reservationId));

  registerJsonTool(server, "check_digital_copy_available", "Check if a book has a digital/e-book copy.", {
    bookIdOrTitle: z.string()
  }, (args) => service.checkDigitalCopyAvailable(args.bookIdOrTitle));

  registerJsonTool(server, "search_journals", "Search subscribed or open academic journals.", {
    query: z.string().default("")
  }, (args) => service.searchJournals(args.query));

  registerJsonTool(server, "search_research_papers", "Search research paper records available through the library.", {
    query: z.string().default("")
  }, (args) => service.searchResearchPapers(args.query));
}
