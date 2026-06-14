import { randomUUID } from "node:crypto";
import { tryQuery } from "@campus/db";
import {
  cafeteriaCounters,
  cafeteriaItems,
  weeklyMenus,
  type CafeteriaCounter,
  type CafeteriaMenuItem,
  type DailyMenu
} from "@campus/shared";

const normalize = (value: string) => value.trim().toLowerCase();

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export type MenuFeedback = {
  id: string;
  studentId: string;
  itemId?: string;
  rating?: number;
  message: string;
  createdAt: string;
};

export class CafeteriaRepository {
  private items = [...cafeteriaItems];
  private counters = [...cafeteriaCounters];
  private menus = [...weeklyMenus];
  private feedback: MenuFeedback[] = [];
  private favoriteItems = new Map<string, string[]>([
    ["stu-1001", ["food-paneer-wrap", "food-tea", "food-samosa"]]
  ]);
  private notices = [
    {
      id: "notice-cafe-rush",
      title: "Lunch rush advisory",
      body: "Main Meals counter is busiest between 12:45 PM and 1:30 PM.",
      createdAt: new Date().toISOString()
    }
  ];

  async loadFromDatabase() {
    const [counters, items, menus, feedback] = await Promise.all([
      tryQuery<CafeteriaCounter>("SELECT id, name, opens_at as \"opensAt\", closes_at as \"closesAt\", location FROM cafeteria.counters ORDER BY name"),
      tryQuery<{
        id: string;
        name: string;
        category: CafeteriaMenuItem["category"];
        diet: CafeteriaMenuItem["diet"];
        allergens: string[];
        calories: number;
        proteinGrams: string | number;
        price: string | number;
        counterId: string;
        isAvailable: boolean;
        tags: string[];
      }>(
        'SELECT id, name, category, diet, allergens, calories, protein_grams as "proteinGrams", price, counter_id as "counterId", is_available as "isAvailable", tags FROM cafeteria.menu_items ORDER BY name'
      ),
      tryQuery<{
        id: string;
        menuDate: Date;
        dayOfWeek: string;
        breakfast: string[];
        lunch: string[];
        dinner: string[];
        specials: string[];
      }>('SELECT id, menu_date as "menuDate", day_of_week as "dayOfWeek", breakfast, lunch, dinner, specials FROM cafeteria.daily_menus ORDER BY menu_date'),
      tryQuery<MenuFeedback>('SELECT id, student_id as "studentId", item_id as "itemId", rating, message, created_at as "createdAt" FROM cafeteria.feedback ORDER BY created_at DESC')
    ]);

    if (counters?.rows.length) {
      this.counters = counters.rows;
    }

    if (items?.rows.length) {
      this.items = items.rows.map((item) => ({
        ...item,
        proteinGrams: Number(item.proteinGrams),
        price: Number(item.price)
      }));
    }

    if (menus?.rows.length) {
      this.menus = menus.rows.map((menu) => ({
        date: menu.menuDate.toISOString().slice(0, 10),
        dayOfWeek: menu.dayOfWeek,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner,
        specials: menu.specials
      }));
    }

    if (feedback?.rows.length) {
      this.feedback = feedback.rows.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt).toISOString()
      }));
    }
  }

  getTodayMenu() {
    return this.getMenuForDate(new Date().toISOString());
  }

  getMenuForDate(date: string) {
    const parsed = new Date(date);
    const day = Number.isNaN(parsed.getTime()) ? normalize(date) : dayNames[parsed.getDay()];
    return this.menus.find((menu) => menu.dayOfWeek === day) ?? this.menus[0];
  }

  listWeeklyMenus() {
    return this.menus;
  }

  getItem(itemIdOrName: string) {
    const needle = normalize(itemIdOrName);
    return this.items.find((item) => item.id === itemIdOrName || normalize(item.name).includes(needle));
  }

  listItems() {
    return this.items;
  }

  searchItems(query = "") {
    const needle = normalize(query);
    return this.items.filter((item) => {
      if (!query) return true;
      return [
        item.name,
        item.category,
        item.diet,
        ...item.tags,
        ...item.allergens
      ].some((value) => normalize(value).includes(needle));
    });
  }

  listCounters() {
    return this.counters;
  }

  getCounter(counterId: string) {
    return this.counters.find((counter) => counter.id === counterId);
  }

  getFavoriteItems(studentId: string) {
    const ids = this.favoriteItems.get(studentId) ?? [];
    return ids.map((id) => this.getItem(id)).filter(Boolean);
  }

  rateItem(studentId: string, itemId: string, rating: number, message = "") {
    const feedback: MenuFeedback = {
      id: `feedback-${randomUUID()}`,
      studentId,
      itemId,
      rating,
      message,
      createdAt: new Date().toISOString()
    };
    this.feedback.push(feedback);
    return feedback;
  }

  submitFeedback(studentId: string, message: string, itemId?: string) {
    const feedback: MenuFeedback = {
      id: `feedback-${randomUUID()}`,
      studentId,
      itemId,
      message,
      createdAt: new Date().toISOString()
    };
    this.feedback.push(feedback);
    return feedback;
  }

  createMenuItem(input: Omit<CafeteriaMenuItem, "id">) {
    const item = { ...input, id: `food-${randomUUID()}` };
    this.items.push(item);
    return item;
  }

  updateMenuItem(itemId: string, patch: Partial<CafeteriaMenuItem>) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) return undefined;
    Object.assign(item, patch, { id: item.id });
    return item;
  }

  deleteMenuItem(itemId: string) {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== itemId);
    this.menus = this.menus.map((menu) => ({
      ...menu,
      breakfast: menu.breakfast.filter((id) => id !== itemId),
      lunch: menu.lunch.filter((id) => id !== itemId),
      dinner: menu.dinner.filter((id) => id !== itemId),
      specials: menu.specials.filter((id) => id !== itemId)
    }));
    return before !== this.items.length;
  }

  createDailyMenu(input: DailyMenu) {
    this.menus.push(input);
    return input;
  }

  updateDailyMenu(dayOfWeek: string, patch: Partial<DailyMenu>) {
    const menu = this.menus.find((entry) => entry.dayOfWeek === normalize(dayOfWeek));
    if (!menu) return undefined;
    Object.assign(menu, patch, { dayOfWeek: menu.dayOfWeek });
    return menu;
  }

  setAvailability(itemId: string, isAvailable: boolean) {
    return this.updateMenuItem(itemId, { isAvailable });
  }

  createCounter(input: Omit<CafeteriaCounter, "id">) {
    const counter = { ...input, id: `counter-${randomUUID()}` };
    this.counters.push(counter);
    return counter;
  }

  updateCounter(counterId: string, patch: Partial<CafeteriaCounter>) {
    const counter = this.counters.find((entry) => entry.id === counterId);
    if (!counter) return undefined;
    Object.assign(counter, patch, { id: counter.id });
    return counter;
  }

  createNotice(input: { title: string; body: string }) {
    const notice = { id: `notice-${randomUUID()}`, ...input, createdAt: new Date().toISOString() };
    this.notices.push(notice);
    return notice;
  }

  listNotices() {
    return this.notices;
  }
}
