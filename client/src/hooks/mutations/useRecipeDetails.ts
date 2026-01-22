import { useMutation } from "@tanstack/react-query";
import { foodScannerService } from "@/services/foodScannerService";
import { useToast } from "@/hooks/use-toast";

export interface RecipeDetailsPayload {
	name: string;
	mealType: string;
	nutrition_info: {
		carbs: number;
		proteins: number;
		calories: number;
	};
}

export function useRecipeDetails() {
	const { toast } = useToast();

	return useMutation({
		mutationKey: ["recipe-details"],
		mutationFn: (payload: RecipeDetailsPayload) =>
			foodScannerService.getRecipeDetails(payload),
		onError: (error: any) => {
			toast({
				title: "Recipe unavailable",
				description: error?.message || "Unable to fetch recipe details.",
				variant: "destructive",
			});
		},
	});
}
