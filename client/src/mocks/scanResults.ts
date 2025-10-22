export interface BreakdownItem {
  name: string;
  value: string | number;
  unit: string;
  position: number; // Position on progress bar (0-100)
  status: 'good' | 'average' | 'danger';
  isLocked?: boolean;
  isGrayed?: boolean;
}

export interface ScanResult {
  foodName: string;
  foodCategory: string;
  foodImage: string; // Will use the uploaded image
  breakdown: {
    carbs: BreakdownItem;
    fiber: BreakdownItem;
    sugars: BreakdownItem;
    protein: BreakdownItem;
    fat: BreakdownItem;
    calories: BreakdownItem;
  };
  nutritionalHighlight: {
    carbohydrateCount: string;
    glycemicIndex: string | null; // null means locked
  };
}

export const mockScanResult: ScanResult = {
  foodName: "Tomatoes,Cucumber,Green Chilli",
  foodCategory: "Vegetables",
  foodImage: "", // Will be replaced with actual uploaded image
  breakdown: {
    carbs: {
      name: "Carbs",
      value: 28,
      unit: "g",
      position: 25,
      status: 'good',
    },
    fiber: {
      name: "Fiber",
      value: 45,
      unit: "g",
      position: 50,
      status: 'average',
    },
    sugars: {
      name: "Sugars",
      value: 0,
      unit: "g",
      position: 0,
      status: 'good',
      isGrayed: true,
    },
    protein: {
      name: "Protein",
      value: 0,
      unit: "g",
      position: 0,
      status: 'danger',
      isLocked: true,
    },
    fat: {
      name: "Fat",
      value: 0,
      unit: "g",
      position: 0,
      status: 'danger',
      isGrayed: true,
    },
    calories: {
      name: "Calories",
      value: 0,
      unit: "",
      position: 0,
      status: 'average',
      isGrayed: true,
    },
  },
  nutritionalHighlight: {
    carbohydrateCount: "28g",
    glycemicIndex: null, // Locked - requires premium
  },
};
