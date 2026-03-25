import { relations } from "drizzle-orm/relations";
import { users, healthMetricTargets, foodScanLogs, physicianRatings, passwordResetTokens, dailyMealPlans, mealPlanMeals, availabilityDate, slots, slotSize, bookedSlots, medications, recipes, physicianLocations, slotLocations, slotPrice, slotType, foodScanNutrients, physicianSpecialties, physicianData, twoFactorAuth, timeZones, loggedMeals, chatMessages, dailyHealthSummaries, chatMemories, hba1CMetrics, userEmotionalState, dailyQuickLogs, slotTypeJunction } from "./schema";

export const healthMetricTargetsRelations = relations(healthMetricTargets, ({one}) => ({
	user: one(users, {
		fields: [healthMetricTargets.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	healthMetricTargets: many(healthMetricTargets),
	foodScanLogs: many(foodScanLogs),
	physicianRatings_customerId: many(physicianRatings, {
		relationName: "physicianRatings_customerId_users_id"
	}),
	physicianRatings_physicianId: many(physicianRatings, {
		relationName: "physicianRatings_physicianId_users_id"
	}),
	passwordResetTokens: many(passwordResetTokens),
	foodScanNutrients: many(foodScanNutrients),
	availabilityDates: many(availabilityDate),
	twoFactorAuths: many(twoFactorAuth),
	loggedMeals: many(loggedMeals),
	chatMessages: many(chatMessages),
	dailyHealthSummaries: many(dailyHealthSummaries),
	chatMemories: many(chatMemories),
	hba1CMetrics: many(hba1CMetrics),
	userEmotionalStates: many(userEmotionalState),
	dailyQuickLogs: many(dailyQuickLogs),
}));

export const foodScanLogsRelations = relations(foodScanLogs, ({one}) => ({
	user: one(users, {
		fields: [foodScanLogs.userId],
		references: [users.id]
	}),
}));

export const physicianRatingsRelations = relations(physicianRatings, ({one}) => ({
	user_customerId: one(users, {
		fields: [physicianRatings.customerId],
		references: [users.id],
		relationName: "physicianRatings_customerId_users_id"
	}),
	user_physicianId: one(users, {
		fields: [physicianRatings.physicianId],
		references: [users.id],
		relationName: "physicianRatings_physicianId_users_id"
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const mealPlanMealsRelations = relations(mealPlanMeals, ({one, many}) => ({
	dailyMealPlan: one(dailyMealPlans, {
		fields: [mealPlanMeals.mealPlanId],
		references: [dailyMealPlans.id]
	}),
	recipes: many(recipes),
}));

export const dailyMealPlansRelations = relations(dailyMealPlans, ({many}) => ({
	mealPlanMeals: many(mealPlanMeals),
}));

export const slotsRelations = relations(slots, ({one, many}) => ({
	availabilityDate: one(availabilityDate, {
		fields: [slots.availabilityId],
		references: [availabilityDate.id]
	}),
	slotSize: one(slotSize, {
		fields: [slots.slotSizeId],
		references: [slotSize.id]
	}),
	slotLocations: many(slotLocations),
	slotPrices: many(slotPrice),
	bookedSlots: many(bookedSlots),
	slotTypeJunctions: many(slotTypeJunction),
}));

export const availabilityDateRelations = relations(availabilityDate, ({one, many}) => ({
	slots: many(slots),
	user: one(users, {
		fields: [availabilityDate.physicianId],
		references: [users.id]
	}),
}));

export const slotSizeRelations = relations(slotSize, ({many}) => ({
	slots: many(slots),
}));

export const medicationsRelations = relations(medications, ({one}) => ({
	bookedSlot: one(bookedSlots, {
		fields: [medications.consultationId],
		references: [bookedSlots.id]
	}),
}));

export const bookedSlotsRelations = relations(bookedSlots, ({one, many}) => ({
	medications: many(medications),
	slot: one(slots, {
		fields: [bookedSlots.slotId],
		references: [slots.id]
	}),
	slotType: one(slotType, {
		fields: [bookedSlots.slotTypeId],
		references: [slotType.id]
	}),
}));

export const recipesRelations = relations(recipes, ({one}) => ({
	mealPlanMeal: one(mealPlanMeals, {
		fields: [recipes.mealId],
		references: [mealPlanMeals.id]
	}),
}));

export const slotLocationsRelations = relations(slotLocations, ({one}) => ({
	physicianLocation: one(physicianLocations, {
		fields: [slotLocations.locationId],
		references: [physicianLocations.id]
	}),
	slot: one(slots, {
		fields: [slotLocations.slotId],
		references: [slots.id]
	}),
}));

export const physicianLocationsRelations = relations(physicianLocations, ({many}) => ({
	slotLocations: many(slotLocations),
}));

export const slotPriceRelations = relations(slotPrice, ({one}) => ({
	slot: one(slots, {
		fields: [slotPrice.slotId],
		references: [slots.id]
	}),
	slotType: one(slotType, {
		fields: [slotPrice.slotTypeId],
		references: [slotType.id]
	}),
}));

export const slotTypeRelations = relations(slotType, ({many}) => ({
	slotPrices: many(slotPrice),
	bookedSlots: many(bookedSlots),
	slotTypeJunctions: many(slotTypeJunction),
}));

export const foodScanNutrientsRelations = relations(foodScanNutrients, ({one}) => ({
	user: one(users, {
		fields: [foodScanNutrients.userId],
		references: [users.id]
	}),
}));

export const physicianDataRelations = relations(physicianData, ({one}) => ({
	physicianSpecialty: one(physicianSpecialties, {
		fields: [physicianData.specialtyId],
		references: [physicianSpecialties.id]
	}),
}));

export const physicianSpecialtiesRelations = relations(physicianSpecialties, ({many}) => ({
	physicianData: many(physicianData),
}));

export const twoFactorAuthRelations = relations(twoFactorAuth, ({one}) => ({
	user: one(users, {
		fields: [twoFactorAuth.userId],
		references: [users.id]
	}),
}));

export const loggedMealsRelations = relations(loggedMeals, ({one}) => ({
	timeZone: one(timeZones, {
		fields: [loggedMeals.timeZoneId],
		references: [timeZones.id]
	}),
	user: one(users, {
		fields: [loggedMeals.userId],
		references: [users.id]
	}),
}));

export const timeZonesRelations = relations(timeZones, ({many}) => ({
	loggedMeals: many(loggedMeals),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
}));

export const dailyHealthSummariesRelations = relations(dailyHealthSummaries, ({one}) => ({
	user: one(users, {
		fields: [dailyHealthSummaries.userId],
		references: [users.id]
	}),
}));

export const chatMemoriesRelations = relations(chatMemories, ({one}) => ({
	user: one(users, {
		fields: [chatMemories.userId],
		references: [users.id]
	}),
}));

export const hba1CMetricsRelations = relations(hba1CMetrics, ({one}) => ({
	user: one(users, {
		fields: [hba1CMetrics.userId],
		references: [users.id]
	}),
}));

export const userEmotionalStateRelations = relations(userEmotionalState, ({one}) => ({
	user: one(users, {
		fields: [userEmotionalState.userId],
		references: [users.id]
	}),
}));

export const dailyQuickLogsRelations = relations(dailyQuickLogs, ({one}) => ({
	user: one(users, {
		fields: [dailyQuickLogs.userId],
		references: [users.id]
	}),
}));

export const slotTypeJunctionRelations = relations(slotTypeJunction, ({one}) => ({
	slot: one(slots, {
		fields: [slotTypeJunction.slotId],
		references: [slots.id]
	}),
	slotType: one(slotType, {
		fields: [slotTypeJunction.slotTypeId],
		references: [slotType.id]
	}),
}));