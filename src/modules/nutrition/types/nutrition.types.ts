export interface CalorieChartData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal_calories?: number;
}

export interface WeeklyChartData {
  week_start: string;
  week_end: string;
  total_calories: number;
  average_calories: number;
  days: {
    date: string;
    calories: number;
  }[];
}

export interface MonthlyChartData {
  year: number;
  month: number;
  month_name: string;
  total_calories: number;
  average_calories: number;
  days_data: {
    date: string;
    calories: number;
  }[];
}

export interface NutritionBreakdown {
  date: string;
  total_calories: number;
  goal_calories?: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
  micronutrients: {
    fiber: number;
    sugar: number;
    sodium: number;
  };
  goal_progress?: number;
}
