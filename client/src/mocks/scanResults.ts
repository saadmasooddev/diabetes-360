export interface NutritionInfo {
  name: string;
  amount: string;
  percentage?: string;
}

export interface ScanResult {
  foodName: string;
  servingSize: string;
  calories: string;
  macros: NutritionInfo[];
  vitamins: NutritionInfo[];
  minerals: NutritionInfo[];
}

export const mockScanResult: ScanResult = {
  foodName: "Mixed Vegetable Salad",
  servingSize: "1 bowl (250g)",
  calories: "120 kcal",
  macros: [
    { name: "Carbohydrates", amount: "18g", percentage: "6%" },
    { name: "Protein", amount: "4g", percentage: "8%" },
    { name: "Fat", amount: "4g", percentage: "6%" },
    { name: "Fiber", amount: "6g", percentage: "24%" },
  ],
  vitamins: [
    { name: "Vitamin A", amount: "850 IU", percentage: "17%" },
    { name: "Vitamin C", amount: "45mg", percentage: "75%" },
    { name: "Vitamin K", amount: "120mcg", percentage: "150%" },
  ],
  minerals: [
    { name: "Calcium", amount: "80mg", percentage: "8%" },
    { name: "Iron", amount: "2mg", percentage: "11%" },
    { name: "Potassium", amount: "450mg", percentage: "13%" },
  ],
};
