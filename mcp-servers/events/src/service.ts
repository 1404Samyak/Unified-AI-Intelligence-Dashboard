import type { CampusEvent } from "@campus/shared";
import { EventsRepository } from "./repository.js";

export class EventsService {
  constructor(private readonly repo: EventsRepository) {}

  getTodayEvents() {
    const events = this.repo.getEventsByDate(new Date().toISOString()).map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  getUpcomingEvents(limit = 10) {
    const now = Date.now();
    const events = this.repo
      .listEvents()
      .filter((event) => Date.parse(event.startsAt) >= now && event.status === "scheduled")
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
      .slice(0, limit)
      .map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  searchEvents(query = "") {
    const events = this.repo.searchEvents(query).map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  getEventDetails(eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    return event ? { source: "events", event: this.withDetails(event) } : { source: "events", error: "Event not found" };
  }

  getEventsByDate(date: string) {
    const events = this.repo.getEventsByDate(date).map((event) => this.withDetails(event));
    return { source: "events", date, count: events.length, events };
  }

  getEventsByClub(clubIdOrName: string) {
    const club = this.repo.getClub(clubIdOrName);
    if (!club) return { source: "events", error: "Club not found" };
    const events = this.repo.getEventsByClub(club.id).map((event) => this.withDetails(event));
    return { source: "events", club, count: events.length, events };
  }

  getEventsByCategory(category: CampusEvent["category"]) {
    const events = this.repo.getEventsByCategory(category).map((event) => this.withDetails(event));
    return { source: "events", category, count: events.length, events };
  }

  getTechnicalEvents() {
    const events = this.repo
      .listEvents()
      .filter((event) => event.category === "technical" || event.tags.includes("ai") || event.tags.includes("cloud"))
      .map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  getCulturalEvents() {
    return this.getEventsByCategory("cultural");
  }

  getSportsEvents() {
    return this.getEventsByCategory("sports");
  }

  getWorkshops() {
    return this.getEventsByCategory("workshop");
  }

  getSeminars() {
    return this.getEventsByCategory("seminar");
  }

  getHackathons() {
    return this.getEventsByCategory("hackathon");
  }

  getEventSchedule(eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    if (!event) return { source: "events", error: "Event not found" };
    return { source: "events", event: { id: event.id, title: event.title }, sessions: this.repo.getSessions(event.id) };
  }

  getEventVenue(eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    return event ? { source: "events", event: event.title, venue: event.venue, startsAt: event.startsAt } : { source: "events", error: "Event not found" };
  }

  getEventsNearNow(hours = 6) {
    const now = Date.now();
    const limit = now + hours * 60 * 60 * 1000;
    const events = this.repo
      .listEvents()
      .filter((event) => Date.parse(event.startsAt) >= now && Date.parse(event.startsAt) <= limit)
      .map((event) => this.withDetails(event));
    return { source: "events", hours, count: events.length, events };
  }

  getFreeEvents() {
    const events = this.repo.listEvents().filter((event) => event.isFree).map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  getRegistrationRequiredEvents() {
    const events = this.repo.listEvents().filter((event) => event.requiresRegistration).map((event) => this.withDetails(event));
    return { source: "events", count: events.length, events };
  }

  checkEventRegistrationStatus(studentId: string, eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    if (!event) return { source: "events", error: "Event not found" };
    const registration = this.repo.getRegistration(studentId, event.id);
    return { source: "events", studentId, event: { id: event.id, title: event.title }, status: registration?.status ?? "not_registered", registration };
  }

  registerForEvent(studentId: string, eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    if (!event) return { source: "events", error: "Event not found" };
    if (event.status !== "scheduled") return { source: "events", registered: false, error: "Event is not open for registration" };
    const registration = this.repo.register(studentId, event.id);
    return { source: "events", registered: true, event: { id: event.id, title: event.title }, registration };
  }

  cancelEventRegistration(studentId: string, eventIdOrTitle: string) {
    const event = this.repo.getEvent(eventIdOrTitle);
    if (!event) return { source: "events", error: "Event not found" };
    const registration = this.repo.cancelRegistration(studentId, event.id);
    return registration ? { source: "events", cancelled: true, registration } : { source: "events", cancelled: false, error: "Registration not found" };
  }

  getMyRegisteredEvents(studentId: string) {
    const registrations = this.repo.listRegistrations(studentId).map((registration) => ({
      ...registration,
      event: this.repo.getEvent(registration.eventId)
    }));
    return { source: "events", studentId, registrations };
  }

  getClubDetails(clubIdOrName: string) {
    const club = this.repo.getClub(clubIdOrName);
    return club ? { source: "events", club, events: this.repo.getEventsByClub(club.id) } : { source: "events", error: "Club not found" };
  }

  searchClubs(query = "") {
    const clubs = this.repo.searchClubs(query);
    return { source: "events", count: clubs.length, clubs };
  }

  createEvent(input: Omit<CampusEvent, "id">) {
    return { source: "events", event: this.repo.createEvent(input) };
  }

  updateEvent(eventId: string, patch: Partial<CampusEvent>) {
    const event = this.repo.updateEvent(eventId, patch);
    return event ? { source: "events", event } : { source: "events", error: "Event not found" };
  }

  deleteEvent(eventId: string) {
    return { source: "events", deleted: this.repo.deleteEvent(eventId) };
  }

  createClub(input: { name: string; category: string; description: string; contactEmail: string }) {
    return { source: "events", club: this.repo.createClub(input) };
  }

  updateClub(clubId: string, patch: { name?: string; category?: string; description?: string; contactEmail?: string }) {
    const club = this.repo.updateClub(clubId, patch);
    return club ? { source: "events", club } : { source: "events", error: "Club not found" };
  }

  createEventSession(input: { eventId: string; title: string; startsAt: string; endsAt: string; speaker: string; room: string }) {
    return { source: "events", session: this.repo.createSession(input) };
  }

  updateEventSession(sessionId: string, patch: { eventId?: string; title?: string; startsAt?: string; endsAt?: string; speaker?: string; room?: string }) {
    const session = this.repo.updateSession(sessionId, patch);
    return session ? { source: "events", session } : { source: "events", error: "Session not found" };
  }

  markEventCancelled(eventId: string, reason?: string) {
    const event = this.repo.cancelEvent(eventId, reason);
    return event ? { source: "events", event } : { source: "events", error: "Event not found" };
  }

  createEventAnnouncement(eventId: string, title: string, body: string) {
    const event = this.repo.getEvent(eventId);
    if (!event) return { source: "events", error: "Event not found" };
    return { source: "events", announcement: this.repo.createAnnouncement({ eventId: event.id, title, body }) };
  }

  private withDetails(event: CampusEvent) {
    return {
      ...event,
      club: this.repo.getClub(event.clubId),
      sessions: this.repo.getSessions(event.id),
      announcements: this.repo.listAnnouncements(event.id)
    };
  }
}
