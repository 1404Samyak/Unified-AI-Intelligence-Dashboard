import type { ToolExecutionResult } from "./types.js";

const summarizeValue = (value: unknown) => {
  if (!value || typeof value !== "object") return String(value ?? "");
  const record = value as Record<string, unknown>;

  if (record.error) return `Error: ${record.error}`;

  if (typeof record.count === "number" && record.count === 0) return "";

  if (Array.isArray(record.books)) {
    return record.books
      .slice(0, 4)
      .map((book) => {
        const item = book as { title?: string; availability?: { availableCopies?: number; totalCopies?: number } };
        const availability = item.availability
          ? ` (${item.availability.availableCopies}/${item.availability.totalCopies} available)`
          : "";
        return `${item.title ?? "Book"}${availability}`;
      })
      .join("; ");
  }

  if (record.available !== undefined && record.book && typeof record.book === "object") {
    const book = record.book as { title?: string };
    return `${book.title ?? "Book"} is ${record.available ? "available" : "not available"}.`;
  }

  if (record.menu && typeof record.menu === "object") {
    const menu = record.menu as {
      dayOfWeek?: string;
      breakfast?: Array<{ name?: string }>;
      lunch?: Array<{ name?: string }>;
      dinner?: Array<{ name?: string }>;
      specials?: Array<{ name?: string }>;
    };
    const meal = (label: string, items?: Array<{ name?: string }>) => {
      const names = items?.map((item) => item.name).filter(Boolean);
      return names?.length ? `${label}: ${names.join(", ")}` : "";
    };
    return [menu.dayOfWeek ? `${menu.dayOfWeek} menu` : "Today's menu", meal("Breakfast", menu.breakfast), meal("Lunch", menu.lunch), meal("Dinner", menu.dinner), meal("Specials", menu.specials)]
      .filter(Boolean)
      .join(". ");
  }

  if (Array.isArray(record.items)) {
    return record.items
      .slice(0, 5)
      .map((item) => (typeof item === "object" && item ? String((item as { name?: string }).name ?? "item") : String(item)))
      .join("; ");
  }

  if (Array.isArray(record.events)) {
    return record.events
      .slice(0, 4)
      .map((event) => {
        const item = event as { title?: string; startsAt?: string; venue?: string };
        const time = item.startsAt ? new Date(item.startsAt).toLocaleString() : "";
        return `${item.title ?? "Event"}${time ? ` at ${time}` : ""}${item.venue ? ` in ${item.venue}` : ""}`;
      })
      .join("; ");
  }

  if (record.policy && typeof record.policy === "object") {
    const policy = record.policy as { title?: string; body?: string };
    return `${policy.title}: ${policy.body}`;
  }

  if (Array.isArray(record.courses)) {
    return record.courses
      .slice(0, 4)
      .map((course) => {
        const item = course as { code?: string; title?: string; credits?: number };
        return `${item.code} ${item.title} (${item.credits} credits)`;
      })
      .join("; ");
  }

  if (record.course && typeof record.course === "object") {
    const course = record.course as { code?: string; title?: string; credits?: number; description?: string };
    return `${course.code} ${course.title}: ${course.description ?? ""} Credits: ${course.credits ?? "N/A"}.`;
  }

  if (Array.isArray(record.notices)) {
    return record.notices
      .slice(0, 3)
      .map((notice) => (typeof notice === "object" && notice ? String((notice as { title?: string }).title ?? "notice") : String(notice)))
      .join("; ");
  }

  return JSON.stringify(value).slice(0, 500);
};

export function composeFallbackAnswer(message: string, results: ToolExecutionResult[]) {
  const successful = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);

  if (successful.length === 0) {
    return `I could not retrieve the campus information right now. ${failed.map((item) => item.error).filter(Boolean).join(" ")}`;
  }

  const lines = successful.map((result) => summarizeValue(result.data)).filter((line) => line.trim().length > 0);

  const failures = failed.length
    ? "\n\nSome related information could not be retrieved right now."
    : "";

  if (lines.length === 0) {
    return `I could not find a matching campus result for "${message}".${failures}`;
  }

  return `${lines.join("\n")}${failures}`;
}
