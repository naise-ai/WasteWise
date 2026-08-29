// ============================================================
// WasteWise — Recommendation API Service
// ============================================================
import { apiRequest } from './api';
import type { Recommendation } from '../types';

interface BackendRecommendation {
  id: number;
  priority: string;
  title: string;
  description: string;
  suggested_action: string;
  impact: string;
  estimated_savings: string;
  status: string;
  related_food_item?: string;
  related_meal?: string;
  created_at: string;
}

function mapRecommendation(r: BackendRecommendation): Recommendation {
  return {
    id: String(r.id),
    priority: r.priority as any,
    title: r.title,
    description: r.description,
    suggestedAction: r.suggested_action,
    impact: r.impact,
    estimatedSavings: r.estimated_savings,
    status: r.status as any,
    relatedFoodItem: r.related_food_item || undefined,
    relatedMeal: r.related_meal as any || undefined,
    createdAt: r.created_at,
  };
}

export const recommendationService = {
  async getRecommendations(priority?: string, status?: string): Promise<Recommendation[]> {
    const params = new URLSearchParams();
    if (priority && priority !== 'All') params.append('priority', priority);
    if (status) params.append('status', status);

    const res = await apiRequest<BackendRecommendation[]>(`/api/recommendations?${params.toString()}`);
    return res.map(mapRecommendation);
  },

  async updateStatus(id: string, status: 'Active' | 'Applied' | 'Dismissed'): Promise<Recommendation> {
    const res = await apiRequest<BackendRecommendation>(`/api/recommendations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return mapRecommendation(res);
  },
};
