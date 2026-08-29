// ============================================================
// WasteWise — Mock Data (30+ realistic Indian canteen records)
// ============================================================
import type { WasteRecord, FoodItem, Notification, Recommendation, User } from '../types';
import { format, subDays } from 'date-fns';

const getLevel = (pct: number) => {
  if (pct < 10) return 'Low' as const;
  if (pct < 20) return 'Moderate' as const;
  if (pct < 35) return 'High' as const;
  return 'Critical' as const;
};

const costPerKgMap: Record<string, number> = {
  'Rice': 60,
  'Dal Tadka': 80,
  'Chapati': 50,
  'Mixed Vegetable': 70,
  'Paneer Curry': 180,
  'Biryani': 120,
  'Poha': 45,
  'Idli': 40,
  'Samosa': 90,
  'Vada Pav': 75,
  'Pulao': 90,
  'Upma': 40,
  'Rajma': 85,
  'Chole': 90,
  'Khichdi': 55,
};

const makeRecord = (
  id: string,
  daysAgo: number,
  meal: WasteRecord['meal'],
  foodItem: string,
  foodItemId: string,
  prepared: number,
  consumed: number,
  studentsServed: number,
  reason: WasteRecord['reason'],
  notes?: string
): WasteRecord => {
  const wasted = parseFloat((prepared - consumed).toFixed(2));
  const wastePercentage = parseFloat(((wasted / prepared) * 100).toFixed(1));
  const level = getLevel(wastePercentage);
  const costPerKg = costPerKgMap[foodItem] || 70;
  const costLost = parseFloat((wasted * costPerKg).toFixed(2));
  return {
    id,
    date: format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'),
    meal,
    foodItem,
    foodItemId,
    prepared,
    consumed,
    wasted,
    wastePercentage,
    studentsServed,
    reason,
    notes,
    level,
    costLost,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  };
};

export const mockWasteRecords: WasteRecord[] = [
  // Day 0 (Today)
  makeRecord('r001', 0, 'Breakfast', 'Poha', 'fi007', 25, 22, 180, 'Low demand'),
  makeRecord('r002', 0, 'Lunch', 'Rice', 'fi001', 60, 49, 380, 'Overproduction', 'High demand day but overestimated'),
  makeRecord('r003', 0, 'Lunch', 'Dal Tadka', 'fi002', 40, 34, 380, 'Overproduction'),
  makeRecord('r004', 0, 'Lunch', 'Mixed Vegetable', 'fi004', 30, 26, 380, 'Low demand'),
  makeRecord('r005', 0, 'Snacks', 'Samosa', 'fi009', 15, 14.2, 200, 'Other', 'Almost all consumed'),
  makeRecord('r006', 0, 'Dinner', 'Biryani', 'fi006', 35, 26, 290, 'Overproduction'),
  makeRecord('r007', 0, 'Dinner', 'Chapati', 'fi003', 20, 18, 290, 'Plate waste'),
  // Day 1
  makeRecord('r008', 1, 'Breakfast', 'Idli', 'fi008', 30, 28, 195, 'Other'),
  makeRecord('r009', 1, 'Lunch', 'Rice', 'fi001', 58, 44, 360, 'Overproduction'),
  makeRecord('r010', 1, 'Lunch', 'Rajma', 'fi013', 35, 31, 360, 'Low demand'),
  makeRecord('r011', 1, 'Lunch', 'Chapati', 'fi003', 22, 20, 360, 'Plate waste'),
  makeRecord('r012', 1, 'Snacks', 'Vada Pav', 'fi010', 20, 19, 210, 'Low demand'),
  makeRecord('r013', 1, 'Dinner', 'Khichdi', 'fi015', 28, 22, 250, 'Spoilage', 'Quality degraded by evening'),
  // Day 2
  makeRecord('r014', 2, 'Breakfast', 'Upma', 'fi012', 20, 14, 150, 'Poor quality', 'Texture complaints'),
  makeRecord('r015', 2, 'Lunch', 'Rice', 'fi001', 65, 50, 400, 'Overproduction'),
  makeRecord('r016', 2, 'Lunch', 'Dal Tadka', 'fi002', 42, 36, 400, 'Low demand'),
  makeRecord('r017', 2, 'Lunch', 'Paneer Curry', 'fi005', 18, 17, 400, 'Plate waste'),
  makeRecord('r018', 2, 'Snacks', 'Poha', 'fi007', 18, 16, 160, 'Low demand'),
  makeRecord('r019', 2, 'Dinner', 'Biryani', 'fi006', 40, 28, 300, 'Overproduction'),
  // Day 3
  makeRecord('r020', 3, 'Breakfast', 'Poha', 'fi007', 22, 20, 170, 'Other'),
  makeRecord('r021', 3, 'Lunch', 'Rice', 'fi001', 55, 47, 350, 'Low demand'),
  makeRecord('r022', 3, 'Lunch', 'Chole', 'fi014', 32, 28, 350, 'Low demand'),
  makeRecord('r023', 3, 'Lunch', 'Chapati', 'fi003', 18, 17, 350, 'Plate waste'),
  makeRecord('r024', 3, 'Dinner', 'Pulao', 'fi011', 30, 24, 260, 'Low demand'),
  // Day 4
  makeRecord('r025', 4, 'Breakfast', 'Idli', 'fi008', 28, 26, 185, 'Plate waste'),
  makeRecord('r026', 4, 'Lunch', 'Rice', 'fi001', 62, 46, 390, 'Overproduction'),
  makeRecord('r027', 4, 'Lunch', 'Dal Tadka', 'fi002', 38, 32, 390, 'Overproduction'),
  makeRecord('r028', 4, 'Lunch', 'Mixed Vegetable', 'fi004', 28, 25, 390, 'Low demand'),
  makeRecord('r029', 4, 'Snacks', 'Samosa', 'fi009', 18, 17, 220, 'Other'),
  makeRecord('r030', 4, 'Dinner', 'Biryani', 'fi006', 38, 27, 280, 'Overproduction'),
  // Day 5
  makeRecord('r031', 5, 'Breakfast', 'Upma', 'fi012', 22, 20, 165, 'Low demand'),
  makeRecord('r032', 5, 'Lunch', 'Rice', 'fi001', 68, 52, 410, 'Overproduction'),
  makeRecord('r033', 5, 'Lunch', 'Rajma', 'fi013', 30, 26, 410, 'Low demand'),
  makeRecord('r034', 5, 'Lunch', 'Chapati', 'fi003', 24, 21, 410, 'Plate waste'),
  makeRecord('r035', 5, 'Dinner', 'Paneer Curry', 'fi005', 16, 15, 240, 'Other'),
  // Day 6
  makeRecord('r036', 6, 'Breakfast', 'Poha', 'fi007', 24, 21, 175, 'Low demand'),
  makeRecord('r037', 6, 'Lunch', 'Rice', 'fi001', 70, 54, 420, 'Overproduction'),
  makeRecord('r038', 6, 'Lunch', 'Dal Tadka', 'fi002', 45, 37, 420, 'Overproduction'),
  makeRecord('r039', 6, 'Lunch', 'Mixed Vegetable', 'fi004', 32, 26, 420, 'Low demand'),
  makeRecord('r040', 6, 'Snacks', 'Vada Pav', 'fi010', 22, 20, 230, 'Other'),
  makeRecord('r041', 6, 'Dinner', 'Khichdi', 'fi015', 25, 21, 210, 'Spoilage'),
  // Day 7-14 (reduced)
  makeRecord('r042', 7, 'Lunch', 'Rice', 'fi001', 60, 50, 370, 'Overproduction'),
  makeRecord('r043', 7, 'Lunch', 'Dal Tadka', 'fi002', 38, 33, 370, 'Low demand'),
  makeRecord('r044', 8, 'Lunch', 'Rice', 'fi001', 58, 49, 360, 'Low demand'),
  makeRecord('r045', 8, 'Dinner', 'Biryani', 'fi006', 36, 28, 270, 'Overproduction'),
  makeRecord('r046', 9, 'Lunch', 'Rice', 'fi001', 63, 52, 390, 'Overproduction'),
  makeRecord('r047', 9, 'Lunch', 'Paneer Curry', 'fi005', 20, 19, 390, 'Other'),
  makeRecord('r048', 10, 'Breakfast', 'Idli', 'fi008', 32, 30, 200, 'Plate waste'),
  makeRecord('r049', 10, 'Lunch', 'Rice', 'fi001', 65, 51, 400, 'Overproduction'),
  makeRecord('r050', 11, 'Lunch', 'Rice', 'fi001', 55, 47, 350, 'Low demand'),
  makeRecord('r051', 11, 'Lunch', 'Chole', 'fi014', 28, 25, 350, 'Low demand'),
  makeRecord('r052', 12, 'Lunch', 'Rice', 'fi001', 62, 46, 385, 'Overproduction'),
  makeRecord('r053', 12, 'Dinner', 'Pulao', 'fi011', 28, 22, 240, 'Low demand'),
  makeRecord('r054', 13, 'Lunch', 'Rice', 'fi001', 60, 50, 375, 'Overproduction'),
  makeRecord('r055', 14, 'Lunch', 'Rice', 'fi001', 58, 48, 365, 'Low demand'),
];

export const mockFoodItems: FoodItem[] = [
  { id: 'fi001', name: 'Rice', category: 'Rice & Grains', avgPrepared: 62, avgConsumed: 49, avgWasted: 13, avgWastePercentage: 21.0, costPerKg: 60, level: 'High', isActive: true },
  { id: 'fi002', name: 'Dal Tadka', category: 'Dal & Lentils', avgPrepared: 40, avgConsumed: 34, avgWasted: 6, avgWastePercentage: 15.0, costPerKg: 80, level: 'Moderate', isActive: true },
  { id: 'fi003', name: 'Chapati', category: 'Breads', avgPrepared: 21, avgConsumed: 19, avgWasted: 2, avgWastePercentage: 9.5, costPerKg: 50, level: 'Low', isActive: true },
  { id: 'fi004', name: 'Mixed Vegetable', category: 'Vegetables', avgPrepared: 30, avgConsumed: 26, avgWasted: 4, avgWastePercentage: 13.3, costPerKg: 70, level: 'Moderate', isActive: true },
  { id: 'fi005', name: 'Paneer Curry', category: 'Curry', avgPrepared: 18, avgConsumed: 17, avgWasted: 1, avgWastePercentage: 5.6, costPerKg: 180, level: 'Low', isActive: true },
  { id: 'fi006', name: 'Biryani', category: 'Rice & Grains', avgPrepared: 37, avgConsumed: 27, avgWasted: 10, avgWastePercentage: 27.0, costPerKg: 120, level: 'High', isActive: true },
  { id: 'fi007', name: 'Poha', category: 'Rice & Grains', avgPrepared: 22, avgConsumed: 20, avgWasted: 2, avgWastePercentage: 9.1, costPerKg: 45, level: 'Low', isActive: true },
  { id: 'fi008', name: 'Idli', category: 'Rice & Grains', avgPrepared: 30, avgConsumed: 28, avgWasted: 2, avgWastePercentage: 6.7, costPerKg: 40, level: 'Low', isActive: true },
  { id: 'fi009', name: 'Samosa', category: 'Snacks', avgPrepared: 16, avgConsumed: 15, avgWasted: 1, avgWastePercentage: 6.3, costPerKg: 90, level: 'Low', isActive: true },
  { id: 'fi010', name: 'Vada Pav', category: 'Snacks', avgPrepared: 21, avgConsumed: 19, avgWasted: 2, avgWastePercentage: 9.5, costPerKg: 75, level: 'Low', isActive: true },
  { id: 'fi011', name: 'Pulao', category: 'Rice & Grains', avgPrepared: 29, avgConsumed: 23, avgWasted: 6, avgWastePercentage: 20.7, costPerKg: 90, level: 'High', isActive: true },
  { id: 'fi012', name: 'Upma', category: 'Rice & Grains', avgPrepared: 21, avgConsumed: 17, avgWasted: 4, avgWastePercentage: 19.0, costPerKg: 40, level: 'Moderate', isActive: true },
  { id: 'fi013', name: 'Rajma', category: 'Dal & Lentils', avgPrepared: 32, avgConsumed: 28, avgWasted: 4, avgWastePercentage: 12.5, costPerKg: 85, level: 'Moderate', isActive: true },
  { id: 'fi014', name: 'Chole', category: 'Dal & Lentils', avgPrepared: 30, avgConsumed: 26, avgWasted: 4, avgWastePercentage: 13.3, costPerKg: 90, level: 'Moderate', isActive: true },
  { id: 'fi015', name: 'Khichdi', category: 'Rice & Grains', avgPrepared: 26, avgConsumed: 21, avgWasted: 5, avgWastePercentage: 19.2, costPerKg: 55, level: 'Moderate', isActive: true },
];

export const mockNotifications: Notification[] = [
  { id: 'n001', type: 'high', title: 'High Rice Waste Detected', message: 'Rice waste has exceeded 20% for 5 consecutive days. Consider reducing preparation by 10-12%.', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), isRead: false },
  { id: 'n002', type: 'medium', title: 'Friday Lunch Demand Lower', message: 'Friday lunch consumption is consistently 15% lower than weekday average.', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), isRead: false },
  { id: 'n003', type: 'success', title: 'Waste Reduced This Week', message: 'Overall waste has decreased by 12% compared to last week. Great job!', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), isRead: false },
  { id: 'n004', type: 'medium', title: 'Monthly Report Ready', message: 'Your August waste analytics report is now available for review.', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), isRead: true },
  { id: 'n005', type: 'high', title: 'Biryani Waste Critical', message: 'Biryani recorded 27% average waste rate. Review preparation quantities.', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), isRead: true },
  { id: 'n006', type: 'low', title: 'Paneer Curry Performance Excellent', message: 'Paneer Curry maintained below 6% waste rate this month.', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), isRead: true },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec001',
    priority: 'High',
    title: 'Reduce Rice Preparation',
    description: 'Rice waste has increased by 18% over the last 7 days. Average waste rate is 21%, well above the 10% target.',
    suggestedAction: 'Reduce daily rice preparation by 10–15% (approximately 6–9 kg) during lunch service.',
    impact: 'Expected to reduce rice waste from 13 kg/day to 8–9 kg/day.',
    estimatedSavings: '₹2,400–₹3,200/month',
    status: 'Active',
    relatedFoodItem: 'Rice',
    relatedMeal: 'Lunch',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec002',
    priority: 'High',
    title: 'Optimize Biryani Quantities',
    description: 'Biryani consistently records 25–30% waste, making it the second-highest waste contributor by percentage.',
    suggestedAction: 'Prepare biryani in smaller batches (30 kg instead of 37 kg) and use demand-based replenishment.',
    impact: 'Estimated 25% reduction in biryani waste.',
    estimatedSavings: '₹1,500–₹2,000/month',
    status: 'Active',
    relatedFoodItem: 'Biryani',
    relatedMeal: 'Dinner',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec003',
    priority: 'Medium',
    title: 'Review Friday Lunch Demand',
    description: 'Friday lunch shows consistently lower consumption compared to other weekdays, likely due to students leaving early.',
    suggestedAction: 'Reduce all lunch quantities by 15% on Fridays and offer lighter menu options.',
    impact: 'Moderate reduction in weekly waste accumulation.',
    estimatedSavings: '₹600–₹900/month',
    status: 'Active',
    relatedMeal: 'Lunch',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec004',
    priority: 'Medium',
    title: 'Address Dal Tadka Overproduction',
    description: 'Dal Tadka averages 15% waste rate consistently. Small batch adjustments could reduce waste significantly.',
    suggestedAction: 'Reduce Dal Tadka preparation by 8–10% and monitor consumption for 2 weeks.',
    impact: 'Expected 30% reduction in dal waste.',
    estimatedSavings: '₹700–₹900/month',
    status: 'Active',
    relatedFoodItem: 'Dal Tadka',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec005',
    priority: 'Positive',
    title: 'Paneer Curry Performance Excellent',
    description: 'Paneer Curry maintains a consistently low waste rate of under 6%, demonstrating good demand prediction.',
    suggestedAction: 'Document the preparation and planning process used for Paneer Curry and apply the same approach to other high-waste items.',
    impact: 'Replicating this model could reduce overall waste by 8–10%.',
    estimatedSavings: '₹1,200–₹1,800/month (if applied broadly)',
    status: 'Active',
    relatedFoodItem: 'Paneer Curry',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec006',
    priority: 'Positive',
    title: 'Chapati Waste Near Target',
    description: 'Chapati waste has reduced to 9.5%, approaching the 8% target after portion control adjustments last month.',
    suggestedAction: 'Continue current portion control practices. Consider reducing by 1–2 pieces per student.',
    impact: 'Maintaining current trajectory.',
    estimatedSavings: '₹200–₹400/month',
    status: 'Active',
    relatedFoodItem: 'Chapati',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec007',
    priority: 'Low',
    title: 'Upma Quality Improvement',
    description: 'Upma recorded multiple "Poor quality" and "Plate waste" entries. Student feedback suggests texture issues.',
    suggestedAction: 'Review the Upma recipe and preparation process. Consider a feedback session with canteen staff.',
    impact: 'Improved student satisfaction and reduced plate waste.',
    estimatedSavings: '₹300–₹500/month',
    status: 'Active',
    relatedFoodItem: 'Upma',
    createdAt: new Date().toISOString(),
  },
];

export const mockUser: User = {
  id: 'u001',
  name: 'Naise Shekhar',
  email: 'naise.shekhar@vsit.edu.in',
  role: 'Canteen Administrator',
  canteenName: 'VSIT Canteen — Main Block',
};

