import type { CafeteriaMenuItem, DailyMenu } from "@campus/shared";
import { CafeteriaRepository } from "./repository.js";

const present = <T>(value: T | undefined | null): value is T => value !== undefined && value !== null;

export class CafeteriaService {
  constructor(private readonly repo: CafeteriaRepository) {}

  getTodayMenu() {
    return this.menuResponse(this.repo.getTodayMenu());
  }

  getMenuByDate(date: string) {
    return this.menuResponse(this.repo.getMenuForDate(date));
  }

  getWeeklyMenu() {
    return {
      source: "cafeteria",
      menus: this.repo.listWeeklyMenus().map((menu) => this.expandMenu(menu))
    };
  }

  getBreakfastMenu(date?: string) {
    return this.mealResponse("breakfast", date);
  }

  getLunchMenu(date?: string) {
    return this.mealResponse("lunch", date);
  }

  getDinnerMenu(date?: string) {
    return this.mealResponse("dinner", date);
  }

  searchFoodItems(query = "") {
    const items = this.repo.searchItems(query).map((item) => this.withCounter(item));
    return { source: "cafeteria", count: items.length, items };
  }

  filterMenuByDiet(diet: CafeteriaMenuItem["diet"], date?: string) {
    const menu = date ? this.repo.getMenuForDate(date) : this.repo.getTodayMenu();
    const items = this.expandMenu(menu).allItems.filter((item) => item.diet === diet);
    return { source: "cafeteria", diet, count: items.length, items };
  }

  filterMenuByAllergen(allergen: string, date?: string, mode: "exclude" | "include" = "exclude") {
    const menu = date ? this.repo.getMenuForDate(date) : this.repo.getTodayMenu();
    const lower = allergen.toLowerCase();
    const items = this.expandMenu(menu).allItems.filter((item) => {
      const hasAllergen = item.allergens.map((entry) => entry.toLowerCase()).includes(lower);
      return mode === "include" ? hasAllergen : !hasAllergen;
    });
    return { source: "cafeteria", allergen, mode, count: items.length, items };
  }

  getFoodItemDetails(itemIdOrName: string) {
    const item = this.repo.getItem(itemIdOrName);
    return item ? { source: "cafeteria", item: this.withCounter(item) } : { source: "cafeteria", error: "Food item not found" };
  }

  getFoodNutrition(itemIdOrName: string) {
    const item = this.repo.getItem(itemIdOrName);
    return item
      ? {
          source: "cafeteria",
          item: item.name,
          nutrition: {
            calories: item.calories,
            proteinGrams: item.proteinGrams,
            allergens: item.allergens,
            diet: item.diet
          }
        }
      : { source: "cafeteria", error: "Food item not found" };
  }

  getFoodPrice(itemIdOrName: string) {
    const item = this.repo.getItem(itemIdOrName);
    return item ? { source: "cafeteria", item: item.name, price: item.price } : { source: "cafeteria", error: "Food item not found" };
  }

  getAvailableCounters() {
    const counters = this.repo.listCounters().map((counter) => ({
      ...counter,
      availableItems: this.repo.listItems().filter((item) => item.counterId === counter.id && item.isAvailable).length
    }));
    return { source: "cafeteria", counters };
  }

  getCounterTimings(counterId?: string) {
    const counters = counterId ? this.repo.listCounters().filter((counter) => counter.id === counterId) : this.repo.listCounters();
    return { source: "cafeteria", counters };
  }

  getCafeteriaHours() {
    return {
      source: "cafeteria",
      hours: {
        weekdays: "07:00-23:00",
        weekends: "08:00-22:00",
        lateNightCafe: "Cafe Lab open until 23:00"
      },
      counters: this.repo.listCounters(),
      notices: this.repo.listNotices()
    };
  }

  getTodaySpecials() {
    const menu = this.repo.getTodayMenu();
    return {
      source: "cafeteria",
      dayOfWeek: menu.dayOfWeek,
      specials: menu.specials.map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item))
    };
  }

  getLowCostMeals(maxPrice = 70) {
    const items = this.repo.listItems().filter((item) => item.price <= maxPrice && item.isAvailable);
    return { source: "cafeteria", maxPrice, count: items.length, items: items.map((item) => this.withCounter(item)) };
  }

  getVegMenu(date?: string) {
    return this.filterMenuByDiet("veg", date);
  }

  getNonVegMenu(date?: string) {
    return this.filterMenuByDiet("non-veg", date);
  }

  getJainMenu(date?: string) {
    return this.filterMenuByDiet("jain", date);
  }

  getStudentFavoriteItems(studentId: string) {
    const items = this.repo.getFavoriteItems(studentId).filter(present).map((item) => this.withCounter(item));
    return { source: "cafeteria", studentId, items };
  }

  rateFoodItem(studentId: string, itemId: string, rating: number, message = "") {
    const item = this.repo.getItem(itemId);
    if (!item) return { source: "cafeteria", error: "Food item not found" };
    return { source: "cafeteria", feedback: this.repo.rateItem(studentId, item.id, rating, message) };
  }

  submitMenuFeedback(studentId: string, message: string, itemId?: string) {
    return { source: "cafeteria", feedback: this.repo.submitFeedback(studentId, message, itemId) };
  }

  createMenuItem(input: Omit<CafeteriaMenuItem, "id">) {
    return { source: "cafeteria", item: this.repo.createMenuItem(input) };
  }

  updateMenuItem(itemId: string, patch: Partial<CafeteriaMenuItem>) {
    const item = this.repo.updateMenuItem(itemId, patch);
    return item ? { source: "cafeteria", item } : { source: "cafeteria", error: "Food item not found" };
  }

  deleteMenuItem(itemId: string) {
    return { source: "cafeteria", deleted: this.repo.deleteMenuItem(itemId) };
  }

  createDailyMenu(input: DailyMenu) {
    return { source: "cafeteria", menu: this.repo.createDailyMenu(input) };
  }

  updateDailyMenu(dayOfWeek: string, patch: Partial<DailyMenu>) {
    const menu = this.repo.updateDailyMenu(dayOfWeek, patch);
    return menu ? { source: "cafeteria", menu } : { source: "cafeteria", error: "Menu not found" };
  }

  markItemUnavailable(itemId: string, reason?: string) {
    const item = this.repo.setAvailability(itemId, false);
    return item ? { source: "cafeteria", item, reason } : { source: "cafeteria", error: "Food item not found" };
  }

  createCounter(input: { name: string; opensAt: string; closesAt: string; location: string }) {
    return { source: "cafeteria", counter: this.repo.createCounter(input) };
  }

  updateCounter(counterId: string, patch: { name?: string; opensAt?: string; closesAt?: string; location?: string }) {
    const counter = this.repo.updateCounter(counterId, patch);
    return counter ? { source: "cafeteria", counter } : { source: "cafeteria", error: "Counter not found" };
  }

  createCafeteriaNotice(title: string, body: string) {
    return { source: "cafeteria", notice: this.repo.createNotice({ title, body }) };
  }

  private mealResponse(meal: "breakfast" | "lunch" | "dinner", date?: string) {
    const menu = date ? this.repo.getMenuForDate(date) : this.repo.getTodayMenu();
    const items = menu[meal].map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item));
    return { source: "cafeteria", dayOfWeek: menu.dayOfWeek, meal, items };
  }

  private menuResponse(menu: DailyMenu) {
    return { source: "cafeteria", menu: this.expandMenu(menu) };
  }

  private expandMenu(menu: DailyMenu) {
    const breakfast = menu.breakfast.map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item));
    const lunch = menu.lunch.map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item));
    const dinner = menu.dinner.map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item));
    const specials = menu.specials.map((id) => this.repo.getItem(id)).filter(present).map((item) => this.withCounter(item));
    return {
      ...menu,
      breakfast,
      lunch,
      dinner,
      specials,
      allItems: [...breakfast, ...lunch, ...dinner, ...specials]
    };
  }

  private withCounter(item: CafeteriaMenuItem) {
    return { ...item, counter: this.repo.getCounter(item.counterId) };
  }
}
