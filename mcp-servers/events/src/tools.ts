import { registerJsonTool } from "@campus/mcp-common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EventsService } from "./service.js";

const eventCategory = z.enum(["technical", "cultural", "sports", "workshop", "seminar", "hackathon"]);
const eventStatus = z.enum(["scheduled", "cancelled", "completed"]);

const eventInput = {
  title: z.string(),
  clubId: z.string(),
  category: eventCategory,
  startsAt: z.string(),
  endsAt: z.string(),
  venue: z.string(),
  description: z.string(),
  isFree: z.boolean().default(true),
  requiresRegistration: z.boolean().default(false),
  capacity: z.number().int().min(1).default(50),
  tags: z.array(z.string()).default([]),
  status: eventStatus.default("scheduled")
};

export function registerEventsTools(server: McpServer, service: EventsService) {
  registerJsonTool(server, "get_today_events", "Get campus events happening today.", {}, () => service.getTodayEvents());
  registerJsonTool(server, "get_upcoming_events", "Get upcoming scheduled campus events.", {
    limit: z.number().int().min(1).max(50).default(10)
  }, (args) => service.getUpcomingEvents(args.limit));
  registerJsonTool(server, "search_events", "Search events by title, club, category, venue, description, or tags.", {
    query: z.string().default("")
  }, (args) => service.searchEvents(args.query));
  registerJsonTool(server, "get_event_details", "Get full details for a campus event.", {
    eventIdOrTitle: z.string()
  }, (args) => service.getEventDetails(args.eventIdOrTitle));
  registerJsonTool(server, "get_events_by_date", "Get events for a specific date.", {
    date: z.string()
  }, (args) => service.getEventsByDate(args.date));
  registerJsonTool(server, "get_events_by_club", "Get events organized by a club.", {
    clubIdOrName: z.string()
  }, (args) => service.getEventsByClub(args.clubIdOrName));
  registerJsonTool(server, "get_events_by_category", "Get events by category.", {
    category: eventCategory
  }, (args) => service.getEventsByCategory(args.category));
  registerJsonTool(server, "get_technical_events", "Get technical events and tech-focused sessions.", {}, () => service.getTechnicalEvents());
  registerJsonTool(server, "get_cultural_events", "Get cultural events.", {}, () => service.getCulturalEvents());
  registerJsonTool(server, "get_sports_events", "Get sports events.", {}, () => service.getSportsEvents());
  registerJsonTool(server, "get_workshops", "Get workshop events.", {}, () => service.getWorkshops());
  registerJsonTool(server, "get_seminars", "Get seminar events.", {}, () => service.getSeminars());
  registerJsonTool(server, "get_hackathons", "Get hackathon events.", {}, () => service.getHackathons());
  registerJsonTool(server, "get_event_schedule", "Get session schedule for a specific event.", {
    eventIdOrTitle: z.string()
  }, (args) => service.getEventSchedule(args.eventIdOrTitle));
  registerJsonTool(server, "get_event_venue", "Get venue and start time for a specific event.", {
    eventIdOrTitle: z.string()
  }, (args) => service.getEventVenue(args.eventIdOrTitle));
  registerJsonTool(server, "get_events_near_now", "Get events starting in the next N hours.", {
    hours: z.number().min(1).max(48).default(6)
  }, (args) => service.getEventsNearNow(args.hours));
  registerJsonTool(server, "get_free_events", "Get free campus events.", {}, () => service.getFreeEvents());
  registerJsonTool(server, "get_registration_required_events", "Get events that require registration.", {}, () => service.getRegistrationRequiredEvents());
  registerJsonTool(server, "check_event_registration_status", "Check whether a student is registered for an event.", {
    studentId: z.string(),
    eventIdOrTitle: z.string()
  }, (args) => service.checkEventRegistrationStatus(args.studentId, args.eventIdOrTitle));
  registerJsonTool(server, "register_for_event", "Register a student for an event.", {
    studentId: z.string(),
    eventIdOrTitle: z.string()
  }, (args) => service.registerForEvent(args.studentId, args.eventIdOrTitle));
  registerJsonTool(server, "cancel_event_registration", "Cancel a student's event registration.", {
    studentId: z.string(),
    eventIdOrTitle: z.string()
  }, (args) => service.cancelEventRegistration(args.studentId, args.eventIdOrTitle));
  registerJsonTool(server, "get_my_registered_events", "Get events a student has registered for.", {
    studentId: z.string()
  }, (args) => service.getMyRegisteredEvents(args.studentId));
  registerJsonTool(server, "get_club_details", "Get club details and its events.", {
    clubIdOrName: z.string()
  }, (args) => service.getClubDetails(args.clubIdOrName));
  registerJsonTool(server, "search_clubs", "Search campus clubs.", {
    query: z.string().default("")
  }, (args) => service.searchClubs(args.query));
  registerJsonTool(server, "create_event", "Admin: create a campus event.", eventInput, (args) => service.createEvent(args));
  registerJsonTool(server, "update_event", "Admin: update a campus event.", {
    eventId: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updateEvent(args.eventId, args.patch));
  registerJsonTool(server, "delete_event", "Admin: delete a campus event.", {
    eventId: z.string()
  }, (args) => service.deleteEvent(args.eventId));
  registerJsonTool(server, "create_club", "Admin: create a campus club.", {
    name: z.string(),
    category: z.string(),
    description: z.string(),
    contactEmail: z.string().email()
  }, (args) => service.createClub(args));
  registerJsonTool(server, "update_club", "Admin: update a campus club.", {
    clubId: z.string(),
    patch: z.object({
      name: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      contactEmail: z.string().email().optional()
    })
  }, (args) => service.updateClub(args.clubId, args.patch));
  registerJsonTool(server, "create_event_session", "Admin: create an event session.", {
    eventId: z.string(),
    title: z.string(),
    startsAt: z.string(),
    endsAt: z.string(),
    speaker: z.string(),
    room: z.string()
  }, (args) => service.createEventSession(args));
  registerJsonTool(server, "update_event_session", "Admin: update an event session.", {
    sessionId: z.string(),
    patch: z.object({
      eventId: z.string().optional(),
      title: z.string().optional(),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      speaker: z.string().optional(),
      room: z.string().optional()
    })
  }, (args) => service.updateEventSession(args.sessionId, args.patch));
  registerJsonTool(server, "mark_event_cancelled", "Admin: mark an event as cancelled.", {
    eventId: z.string(),
    reason: z.string().optional()
  }, (args) => service.markEventCancelled(args.eventId, args.reason));
  registerJsonTool(server, "create_event_announcement", "Admin: publish an event announcement.", {
    eventId: z.string(),
    title: z.string(),
    body: z.string()
  }, (args) => service.createEventAnnouncement(args.eventId, args.title, args.body));
}
