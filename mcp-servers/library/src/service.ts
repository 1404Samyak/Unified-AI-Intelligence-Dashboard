import type { LibraryBook } from "@campus/shared";
import { LibraryRepository } from "./repository.js";

export class LibraryService {
  constructor(private readonly repo: LibraryRepository) {}

  searchBooks(query = "", filters: { subject?: string; course?: string; author?: string } = {}) {
    const books = this.repo.searchBooks(query, filters);
    return { source: "library", count: books.length, books: books.map((book) => this.withAvailability(book)) };
  }

  getBookDetails(bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    return book ? { source: "library", book: this.withAvailability(book) } : { source: "library", error: "Book not found" };
  }

  checkBookAvailability(bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", available: false, error: "Book not found" };
    const copies = this.repo.getCopiesByBook(book.id);
    const availableCopies = copies.filter((copy) => copy.status === "available");
    return {
      source: "library",
      book: { id: book.id, title: book.title },
      available: availableCopies.length > 0,
      availableCopies,
      totalCopies: copies.length
    };
  }

  getBookLocation(bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", error: "Book not found" };
    const locations = this.repo.getCopiesByBook(book.id).map((copy) => ({
      copyId: copy.id,
      barcode: copy.barcode,
      status: copy.status,
      floor: copy.floor,
      shelf: copy.shelf
    }));
    return { source: "library", book: { id: book.id, title: book.title }, locations };
  }

  findBooksByAuthor(author: string) {
    return this.searchBooks("", { author });
  }

  findBooksBySubject(subject: string) {
    return this.searchBooks("", { subject });
  }

  findBooksByCourse(course: string) {
    return this.searchBooks("", { course });
  }

  getNewArrivals(limit = 5) {
    const books = [...this.repo.listBooks()]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit)
      .map((book) => this.withAvailability(book));
    return { source: "library", books };
  }

  getPopularBooks(limit = 5) {
    const books = [...this.repo.listBooks()]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
      .map((book) => this.withAvailability(book));
    return { source: "library", books };
  }

  getRelatedBooks(bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", error: "Book not found" };
    const related = this.repo
      .listBooks()
      .filter((candidate) => candidate.id !== book.id)
      .filter((candidate) => candidate.subjects.some((subject) => book.subjects.includes(subject)))
      .slice(0, 5)
      .map((candidate) => this.withAvailability(candidate));
    return { source: "library", book: { id: book.id, title: book.title }, related };
  }

  getLibraryHours() {
    return {
      source: "library",
      hours: {
        weekdays: "08:00-23:00",
        saturday: "09:00-21:00",
        sunday: "10:00-18:00",
        examWeek: "08:00-01:00"
      },
      notices: this.repo.listNotices()
    };
  }

  getUserBorrowedBooks(studentId: string) {
    const loans = this.repo.listLoans(studentId).map((loan) => {
      const copy = this.repo.getCopy(loan.copyId);
      const book = copy ? this.repo.getBook(copy.bookId) : undefined;
      return { ...loan, book, copy };
    });
    return { source: "library", studentId, loans };
  }

  getUserDueDates(studentId: string) {
    const loans = this.getUserBorrowedBooks(studentId);
    return { source: "library", studentId, dueDates: loans.loans.map((loan) => ({ title: loan.book?.title, dueDate: loan.dueDate })) };
  }

  getUserFines(studentId: string) {
    const loans = this.repo.listLoans(studentId);
    const totalFine = loans.reduce((sum, loan) => sum + loan.fineAmount, 0);
    return { source: "library", studentId, totalFine, fineBreakdown: loans.filter((loan) => loan.fineAmount > 0) };
  }

  renewBook(studentId: string, bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", error: "Book not found" };
    const loan = this.repo.renewLoan(studentId, book.id);
    return loan ? { source: "library", renewed: true, loan } : { source: "library", renewed: false, error: "No active loan found for this student and book" };
  }

  reserveBook(studentId: string, bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", error: "Book not found" };
    const reservation = this.repo.createReservation(studentId, book.id);
    return { source: "library", reserved: true, reservation };
  }

  cancelBookReservation(reservationId: string) {
    const reservation = this.repo.cancelReservation(reservationId);
    return reservation ? { source: "library", cancelled: true, reservation } : { source: "library", cancelled: false, error: "Reservation not found" };
  }

  checkDigitalCopyAvailable(bookIdOrTitle: string) {
    const book = this.repo.getBook(bookIdOrTitle);
    if (!book) return { source: "library", error: "Book not found" };
    return { source: "library", title: book.title, available: Boolean(book.digitalCopyUrl), url: book.digitalCopyUrl ?? null };
  }

  searchJournals(query = "") {
    const journals = this.repo.listJournals(query);
    return { source: "library", count: journals.length, journals };
  }

  searchResearchPapers(query = "") {
    const papers = this.repo.listPapers(query);
    return { source: "library", count: papers.length, papers };
  }

  createBook(input: Omit<LibraryBook, "id" | "createdAt" | "popularity"> & { popularity?: number }) {
    return { source: "library", book: this.repo.createBook(input) };
  }

  updateBook(bookId: string, patch: Partial<LibraryBook>) {
    const book = this.repo.updateBook(bookId, patch);
    return book ? { source: "library", book } : { source: "library", error: "Book not found" };
  }

  deleteBook(bookId: string) {
    return { source: "library", deleted: this.repo.deleteBook(bookId) };
  }

  createBookCopy(input: { bookId: string; barcode: string; status?: "available" | "borrowed" | "reserved" | "maintenance"; floor: string; shelf: string }) {
    return { source: "library", copy: this.repo.createCopy({ ...input, status: input.status ?? "available" }) };
  }

  updateBookCopyStatus(copyId: string, status: "available" | "borrowed" | "reserved" | "maintenance") {
    const copy = this.repo.updateCopyStatus(copyId, status);
    return copy ? { source: "library", copy } : { source: "library", error: "Copy not found" };
  }

  createAuthor(name: string) {
    return { source: "library", author: { id: `author-${name.toLowerCase().replaceAll(" ", "-")}`, name } };
  }

  updateAuthor(authorId: string, name: string) {
    return { source: "library", author: { id: authorId, name } };
  }

  createLibraryNotice(title: string, body: string) {
    return { source: "library", notice: this.repo.createNotice({ title, body }) };
  }

  private withAvailability(book: LibraryBook) {
    const copies = this.repo.getCopiesByBook(book.id);
    return {
      ...book,
      availability: {
        totalCopies: copies.length,
        availableCopies: copies.filter((copy) => copy.status === "available").length,
        statuses: copies.map((copy) => ({ copyId: copy.id, status: copy.status, shelf: copy.shelf }))
      }
    };
  }
}
