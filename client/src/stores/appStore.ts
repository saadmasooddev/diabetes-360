import { MealDetails } from "@/services/foodScannerService";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type MealInfo = {
	meal?: MealDetails;
	mealType?: string;
};

interface AppState {
	setMeal: (data: MealInfo) => void;
	mealInfo: MealInfo;
	medicationInfo: { consultationId?: string };
	setMedicationInfo: (data: { consultationId?: string }) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set): AppState => ({
			mealInfo: {
				meal: undefined,
				mealType: undefined,
			},
			setMeal: (data: MealInfo) => set({ mealInfo: data }),
			medicationInfo: {
				consultationId: undefined,
			},
			setMedicationInfo: (data) => set({ medicationInfo: data }),
		}),
		{
			name: "app-storage",
			partialize: (state) => ({
				mealInfo: state.mealInfo,
			}),
		},
	),
);
