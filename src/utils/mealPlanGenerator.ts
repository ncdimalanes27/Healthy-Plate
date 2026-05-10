import type { Food } from '../types';

export const generate7DayMealPlan = (targetCalories: number, allFoods: Food[]) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const plan = days.map(day => {
    // Basic distribution logic
    const bfastTarget = targetCalories * 0.25;
    const lunchTarget = targetCalories * 0.35;
    const dinnerTarget = targetCalories * 0.30;
    const snackTarget = targetCalories * 0.10;

    const findFood = (target: number, categoryHint?: string) => {
      let candidates = allFoods.filter(f => 
        categoryHint ? f.category === categoryHint : true
      );
      // Fall back to all foods if no category match
      if (candidates.length === 0) candidates = allFoods;
      if (candidates.length === 0) return null;
      // Find food closest to target calories
      return candidates.reduce((prev, curr) => 
        Math.abs(curr.calories - target) < Math.abs(prev.calories - target) ? curr : prev
      );
    };

    return {
      day,
      meals: {
        breakfast: findFood(bfastTarget, 'Breakfast'),
        lunch: findFood(lunchTarget, 'Rice & Grains'), // Usually a heavy meal
        dinner: findFood(dinnerTarget, 'Poultry'),
        snack: findFood(snackTarget, 'Fruits')
      }
    };
  });

  return plan;
};