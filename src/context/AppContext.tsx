// ============================================================
// WasteWise — Global App Context & API State Management
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { WasteRecord, FoodItem, Notification, Recommendation, AppSettings, User } from '../types';
import { authService } from '../services/authService';
import { wasteService } from '../services/wasteService';
import { foodItemService } from '../services/foodItemService';
import { recommendationService } from '../services/recommendationService';
import { notificationService } from '../services/notificationService';

// ─── State Shape ────────────────────────────────────────────
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  wasteRecords: WasteRecord[];
  foodItems: FoodItem[];
  notifications: Notification[];
  recommendations: Recommendation[];
  settings: AppSettings;
  currentPage: string;
}

// ─── Actions ────────────────────────────────────────────────
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_WASTE_RECORDS'; payload: WasteRecord[] }
  | { type: 'ADD_WASTE_RECORD_LOCAL'; payload: WasteRecord }
  | { type: 'UPDATE_WASTE_RECORD_LOCAL'; payload: WasteRecord }
  | { type: 'DELETE_WASTE_RECORD_LOCAL'; payload: string }
  | { type: 'SET_FOOD_ITEMS'; payload: FoodItem[] }
  | { type: 'ADD_FOOD_ITEM_LOCAL'; payload: FoodItem }
  | { type: 'UPDATE_FOOD_ITEM_LOCAL'; payload: FoodItem }
  | { type: 'DELETE_FOOD_ITEM_LOCAL'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATION_READ_LOCAL'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ_LOCAL' }
  | { type: 'DISMISS_NOTIFICATION_LOCAL'; payload: string }
  | { type: 'SET_RECOMMENDATIONS'; payload: Recommendation[] }
  | { type: 'UPDATE_RECOMMENDATION_STATUS_LOCAL'; payload: { id: string; status: Recommendation['status'] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_PAGE'; payload: string };

// ─── Initial State ──────────────────────────────────────────
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  wasteRecords: [],
  foodItems: [],
  notifications: [],
  recommendations: [],
  settings: {
    theme: 'light',
    language: 'English',
    notifications: true,
    emailAlerts: false,
    weeklyReport: true,
  },
  currentPage: 'dashboard',
};

// ─── Reducer ────────────────────────────────────────────────
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, user: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, wasteRecords: [], foodItems: [], notifications: [], recommendations: [] };
    case 'SET_WASTE_RECORDS':
      return { ...state, wasteRecords: action.payload };
    case 'ADD_WASTE_RECORD_LOCAL':
      return { ...state, wasteRecords: [action.payload, ...state.wasteRecords] };
    case 'UPDATE_WASTE_RECORD_LOCAL':
      return { ...state, wasteRecords: state.wasteRecords.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_WASTE_RECORD_LOCAL':
      return { ...state, wasteRecords: state.wasteRecords.filter(r => r.id !== action.payload) };
    case 'SET_FOOD_ITEMS':
      return { ...state, foodItems: action.payload };
    case 'ADD_FOOD_ITEM_LOCAL':
      return { ...state, foodItems: [action.payload, ...state.foodItems] };
    case 'UPDATE_FOOD_ITEM_LOCAL':
      return { ...state, foodItems: state.foodItems.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FOOD_ITEM_LOCAL':
      return { ...state, foodItems: state.foodItems.filter(f => f.id !== action.payload) };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_NOTIFICATION_READ_LOCAL':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, isRead: true } : n) };
    case 'MARK_ALL_NOTIFICATIONS_READ_LOCAL':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, isRead: true })) };
    case 'DISMISS_NOTIFICATION_LOCAL':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'UPDATE_RECOMMENDATION_STATUS_LOCAL':
      return {
        ...state,
        recommendations: state.recommendations.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status } : r),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch all dynamic backend data
  const refreshAllData = useCallback(async () => {
    try {
      const [recordsData, items, recs, notifs] = await Promise.all([
        wasteService.getRecords({ pageSize: 100 }),
        foodItemService.getFoodItems(),
        recommendationService.getRecommendations(),
        notificationService.getNotifications(),
      ]);

      dispatch({ type: 'SET_WASTE_RECORDS', payload: recordsData.records });
      dispatch({ type: 'SET_FOOD_ITEMS', payload: items });
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recs });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifs });
    } catch (err: any) {
      console.error('Failed to load backend data:', err);
    }
  }, []);

  // Check auth session on mount
  useEffect(() => {
    async function initAuth() {
      const user = await authService.getCurrentUser();
      if (user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    initAuth();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      refreshAllData();
    }
  }, [state.isAuthenticated, refreshAllData]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    localStorage.setItem('ww-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Restore saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ww-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: savedTheme } });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshAllData }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Custom Hooks ─────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useAppState() { return useApp().state; }
export function useAppDispatch() { return useApp().dispatch; }
