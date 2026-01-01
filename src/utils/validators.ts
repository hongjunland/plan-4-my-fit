import { APP_CONFIG } from '../constants';

// Profile validation
export const validateAge = (age: number): boolean => {
  return age >= APP_CONFIG.MIN_AGE && age <= APP_CONFIG.MAX_AGE;
};

export const validateHeight = (height: number): boolean => {
  return height >= APP_CONFIG.MIN_HEIGHT && height <= APP_CONFIG.MAX_HEIGHT;
};

export const validateWeight = (weight: number): boolean => {
  return weight >= APP_CONFIG.MIN_WEIGHT && weight <= APP_CONFIG.MAX_WEIGHT;
};

export const validateWeeklyWorkouts = (workouts: number): boolean => {
  return workouts >= APP_CONFIG.MIN_WEEKLY_WORKOUTS && workouts <= APP_CONFIG.MAX_WEEKLY_WORKOUTS;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};