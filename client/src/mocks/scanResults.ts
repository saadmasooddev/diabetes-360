export interface BreakdownItem {
  name: string;
  value: string | number;
  unit: string;
  position: number; // Position on progress bar (0-100)
  status: 'good' | 'average' | 'danger';
  isLocked?: boolean;
  isGrayed?: boolean;
}

export interface SuggestedFood {
  name: string;
  image: string;
}

export interface PersonalizedInsight {
  calories: string;
  recommendation: string;
  suggestionText: string;
  suggestedFoods: SuggestedFood[];
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
  personalizedInsight: PersonalizedInsight;
}