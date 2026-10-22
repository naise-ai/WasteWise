import { apiRequest } from './api';

export interface SurplusListing {
  id: number;
  food_name: string;
  quantity: number;
  unit: string;
  pickup_location: string;
  available_until: string;
  notes: string | null;
  status: 'Available' | 'Claimed' | 'Collected' | 'Withdrawn' | 'Expired';
  posted_by_id: number;
  posted_by_name: string;
  organization_name: string;
  claimed_by_id: number | null;
  claimed_by_name: string | null;
  created_at: string;
}

export interface NewSurplusListing {
  food_name: string;
  quantity: number;
  unit: string;
  pickup_location: string;
  available_until: string;
  notes?: string;
}

export const rescueService = {
  getListings: () => apiRequest<SurplusListing[]>('/api/rescue/listings'),
  createListing: (input: NewSurplusListing) => apiRequest<SurplusListing>('/api/rescue/listings', {
    method: 'POST', body: JSON.stringify(input),
  }),
  claim: (id: number) => apiRequest<SurplusListing>(`/api/rescue/listings/${id}/claim`, { method: 'POST' }),
  markCollected: (id: number) => apiRequest<SurplusListing>(`/api/rescue/listings/${id}/collected`, { method: 'POST' }),
  withdraw: (id: number) => apiRequest<void>(`/api/rescue/listings/${id}`, { method: 'DELETE' }),
};
