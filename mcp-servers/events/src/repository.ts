import { randomUUID } from "node:crypto";
import {
  campusEvents,
  eventClubs,
  eventSessions,
  type CampusEvent,
  type EventClub,
  type EventSession
} from "@campus/shared";

const normalize = (value: string) => value.trim().toLowerCase();

const sameDate = (left: string, right: string) => {
  const a = new Date(left);
  const b = new Date(right);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export type EventRegistration = {
  id: string;
  eventId: string;
  studentId: string;
  status: "registered" | "cancelled" | "waitlisted";
  createdAt: string;
};

export type EventAnnouncement = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: string;
};

export class EventsRepository {
  private events = [...campusEvents];
  private clubs = [...eventClubs];
  private sessions = [...eventSessions];
  private registrations: EventRegistration[] = [
    {
      id: "registration-1",
      eventId: "event-mcp-workshop",
      studentId: "stu-1001",
      status: "registered",
      createdAt: new Date().toISOString()
    }
  ];
  private announcements: EventAnnouncement[] = [
    {
      id: "announcement-mcp-room",
      eventId: "event-mcp-workshop",
      title: "Bring your laptop",
      body: "Participants should bring laptops with Node.js installed.",
      createdAt: new Date().toISOString()
    }
  ];

  listEvents() {
    return this.events;
  }

  searchEvents(query = "") {
    const needle = normalize(query);
    return this.events.filter((event) => {
      if (!query) return true;
      const club = this.getClub(event.clubId);
      return [
        event.title,
        event.description,
        event.category,
        event.venue,
        club?.name ?? "",
        ...event.tags
      ].some((value) => normalize(value).includes(needle));
    });
  }

  getEvent(eventIdOrTitle: string) {
    const needle = normalize(eventIdOrTitle);
    return this.events.find((event) => event.id === eventIdOrTitle || normalize(event.title).includes(needle));
  }

  getEventsByDate(date: string) {
    return this.events.filter((event) => sameDate(event.startsAt, date));
  }

  getEventsByClub(clubIdOrName: string) {
    const club = this.getClub(clubIdOrName);
    return club ? this.events.filter((event) => event.clubId === club.id) : [];
  }

  getEventsByCategory(category: CampusEvent["category"]) {
    return this.events.filter((event) => event.category === category);
  }

  getSessions(eventId: string) {
    return this.sessions.filter((session) => session.eventId === eventId);
  }

  listClubs() {
    return this.clubs;
  }

  getClub(clubIdOrName: string) {
    const needle = normalize(clubIdOrName);
    return this.clubs.find((club) => club.id === clubIdOrName || normalize(club.name).includes(needle));
  }

  searchClubs(query = "") {
    const needle = normalize(query);
    return this.clubs.filter((club) => {
      if (!query) return true;
      return [club.name, club.category, club.description, club.contactEmail].some((value) => normalize(value).includes(needle));
    });
  }

  getRegistration(studentId: string, eventId: string) {
    return this.registrations.find((entry) => entry.studentId === studentId && entry.eventId === eventId);
  }

  listRegistrations(studentId: string) {
    return this.registrations.filter((entry) => entry.studentId === studentId && entry.status === "registered");
  }

  register(studentId: string, eventId: string) {
    const existing = this.getRegistration(studentId, eventId);
    if (existing) {
      existing.status = "registered";
      return existing;
    }
    const registration: EventRegistration = {
      id: `registration-${randomUUID()}`,
      studentId,
      eventId,
      status: "registered",
      createdAt: new Date().toISOString()
    };
    this.registrations.push(registration);
    return registration;
  }

  cancelRegistration(studentId: string, eventId: string) {
    const registration = this.getRegistration(studentId, eventId);
    if (!registration) return undefined;
    registration.status = "cancelled";
    return registration;
  }

  createEvent(input: Omit<CampusEvent, "id">) {
    const event = { ...input, id: `event-${randomUUID()}` };
    this.events.push(event);
    return event;
  }

  updateEvent(eventId: string, patch: Partial<CampusEvent>) {
    const event = this.events.find((entry) => entry.id === eventId);
    if (!event) return undefined;
    Object.assign(event, patch, { id: event.id });
    return event;
  }

  deleteEvent(eventId: string) {
    const before = this.events.length;
    this.events = this.events.filter((event) => event.id !== eventId);
    this.sessions = this.sessions.filter((session) => session.eventId !== eventId);
    this.registrations = this.registrations.filter((entry) => entry.eventId !== eventId);
    return before !== this.events.length;
  }

  createClub(input: Omit<EventClub, "id">) {
    const club = { ...input, id: `club-${randomUUID()}` };
    this.clubs.push(club);
    return club;
  }

  updateClub(clubId: string, patch: Partial<EventClub>) {
    const club = this.clubs.find((entry) => entry.id === clubId);
    if (!club) return undefined;
    Object.assign(club, patch, { id: club.id });
    return club;
  }

  createSession(input: Omit<EventSession, "id">) {
    const session = { ...input, id: `session-${randomUUID()}` };
    this.sessions.push(session);
    return session;
  }

  updateSession(sessionId: string, patch: Partial<EventSession>) {
    const session = this.sessions.find((entry) => entry.id === sessionId);
    if (!session) return undefined;
    Object.assign(session, patch, { id: session.id });
    return session;
  }

  cancelEvent(eventId: string, reason?: string) {
    const event = this.updateEvent(eventId, { status: "cancelled" });
    if (event && reason) {
      this.createAnnouncement({ eventId, title: "Event cancelled", body: reason });
    }
    return event;
  }

  createAnnouncement(input: Omit<EventAnnouncement, "id" | "createdAt">) {
    const announcement = { ...input, id: `announcement-${randomUUID()}`, createdAt: new Date().toISOString() };
    this.announcements.push(announcement);
    return announcement;
  }

  listAnnouncements(eventId: string) {
    return this.announcements.filter((entry) => entry.eventId === eventId);
  }
}
