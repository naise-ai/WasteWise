import { apiRequest } from './api';
import type { WasteRecord } from '../types';

interface BackendWasteRecord {
  id: number;
  date: string;
  meal: string;
  food_item_id: number;
  food_item_name: string;
  prepared: number;
  consumed: number;
  wasted: number;
  waste_percentage: number;
  students_served: number;
  reason: string;
  notes?: string;
  level: string;
  cost_lost: number;
  created_at: string;
}

function mapBackendRecord(r: BackendWasteRecord): WasteRecord {
  return {
    id: String(r.id),
    date: r.date,
    meal: r.meal as any,
    foodItem: r.food_item_name,
    foodItemId: String(r.food_item_id),
    prepared: r.prepared,
    consumed: r.consumed,
    wasted: r.wasted,
    wastePercentage: r.waste_percentage,
    studentsServed: r.students_served,
    reason: r.reason as any,
    notes: r.notes || undefined,
    level: r.level as any,
    costLost: r.cost_lost,
    createdAt: r.created_at,
  };
}

export const wasteService = {
  async getRecords(params: {
    search?: string;
    meal?: string;
    level?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}): Promise<{ records: WasteRecord[]; total: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.meal) query.append('meal', params.meal);
    if (params.level) query.append('level', params.level);
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('page_size', String(params.pageSize));
    if (params.sortBy) query.append('sort_by', params.sortBy);
    if (params.sortDir) query.append('sort_dir', params.sortDir);

    const res = await apiRequest<any>(`/api/records?${query.toString()}`);
    return {
      records: res.records.map(mapBackendRecord),
      total: res.total,
      totalPages: res.total_pages,
    };
  },

  async createRecord(record: {
    date: string;
    meal: string;
    foodItemId: string;
    foodItemName: string;
    prepared: number;
    consumed: number;
    studentsServed: number;
    reason: string;
    notes?: string;
  }): Promise<WasteRecord> {
    const res = await apiRequest<BackendWasteRecord>('/api/records', {
      method: 'POST',
      body: JSON.stringify({
        date: record.date,
        meal: record.meal,
        food_item_id: parseInt(record.foodItemId),
        food_item_name: record.foodItemName,
        prepared: record.prepared,
        consumed: record.consumed,
        students_served: record.studentsServed,
        reason: record.reason,
        notes: record.notes,
      }),
    });
    return mapBackendRecord(res);
  },

  async updateRecord(id: string, updates: Partial<{
    prepared: number;
    consumed: number;
    studentsServed: number;
    reason: string;
    notes?: string;
  }>): Promise<WasteRecord> {
    const payload: any = {};
    if (updates.prepared !== undefined) payload.prepared = updates.prepared;
    if (updates.consumed !== undefined) payload.consumed = updates.consumed;
    if (updates.studentsServed !== undefined) payload.students_served = updates.studentsServed;
    if (updates.reason !== undefined) payload.reason = updates.reason;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const res = await apiRequest<BackendWasteRecord>(`/api/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendRecord(res);
  },

  async deleteRecord(id: string): Promise<void> {
    await apiRequest(`/api/records/${id}`, { method: 'DELETE' });
  },
};
