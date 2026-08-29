// ============================================================
// WasteWise — Food Items API Service
// ============================================================
import { apiRequest } from './api';
import type { FoodItem } from '../types';

interface BackendFoodItem {
  id: number;
  name: string;
  category: string;
  cost_per_kg: number;
  is_active: boolean;
  avg_prepared: number;
  avg_consumed: number;
  avg_wasted: number;
  avg_waste_percentage: number;
  level: string;
}

function mapFoodItem(f: BackendFoodItem): FoodItem {
  return {
    id: String(f.id),
    name: f.name,
    category: f.category as any,
    costPerKg: f.cost_per_kg,
    isActive: f.is_active,
    avgPrepared: f.avg_prepared,
    avgConsumed: f.avg_consumed,
    avgWasted: f.avg_wasted,
    avgWastePercentage: f.avg_waste_percentage,
    level: f.level as any,
  };
}

export const foodItemService = {
  async getFoodItems(category?: string, search?: string): Promise<FoodItem[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await apiRequest<BackendFoodItem[]>(`/api/food-items?${params.toString()}`);
    return res.map(mapFoodItem);
  },

  async createFoodItem(item: { name: string; category: string; costPerKg: number }): Promise<FoodItem> {
    const res = await apiRequest<BackendFoodItem>('/api/food-items', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        cost_per_kg: item.costPerKg,
        is_active: true,
      }),
    });
    return mapFoodItem(res);
  },

  async updateFoodItem(id: string, updates: Partial<{ name: string; category: string; costPerKg: number; isActive: boolean }>): Promise<FoodItem> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.costPerKg !== undefined) payload.cost_per_kg = updates.costPerKg;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const res = await apiRequest<BackendFoodItem>(`/api/food-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapFoodItem(res);
  },

  async deleteFoodItem(id: string): Promise<void> {
    await apiRequest(`/api/food-items/${id}`, { method: 'DELETE' });
  },
};
