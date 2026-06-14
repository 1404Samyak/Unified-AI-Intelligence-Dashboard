import { registerJsonTool } from "@campus/mcp-common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CafeteriaService } from "./service.js";

const diet = z.enum(["veg", "non-veg", "jain", "vegan"]);
const category = z.enum(["breakfast", "lunch", "dinner", "snack", "beverage"]);

const menuItemInput = {
  name: z.string(),
  category,
  diet,
  allergens: z.array(z.string()).default([]),
  calories: z.number().int().min(0).default(0),
  proteinGrams: z.number().min(0).default(0),
  price: z.number().min(0),
  counterId: z.string(),
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string()).default([])
};

export function registerCafeteriaTools(server: McpServer, service: CafeteriaService) {
  registerJsonTool(server, "get_today_menu", "Get today's full cafeteria menu.", {}, () => service.getTodayMenu());
  registerJsonTool(server, "get_menu_by_date", "Get cafeteria menu for a date or weekday.", {
    date: z.string()
  }, (args) => service.getMenuByDate(args.date));
  registerJsonTool(server, "get_weekly_menu", "Get the weekly cafeteria menu template.", {}, () => service.getWeeklyMenu());
  registerJsonTool(server, "get_breakfast_menu", "Get breakfast menu for today or a given date.", {
    date: z.string().optional()
  }, (args) => service.getBreakfastMenu(args.date));
  registerJsonTool(server, "get_lunch_menu", "Get lunch menu for today or a given date.", {
    date: z.string().optional()
  }, (args) => service.getLunchMenu(args.date));
  registerJsonTool(server, "get_dinner_menu", "Get dinner menu for today or a given date.", {
    date: z.string().optional()
  }, (args) => service.getDinnerMenu(args.date));
  registerJsonTool(server, "search_food_items", "Search cafeteria food items by name, tag, diet, or allergen.", {
    query: z.string().default("")
  }, (args) => service.searchFoodItems(args.query));
  registerJsonTool(server, "filter_menu_by_diet", "Filter current or dated menu by diet preference.", {
    diet,
    date: z.string().optional()
  }, (args) => service.filterMenuByDiet(args.diet, args.date));
  registerJsonTool(server, "filter_menu_by_allergen", "Include or exclude menu items with a given allergen.", {
    allergen: z.string(),
    date: z.string().optional(),
    mode: z.enum(["exclude", "include"]).default("exclude")
  }, (args) => service.filterMenuByAllergen(args.allergen, args.date, args.mode));
  registerJsonTool(server, "get_food_item_details", "Get full details for a food item.", {
    itemIdOrName: z.string()
  }, (args) => service.getFoodItemDetails(args.itemIdOrName));
  registerJsonTool(server, "get_food_nutrition", "Get calories, protein, allergens, and diet info for a food item.", {
    itemIdOrName: z.string()
  }, (args) => service.getFoodNutrition(args.itemIdOrName));
  registerJsonTool(server, "get_food_price", "Get price for a food item.", {
    itemIdOrName: z.string()
  }, (args) => service.getFoodPrice(args.itemIdOrName));
  registerJsonTool(server, "get_available_counters", "List cafeteria counters and available item counts.", {}, () => service.getAvailableCounters());
  registerJsonTool(server, "get_counter_timings", "Get counter timings for all counters or one counter.", {
    counterId: z.string().optional()
  }, (args) => service.getCounterTimings(args.counterId));
  registerJsonTool(server, "get_cafeteria_hours", "Get cafeteria operating hours and notices.", {}, () => service.getCafeteriaHours());
  registerJsonTool(server, "get_today_specials", "Get today's cafeteria specials.", {}, () => service.getTodaySpecials());
  registerJsonTool(server, "get_low_cost_meals", "Find available meals under a maximum price.", {
    maxPrice: z.number().min(0).default(70)
  }, (args) => service.getLowCostMeals(args.maxPrice));
  registerJsonTool(server, "get_veg_menu", "Get vegetarian menu items.", {
    date: z.string().optional()
  }, (args) => service.getVegMenu(args.date));
  registerJsonTool(server, "get_non_veg_menu", "Get non-vegetarian menu items.", {
    date: z.string().optional()
  }, (args) => service.getNonVegMenu(args.date));
  registerJsonTool(server, "get_jain_menu", "Get Jain menu items.", {
    date: z.string().optional()
  }, (args) => service.getJainMenu(args.date));
  registerJsonTool(server, "get_student_favorite_items", "Get food items a student commonly likes or orders.", {
    studentId: z.string()
  }, (args) => service.getStudentFavoriteItems(args.studentId));
  registerJsonTool(server, "rate_food_item", "Submit a rating for a food item.", {
    studentId: z.string(),
    itemId: z.string(),
    rating: z.number().min(1).max(5),
    message: z.string().default("")
  }, (args) => service.rateFoodItem(args.studentId, args.itemId, args.rating, args.message));
  registerJsonTool(server, "submit_menu_feedback", "Submit cafeteria menu feedback.", {
    studentId: z.string(),
    message: z.string(),
    itemId: z.string().optional()
  }, (args) => service.submitMenuFeedback(args.studentId, args.message, args.itemId));
  registerJsonTool(server, "create_menu_item", "Admin: create a cafeteria menu item.", menuItemInput, (args) => service.createMenuItem(args));
  registerJsonTool(server, "update_menu_item", "Admin: update a cafeteria menu item.", {
    itemId: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updateMenuItem(args.itemId, args.patch));
  registerJsonTool(server, "delete_menu_item", "Admin: delete a cafeteria menu item.", {
    itemId: z.string()
  }, (args) => service.deleteMenuItem(args.itemId));
  registerJsonTool(server, "create_daily_menu", "Admin: create a daily menu.", {
    date: z.string(),
    dayOfWeek: z.string(),
    breakfast: z.array(z.string()).default([]),
    lunch: z.array(z.string()).default([]),
    dinner: z.array(z.string()).default([]),
    specials: z.array(z.string()).default([])
  }, (args) => service.createDailyMenu(args));
  registerJsonTool(server, "update_daily_menu", "Admin: update a daily menu.", {
    dayOfWeek: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updateDailyMenu(args.dayOfWeek, args.patch));
  registerJsonTool(server, "mark_item_unavailable", "Admin: mark a menu item unavailable.", {
    itemId: z.string(),
    reason: z.string().optional()
  }, (args) => service.markItemUnavailable(args.itemId, args.reason));
  registerJsonTool(server, "create_counter", "Admin: create a cafeteria counter.", {
    name: z.string(),
    opensAt: z.string(),
    closesAt: z.string(),
    location: z.string()
  }, (args) => service.createCounter(args));
  registerJsonTool(server, "update_counter", "Admin: update cafeteria counter details.", {
    counterId: z.string(),
    patch: z.object({
      name: z.string().optional(),
      opensAt: z.string().optional(),
      closesAt: z.string().optional(),
      location: z.string().optional()
    })
  }, (args) => service.updateCounter(args.counterId, args.patch));
  registerJsonTool(server, "create_cafeteria_notice", "Admin: publish a cafeteria notice.", {
    title: z.string(),
    body: z.string()
  }, (args) => service.createCafeteriaNotice(args.title, args.body));
}
