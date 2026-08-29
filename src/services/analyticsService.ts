// ============================================================
// WasteWise — Analytics API Service
// ============================================================
import { apiRequest } from './api';
import type { DashboardKPIs, TrendDataPoint } from '../types';

export const analyticsService = {
  async getDashboardKPIs(days = 1): Promise<DashboardKPIs> {
    const res = await apiRequest<any>(`/api/analytics/dashboard?days=${days}`);
    return {
      totalPrepared: res.total_prepared,
      totalConsumed: res.total_consumed,
      totalWasted: res.total_wasted,
      wasteRate: res.waste_rate,
      estimatedCostLost: res.estimated_cost_lost,
      wasteReduction: res.waste_reduction,
      recordsCount: res.records_count,
    };
  },

  async getTrend(days = 7): Promise<TrendDataPoint[]> {
    const res = await apiRequest<any[]>(`/api/analytics/trend?days=${days}`);
    return res.map(r => ({
      date: r.date,
      prepared: r.prepared,
      consumed: r.consumed,
      wasted: r.wasted,
      wastePercentage: r.waste_percentage,
    }));
  },

  async getCategoryBreakdown(): Promise<{ name: string; value: number }[]> {
    return apiRequest<{ name: string; value: number }[]>('/api/analytics/category-breakdown');
  },

  async getMealWise(): Promise<{ meal: string; prepared: number; consumed: number; wasted: number }[]> {
    return apiRequest<{ meal: string; prepared: number; consumed: number; wasted: number }[]>('/api/analytics/meal-wise');
  },

  async getDayWise(): Promise<{ day: string; wasted: number; prepared: number; wasteRate: number }[]> {
    const res = await apiRequest<any[]>('/api/analytics/day-wise');
    return res.map(r => ({
      day: r.day,
      wasted: r.wasted,
      prepared: r.prepared,
      wasteRate: r.waste_rate,
    }));
  },

  async getTopItems(limit = 5): Promise<{ name: string; value: number }[]> {
    return apiRequest<{ name: string; value: number }[]>(`/api/analytics/top-items?limit=${limit}`);
  },

  async getReasons(): Promise<{ name: string; value: number }[]> {
    return apiRequest<{ name: string; value: number }[]>('/api/analytics/reasons');
  },
};
