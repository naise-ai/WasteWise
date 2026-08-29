// ============================================================
// WasteWise — Dashboard Page (Connected to REST API)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Scale, Utensils, Trash2, Percent, DollarSign, TrendingDown,
  TrendingUp, ArrowUpRight, ArrowDownRight, Leaf, PlusCircle,
  Upload, FileBarChart2, Lightbulb, Target
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAppState, useAppDispatch } from '../context/AppContext';
import {
  calculateKPIs, getWasteByCategory,
  getTopWasteItems, getMealWiseData, formatCurrency
} from '../utils/calculations';
import { analyticsService } from '../services/analyticsService';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import type { TrendDataPoint } from '../types';

// ─── Count-Up Hook ────────────────────────────────────────
function useCountUp(target: number, duration = 1000, prefix = '', suffix = '') {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress >= 1) { setValue(target); prevRef.current = target; clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return `${prefix}${typeof target === 'number' && !Number.isInteger(target) ? value.toFixed(1) : Math.round(value)}${suffix}`;
}

// ─── KPI Card ─────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  trend: number;
  trendLabel: string;
  delay?: number;
}

function KPICard({ label, value, prefix = '', suffix = '', icon, color, trend, trendLabel, delay = 0 }: KPICardProps) {
  const displayValue = useCountUp(value, 1200, prefix, suffix);
  const isPositive = trend >= 0;
  const isWasteMetric = label.includes('Waste') && !label.includes('Reduction');

  return (
    <div className={`kpi-card ${color} animate-in`} style={{ animationDelay: `${delay}s` }}>
      <div className="kpi-header">
        <div className="kpi-icon-wrapper">
          <div className={`kpi-icon ${color}`}>{icon}</div>
        </div>
        <div className={`kpi-trend ${isWasteMetric ? (isPositive ? 'negative' : 'positive') : (isPositive ? 'positive' : 'negative')}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="kpi-value">{displayValue}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-trend neutral" style={{ marginTop: 4, fontSize: 11 }}>{trendLabel}</div>
    </div>
  );
}

// ─── Chart Colors ─────────────────────────────────────────
const COLORS = ['#16a34a', '#0d9488', '#2563eb', '#9333ea', '#ca8a04', '#ea580c', '#dc2626'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value} {p.name === 'Percentage' ? '%' : 'kg'}</strong>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '8px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13
    }}>
      <p style={{ color: 'var(--text-primary)' }}>{payload[0].name}: <strong>{payload[0].value} kg</strong></p>
    </div>
  );
};

export default function Dashboard() {
  const { wasteRecords, foodItems, isLoading } = useAppState();
  const dispatch = useAppDispatch();
  const [trendPeriod, setTrendPeriod] = useState<7 | 30 | 90>(7);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  const kpis = calculateKPIs(wasteRecords, 1);
  const categoryData = getWasteByCategory(wasteRecords, foodItems);
  const topItems = getTopWasteItems(wasteRecords, 5);
  const mealData = getMealWiseData(wasteRecords);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const data = await analyticsService.getTrend(trendPeriod);
        setTrendData(data);
      } catch (err) {
        console.error('Failed to fetch trend data:', err);
      }
    }
    fetchTrend();
  }, [trendPeriod, wasteRecords]);

  // Show skeleton while initial data loads
  if (isLoading) return <DashboardSkeleton />;

  // Dynamic insight
  const topItem = topItems[0];
  const topItemShare = kpis.totalWasted > 0
    ? ((topItem?.value / kpis.totalWasted) * 100).toFixed(0)
    : '0';

  return (
    <div>
      {/* ── Quick Actions ── */}
      <div className="quick-actions">
        {[
          { icon: <PlusCircle size={16} />, label: 'Record Waste', page: 'record', color: 'var(--color-primary)' },
          { icon: <Upload size={16} />, label: 'Bulk Import', page: 'import', color: 'var(--color-teal)' },
          { icon: <FileBarChart2 size={16} />, label: 'Generate Report', page: 'reports', color: '#9333ea' },
          { icon: <Lightbulb size={16} />, label: 'Recommendations', page: 'recommendations', color: 'var(--color-warning)' },
        ].map((action, i) => (
          <button
            key={i}
            className="quick-action-btn"
            onClick={() => dispatch({ type: 'SET_PAGE', payload: action.page })}
            style={{ '--action-color': action.color } as any}
          >
            <span style={{ color: action.color }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* ── KPI Grid ── */}
      <div className="kpi-grid">
        <KPICard
          label="Total Food Prepared" value={kpis.totalPrepared} suffix=" kg"
          icon={<Scale size={18} />} color="blue"
          trend={3.2} trendLabel="vs yesterday" delay={0}
        />
        <KPICard
          label="Food Consumed" value={kpis.totalConsumed} suffix=" kg"
          icon={<Utensils size={18} />} color="green"
          trend={2.8} trendLabel="vs yesterday" delay={0.05}
        />
        <KPICard
          label="Food Waste" value={kpis.totalWasted} suffix=" kg"
          icon={<Trash2 size={18} />} color="orange"
          trend={4.1} trendLabel="vs yesterday" delay={0.1}
        />
        <KPICard
          label="Waste Rate" value={kpis.wasteRate} suffix="%"
          icon={<Percent size={18} />} color="red"
          trend={1.2} trendLabel="vs yesterday" delay={0.15}
        />
        <KPICard
          label="Cost Lost" value={kpis.estimatedCostLost} prefix="₹"
          icon={<DollarSign size={18} />} color="purple"
          trend={5.3} trendLabel="vs yesterday" delay={0.2}
        />
        <KPICard
          label="Waste Reduction" value={Math.abs(kpis.wasteReduction)} suffix="%"
          icon={kpis.wasteReduction > 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
          color="teal"
          trend={kpis.wasteReduction} trendLabel="vs previous period" delay={0.25}
        />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="charts-grid">
        {/* Waste Trend */}
        <div className="card chart-col-8 animate-in animate-delay-3">
          <div className="card-header">
            <div>
              <div className="card-title">Food Waste Trend</div>
              <div className="card-subtitle">Daily waste pattern from database (kg)</div>
            </div>
            <div className="tab-group">
              {([7, 30, 90] as const).map(d => (
                <button key={d} className={`tab-btn ${trendPeriod === d ? 'active' : ''}`}
                  onClick={() => setTrendPeriod(d)}>
                  {d === 7 ? '7D' : d === 30 ? '30D' : '3M'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="prepared" name="Prepared" stroke="#2563eb" fill="url(#prepGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="consumed" name="Consumed" stroke="#0d9488" strokeWidth={2} fill="none" dot={false} />
              <Area type="monotone" dataKey="wasted" name="Wasted" stroke="#16a34a" fill="url(#wasteGrad)" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Waste by Category */}
        <div className="card chart-col-4 animate-in animate-delay-4">
          <div className="card-header">
            <div>
              <div className="card-title">Waste by Category</div>
              <div className="card-subtitle">Distribution (kg)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={2}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{c.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.value}kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="charts-grid">
        {/* Prepared vs Consumed vs Wasted */}
        <div className="card chart-col-6 animate-in animate-delay-3">
          <div className="card-header">
            <div>
              <div className="card-title">Meal-wise Overview</div>
              <div className="card-subtitle">Prepared vs Consumed vs Wasted</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mealData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="meal" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="prepared" name="Prepared" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="consumed" name="Consumed" fill="#0d9488" radius={[4,4,0,0]} />
              <Bar dataKey="wasted" name="Wasted" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Waste Items */}
        <div className="card chart-col-6 animate-in animate-delay-4">
          <div className="card-header">
            <div>
              <div className="card-title">Highest Waste Items</div>
              <div className="card-subtitle">Total waste per food item (kg)</div>
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {topItems.map((item, i) => {
              const maxVal = topItems[0]?.value || 1;
              const pct = (item.value / maxVal) * 100;
              const colors = ['#dc2626', '#ea580c', '#ca8a04', '#0d9488', '#2563eb'];
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{i + 1}. {item.name}</span>
                    <span style={{ fontWeight: 700, color: colors[i] }}>{item.value} kg</span>
                  </div>
                  <div style={{ background: 'var(--bg-app)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: colors[i], borderRadius: 4,
                      transition: 'width 1s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Goals Widget ── */}
      <div className="card animate-in animate-delay-5" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color="var(--color-primary)" /> Monthly Goals & Targets
            </div>
            <div className="card-subtitle">Track your waste reduction progress this month</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            {
              label: 'Waste Rate Target',
              current: kpis.wasteRate,
              target: 10,
              unit: '%',
              note: 'Goal: Keep below 10%',
              lower: true, // lower is better
              color: kpis.wasteRate <= 10 ? 'var(--color-success)' : kpis.wasteRate <= 15 ? 'var(--color-warning)' : 'var(--color-danger)',
            },
            {
              label: 'Daily Cost Lost',
              current: Math.round(kpis.estimatedCostLost),
              target: 2000,
              unit: '₹',
              note: 'Goal: Keep below ₹2,000/day',
              lower: true,
              color: kpis.estimatedCostLost <= 2000 ? 'var(--color-success)' : 'var(--color-danger)',
            },
            {
              label: 'Waste Reduction',
              current: Math.abs(kpis.wasteReduction),
              target: 15,
              unit: '%',
              note: 'Goal: 15% reduction vs last period',
              lower: false,
              color: kpis.wasteReduction >= 15 ? 'var(--color-success)' : kpis.wasteReduction >= 5 ? 'var(--color-warning)' : 'var(--color-danger)',
            },
          ].map((goal, i) => {
            const rawPct = goal.lower
              ? Math.max(0, 100 - (goal.current / goal.target) * 100)
              : Math.min((goal.current / goal.target) * 100, 100);
            const pct = Math.round(Math.max(0, Math.min(rawPct, 100)));
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{goal.label}</span>
                  <span style={{ fontWeight: 700, color: goal.color }}>
                    {goal.unit === '₹' ? `₹${goal.current.toLocaleString('en-IN')}` : `${goal.current}${goal.unit}`}
                  </span>
                </div>
                <div className="goal-progress-bar">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${pct}%`, background: goal.color }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>{goal.note}</span>
                  <span style={{ fontWeight: 600, color: goal.color }}>{pct}% of goal</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WasteWise Insight ── */}
      <div className="insight-card animate-in animate-delay-5" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(22,163,74,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Leaf size={22} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: 15 }}>
              Today's WasteWise Insight
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Your canteen generated <strong style={{ color: 'var(--text-primary)' }}>{kpis.totalWasted} kg</strong> of 
              food waste today.{' '}
              {topItem && (
                <>
                  <strong style={{ color: 'var(--text-primary)' }}>{topItem.name}</strong> contributed the 
                  highest share at <strong style={{ color: 'var(--color-danger)' }}>{topItemShare}%</strong>.{' '}
                  Reducing {topItem.name.toLowerCase()} preparation by approximately 10% during 
                  low-demand meals could significantly reduce waste.
                </>
              )}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                💰 Potential monthly savings: {formatCurrency(Math.round(kpis.estimatedCostLost * 28 * 0.12))}
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => dispatch({ type: 'SET_PAGE', payload: 'recommendations' })}
              >
                View Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
