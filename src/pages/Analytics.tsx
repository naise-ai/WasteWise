// ============================================================
// WasteWise — Analytics Page
// ============================================================
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useAppState } from '../context/AppContext';
import {
  getTrendData, getWasteByCategory, getMealWiseData,
  getWasteReasonBreakdown, getTopWasteItems, calculateKPIs, formatCurrency
} from '../utils/calculations';
import { TrendingDown, BarChart3, Calendar, Package } from 'lucide-react';

const COLORS = ['#16a34a', '#0d9488', '#2563eb', '#9333ea', '#ca8a04', '#ea580c', '#dc2626'];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{p.value} {p.name === 'Waste %' ? '%' : 'kg'}</strong></p>
      ))}
    </div>
  );
};

type TabId = 'overview' | 'trends' | 'foodwise' | 'mealwise' | 'daywise' | 'reasons';

export default function Analytics() {
  const { wasteRecords, foodItems } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedFood, setSelectedFood] = useState('Rice');
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);

  const kpis30 = calculateKPIs(wasteRecords, 30);
  const trendData = getTrendData(wasteRecords, trendDays);
  const categoryData = getWasteByCategory(wasteRecords, foodItems);
  const mealData = getMealWiseData(wasteRecords);
  const reasonData = getWasteReasonBreakdown(wasteRecords);
  const topItems = getTopWasteItems(wasteRecords, 8);

  // Day-wise analysis
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayWiseData = dayNames.map(day => {
    const dayRecords = wasteRecords.filter(r => {
      const d = new Date(r.date);
      return dayNames[d.getDay()] === day;
    });
    const wasted = parseFloat(dayRecords.reduce((s, r) => s + r.wasted, 0).toFixed(1));
    const prepared = parseFloat(dayRecords.reduce((s, r) => s + r.prepared, 0).toFixed(1));
    const pct = prepared > 0 ? parseFloat(((wasted / prepared) * 100).toFixed(1)) : 0;
    return { day, wasted, prepared, wasteRate: pct };
  });

  // Food-wise analysis
  const foodRecords = wasteRecords.filter(r => r.foodItem === selectedFood);
  const foodTrend = getTrendData(foodRecords, 14);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'trends', label: 'Trends', icon: <TrendingDown size={14} /> },
    { id: 'foodwise', label: 'Food-wise', icon: <Package size={14} /> },
    { id: 'mealwise', label: 'Meal-wise', icon: <Calendar size={14} /> },
    { id: 'daywise', label: 'Day-wise', icon: <Calendar size={14} /> },
    { id: 'reasons', label: 'Reasons', icon: <BarChart3 size={14} /> },
  ] as const;

  const avgDailyWaste = kpis30.totalWasted > 0 ? parseFloat((kpis30.totalWasted / 30).toFixed(1)) : 0;
  const highestDay = dayWiseData.reduce((a, b) => a.wasted > b.wasted ? a : b, dayWiseData[0]);

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(t.id as TabId)}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Avg. Daily Waste (30d)', value: `${avgDailyWaste} kg`, color: 'var(--color-orange)' },
              { label: 'Highest Waste Day', value: highestDay?.day || '—', color: 'var(--color-danger)' },
              { label: 'Top Waste Food', value: topItems[0]?.name || '—', color: 'var(--color-primary)' },
              { label: 'Avg. Waste % (30d)', value: `${kpis30.wasteRate}%`, color: 'var(--color-warning)' },
              { label: 'Est. Cost Loss (30d)', value: formatCurrency(kpis30.estimatedCostLost), color: 'var(--color-danger)' },
            ].map((item, i) => (
              <div key={i} className="card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid">
            <div className="card chart-col-6">
              <div className="card-header">
                <div className="card-title">Waste by Category</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
                      {payload[0].name}: <strong>{payload[0].value} kg</strong>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card chart-col-6">
              <div className="card-header">
                <div className="card-title">Top 8 Waste Items</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topItems} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Wasted" radius={[0,4,4,0]}>
                    {topItems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDS ── */}
      {activeTab === 'trends' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Waste Trends</div>
              <div className="card-subtitle">Historical waste pattern</div>
            </div>
            <div className="tab-group">
              {([7, 30, 90] as const).map(d => (
                <button key={d} className={`tab-btn ${trendDays === d ? 'active' : ''}`} onClick={() => setTrendDays(d)}>
                  {d === 7 ? '7 Days' : d === 30 ? '30 Days' : '3 Months'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="prepared" name="Prepared" stroke="#2563eb" fill="none" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="consumed" name="Consumed" stroke="#0d9488" fill="none" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="wasted" name="Wasted" stroke="#16a34a" fill="url(#grad1)" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── FOOD-WISE ── */}
      {activeTab === 'foodwise' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Food-wise Analysis</div>
              <select className="filter-select" value={selectedFood} onChange={e => setSelectedFood(e.target.value)}>
                {[...new Set(wasteRecords.map(r => r.foodItem))].sort().map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            {(() => {
              const fi = foodItems.find(f => f.name === selectedFood);
              if (!fi) return null;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Avg. Prepared', value: `${fi.avgPrepared} kg`, color: '#2563eb' },
                    { label: 'Avg. Consumed', value: `${fi.avgConsumed} kg`, color: '#0d9488' },
                    { label: 'Avg. Wasted', value: `${fi.avgWasted} kg`, color: '#ea580c' },
                    { label: 'Waste %', value: `${fi.avgWastePercentage}%`, color: '#dc2626' },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--bg-app)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={foodTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="prepared" name="Prepared" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="wasted" name="Wasted" stroke="#dc2626" strokeWidth={2} dot={{ r: 4, fill: '#dc2626' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── MEAL-WISE ── */}
      {activeTab === 'mealwise' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Meal-wise Analysis</div></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={mealData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="meal" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="prepared" name="Prepared" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="consumed" name="Consumed" fill="#0d9488" radius={[4,4,0,0]} />
              <Bar dataKey="wasted" name="Wasted" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
            {mealData.map(m => (
              <div key={m.meal} style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '12px 8px', borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{m.meal}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-orange)' }}>{m.wasted} kg</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>total waste</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DAY-WISE ── */}
      {activeTab === 'daywise' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Day-wise Waste Analysis</div></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayWiseData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="wasted" name="Wasted" radius={[6,6,0,0]}>
                {dayWiseData.map((d, i) => (
                  <Cell key={i} fill={d.wasteRate >= 20 ? '#dc2626' : d.wasteRate >= 15 ? '#ea580c' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginTop: 20 }}>
            {dayWiseData.map(d => (
              <div key={d.day} style={{ textAlign: 'center', background: 'var(--bg-app)', padding: '10px 4px', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.day}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: d.wasteRate >= 20 ? 'var(--color-danger)' : 'var(--color-primary)', marginTop: 4 }}>
                  {d.wasteRate}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>waste</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REASONS ── */}
      {activeTab === 'reasons' && (
        <div className="charts-grid">
          <div className="card chart-col-6">
            <div className="card-header"><div className="card-title">Waste Reasons Distribution</div></div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={reasonData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} fontSize={11} labelLine={false}>
                  {reasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
                    {payload[0].name}: <strong>{payload[0].value} kg</strong>
                  </div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-col-6">
            <div className="card-header"><div className="card-title">Reason Breakdown</div></div>
            {reasonData.sort((a, b) => b.value - a.value).map((r, i) => {
              const total = reasonData.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? ((r.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                    <span style={{ fontWeight: 700, color: COLORS[i] }}>{r.value} kg ({pct}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-app)', borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i], borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
