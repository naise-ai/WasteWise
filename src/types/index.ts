// ============================================================
// WasteWise — TypeScript Type Definitions
// ============================================================

export type MealType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

export type WasteReason =
  | 'Overproduction'
  | 'Low demand'
  | 'Poor quality'
  | 'Spoilage'
  | 'Plate waste'
  | 'Other';

export type WasteLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type FoodCategory =
  | 'Rice & Grains'
  | 'Breads'
  | 'Dal & Lentils'
  | 'Vegetables'
  | 'Curry'
  | 'Snacks'
  | 'Beverages'
  | 'Desserts'
  | 'Other';

export type NotificationPriority = 'high' | 'medium' | 'low' | 'success';

export type RecommendationPriority = 'High' | 'Medium' | 'Low' | 'Positive';
export type RecommendationStatus = 'Active' | 'Applied' | 'Dismissed';

export type ReportType =
  | 'Daily Waste Report'
  | 'Weekly Waste Report'
  | 'Monthly Waste Report'
  | 'Food-wise Report'
  | 'Cost Impact Report';

// ----------------------------------------------------------------
// Core domain models
// ----------------------------------------------------------------

export interface WasteRecord {
  id: string;
  date: string; // ISO date string yyyy-MM-dd
  meal: MealType;
  foodItem: string;
  foodItemId: string;
  prepared: number; // kg
  consumed: number; // kg
  wasted: number; // kg
  wastePercentage: number;
  studentsServed: number;
  reason: WasteReason;
  notes?: string;
  level: WasteLevel;
  costLost: number; // INR
  createdAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  avgPrepared: number; // kg
  avgConsumed: number; // kg
  avgWasted: number; // kg
  avgWastePercentage: number;
  costPerKg: number; // INR per kg
  level: WasteLevel;
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  suggestedAction: string;
  impact: string;
  estimatedSavings: string;
  status: RecommendationStatus;
  relatedFoodItem?: string;
  relatedMeal?: MealType;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  canteenName: string;
  avatar?: string;
}

// ----------------------------------------------------------------
// Derived / computed models
// ----------------------------------------------------------------

export interface DashboardKPIs {
  totalPrepared: number;
  totalConsumed: number;
  totalWasted: number;
  wasteRate: number;
  estimatedCostLost: number;
  wasteReduction: number; // % change vs previous period
  recordsCount: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface TrendDataPoint {
  date: string;
  prepared: number;
  consumed: number;
  wasted: number;
  wastePercentage: number;
}

// ----------------------------------------------------------------
// Service interfaces (for future API integration)
// ----------------------------------------------------------------

export interface WasteRecordFilters {
  search?: string;
  meal?: MealType | '';
  foodItem?: string;
  level?: WasteLevel | '';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: keyof WasteRecord;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  emailAlerts: boolean;
  weeklyReport: boolean;
}
