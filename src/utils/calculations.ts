// ============================================================
// WasteWise — Calculation Utilities
// ============================================================
import type { WasteRecord, WasteLevel, DashboardKPIs, TrendDataPoint, FoodItem } from '../types';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';

export const getWasteLevel = (wastePercentage: number): WasteLevel => {
  if (wastePercentage < 10) return 'Low';
  if (wastePercentage < 20) return 'Moderate';
  if (wastePercentage < 35) return 'High';
  return 'Critical';
};

export const calculateKPIs = (records: WasteRecord[], days = 1): DashboardKPIs => {
  const cutoff = subDays(new Date(), days - 1);
  const filtered = records.filter(r => parseISO(r.date) >= startOfDay(cutoff));
  const prevCutoff = subDays(new Date(), days * 2 - 1);
  const prevEnd = subDays(new Date(), days);
  const prevFiltered = records.filter(r => {
    const d = parseISO(r.date);
    return d >= startOfDay(prevCutoff) && d <= endOfDay(prevEnd);
  });

  const sum = (arr: WasteRecord[], key: keyof WasteRecord) =>
    arr.reduce((s, r) => s + (r[key] as number), 0);

  const totalPrepared = parseFloat(sum(filtered, 'prepared').toFixed(1));
  const totalConsumed = parseFloat(sum(filtered, 'consumed').toFixed(1));
  const totalWasted = parseFloat(sum(filtered, 'wasted').toFixed(1));
  const wasteRate = totalPrepared > 0 ? parseFloat(((totalWasted / totalPrepared) * 100).toFixed(1)) : 0;
  const estimatedCostLost = parseFloat(sum(filtered, 'costLost').toFixed(0));

  const prevWasted = sum(prevFiltered, 'wasted');
  const wasteReduction = prevWasted > 0
    ? parseFloat((((prevWasted - totalWasted) / prevWasted) * 100).toFixed(1))
    : 0;

  return { totalPrepared, totalConsumed, totalWasted, wasteRate, estimatedCostLost, wasteReduction, recordsCount: filtered.length };
};

export const getTrendData = (records: WasteRecord[], days = 7): TrendDataPoint[] => {
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayRecords = records.filter(r => r.date === dateStr);
    const prepared = parseFloat(dayRecords.reduce((s, r) => s + r.prepared, 0).toFixed(1));
    const consumed = parseFloat(dayRecords.reduce((s, r) => s + r.consumed, 0).toFixed(1));
    const wasted = parseFloat(dayRecords.reduce((s, r) => s + r.wasted, 0).toFixed(1));
    const wastePercentage = prepared > 0 ? parseFloat(((wasted / prepared) * 100).toFixed(1)) : 0;
    return { date: format(d, 'MMM dd'), prepared, consumed, wasted, wastePercentage };
  });
};

export const getWasteByCategory = (records: WasteRecord[], foodItems: FoodItem[]) => {
  const map: Record<string, number> = {};
  records.forEach(r => {
    const fi = foodItems.find(f => f.id === r.foodItemId);
    const cat = fi?.category || 'Other';
    map[cat] = (map[cat] || 0) + r.wasted;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));
};

export const getTopWasteItems = (records: WasteRecord[], top = 5) => {
  const map: Record<string, number> = {};
  records.forEach(r => { map[r.foodItem] = (map[r.foodItem] || 0) + r.wasted; });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, top)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));
};

export const getMealWiseData = (records: WasteRecord[]) => {
  const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;
  return meals.map(meal => {
    const mr = records.filter(r => r.meal === meal);
    const prepared = parseFloat(mr.reduce((s, r) => s + r.prepared, 0).toFixed(1));
    const consumed = parseFloat(mr.reduce((s, r) => s + r.consumed, 0).toFixed(1));
    const wasted = parseFloat(mr.reduce((s, r) => s + r.wasted, 0).toFixed(1));
    return { meal, prepared, consumed, wasted };
  });
};

export const getWasteReasonBreakdown = (records: WasteRecord[]) => {
  const map: Record<string, number> = {};
  records.forEach(r => {
    map[r.reason] = (map[r.reason] || 0) + r.wasted;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));
};

export const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN')}`;

export const formatKg = (kg: number) => `${kg} kg`;

export const getLevelColor = (level: WasteLevel) => {
  switch (level) {
    case 'Low': return 'var(--color-success)';
    case 'Moderate': return 'var(--color-warning)';
    case 'High': return 'var(--color-orange)';
    case 'Critical': return 'var(--color-danger)';
  }
};

export const getLevelBg = (level: WasteLevel) => {
  switch (level) {
    case 'Low': return 'var(--badge-success-bg)';
    case 'Moderate': return 'var(--badge-warning-bg)';
    case 'High': return 'var(--badge-orange-bg)';
    case 'Critical': return 'var(--badge-danger-bg)';
  }
};
