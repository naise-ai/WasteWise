// ============================================================
// WasteWise — Reports Page (with jsPDF Export)
// ============================================================
import { useState } from 'react';
import { FileBarChart2, Download, FileText, RefreshCw } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { calculateKPIs, getMealWiseData, getTopWasteItems, formatCurrency, getWasteByCategory } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { showToast } from '../components/ui/Toast';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';

const reportTypes = [
  'Daily Waste Report',
  'Weekly Waste Report',
  'Monthly Waste Report',
  'Food-wise Report',
  'Cost Impact Report',
] as const;

type ReportType = typeof reportTypes[number];

const COLORS = ['#16a34a', '#0d9488', '#2563eb', '#9333ea', '#ca8a04', '#ea580c', '#dc2626'];

export default function Reports() {
  const { wasteRecords, foodItems } = useAppState();
  const [reportType, setReportType] = useState<ReportType>('Weekly Waste Report');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealFilter, setMealFilter] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter records by date range and meal
  const filteredRecords = wasteRecords.filter(r => {
    const inRange = r.date >= dateFrom && r.date <= dateTo;
    const inMeal = !mealFilter || r.meal === mealFilter;
    return inRange && inMeal;
  });

  const days = Math.max(1, Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1);
  const kpis = calculateKPIs(filteredRecords, days);
  const mealData = getMealWiseData(filteredRecords);
  const topItems = getTopWasteItems(filteredRecords, 5);
  const categoryData = getWasteByCategory(filteredRecords, foodItems);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setGenerated(true);
    setLoading(false);
    showToast({ type: 'success', title: 'Report generated!', message: `${reportType} is ready to view.` });
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Meal', 'Food Item', 'Prepared (kg)', 'Consumed (kg)', 'Wasted (kg)', 'Waste %', 'Students', 'Reason', 'Cost Lost (₹)', 'Level'];
    const rows = filteredRecords.map(r => [
      r.date, r.meal, r.foodItem, r.prepared, r.consumed, r.wasted,
      r.wastePercentage, r.studentsServed, r.reason, r.costLost, r.level
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv, ''], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wastewise_${reportType.replace(/ /g, '_').toLowerCase()}_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'CSV exported!', message: `${filteredRecords.length} records exported.` });
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = 20;

      // ── Header ──
      doc.setFillColor(22, 163, 74); // green
      doc.rect(0, 0, pageW, 34, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('WasteWise', margin, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Track Waste. Discover Insights. Serve Smarter.', margin, 21);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(reportType, margin, 30);
      y = 44;

      // ── Meta info ──
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${dateFrom} to ${dateTo}`, margin, y);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageW - margin, y, { align: 'right' });
      if (mealFilter) doc.text(`Meal Filter: ${mealFilter}`, margin, y + 5);
      y += 14;

      // ── KPI Section ──
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageW - margin * 2, 38, 4, 4, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Summary KPIs', margin + 4, y + 8);
      doc.setFont('helvetica', 'normal');

      const kpiData = [
        { label: 'Total Prepared', value: `${kpis.totalPrepared} kg`, color: [37, 99, 235] },
        { label: 'Total Consumed', value: `${kpis.totalConsumed} kg`, color: [13, 148, 136] },
        { label: 'Total Wasted', value: `${kpis.totalWasted} kg`, color: [234, 88, 12] },
        { label: 'Waste Rate', value: `${kpis.wasteRate}%`, color: [220, 38, 38] },
        { label: 'Cost Lost', value: formatCurrency(kpis.estimatedCostLost), color: [147, 51, 234] },
      ];

      const colW = (pageW - margin * 2) / kpiData.length;
      kpiData.forEach((k, i) => {
        const x = margin + i * colW + 4;
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(k.label, x, y + 18);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(k.color[0], k.color[1], k.color[2]);
        doc.text(k.value, x, y + 28);
      });
      y += 48;

      // ── Top Waste Items table ──
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Waste Items', margin, y);
      y += 6;

      // Table header
      doc.setFillColor(22, 163, 74);
      doc.rect(margin, y, pageW - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      const cols = [margin + 4, margin + 14, margin + 80, margin + 120, margin + 152];
      ['#', 'Food Item', 'Total Wasted', 'Est. Cost Lost', 'Share'].forEach((h, i) => {
        doc.text(h, cols[i], y + 5.5);
      });
      y += 8;

      const totalWasted = topItems.reduce((s, x) => s + x.value, 0);
      topItems.forEach((item, i) => {
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        doc.rect(margin, y, pageW - margin * 2, 8, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`${i + 1}`, cols[0], y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(item.name, cols[1], y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.value} kg`, cols[2], y + 5.5);
        const fi = foodItems.find(f => f.name === item.name);
        doc.text(formatCurrency(item.value * (fi?.costPerKg || 70)), cols[3], y + 5.5);
        const share = totalWasted > 0 ? `${((item.value / totalWasted) * 100).toFixed(1)}%` : '—';
        doc.text(share, cols[4], y + 5.5);
        y += 8;
      });
      y += 6;

      // ── Meal-wise Summary ──
      if (y + 60 < doc.internal.pageSize.getHeight()) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Meal-wise Summary', margin, y);
        y += 6;

        doc.setFillColor(22, 163, 74);
        doc.rect(margin, y, pageW - margin * 2, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const mCols = [margin + 4, margin + 50, margin + 95, margin + 135];
        ['Meal', 'Prepared', 'Consumed', 'Wasted'].forEach((h, i) => doc.text(h, mCols[i], y + 5.5));
        y += 8;

        mealData.forEach((m, i) => {
          doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
          doc.rect(margin, y, pageW - margin * 2, 8, 'F');
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.text(m.meal, mCols[0], y + 5.5);
          doc.text(`${m.prepared} kg`, mCols[1], y + 5.5);
          doc.text(`${m.consumed} kg`, mCols[2], y + 5.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(234, 88, 12);
          doc.text(`${m.wasted} kg`, mCols[3], y + 5.5);
          y += 8;
        });
      }

      // ── Insights box ──
      y += 10;
      if (y + 40 < doc.internal.pageSize.getHeight()) {
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(margin, y, pageW - margin * 2, 32, 4, 4, 'F');
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Insights', margin + 4, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const insights = [
          `• Overall waste rate: ${kpis.wasteRate}% — ${kpis.wasteRate > 15 ? 'above' : kpis.wasteRate > 10 ? 'near' : 'within'} the 10% target`,
          `• Top waste item: ${topItems[0]?.name || '—'} (${topItems[0]?.value || 0} kg)`,
          `• Potential savings if waste reduced to 8%: ${formatCurrency(Math.round(kpis.estimatedCostLost * 0.3))}`,
        ];
        insights.forEach((text, i) => {
          doc.text(text, margin + 4, y + 16 + i * 6);
        });
        y += 40;
      }

      // ── Footer ──
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by WasteWise — Track Waste. Discover Insights. Serve Smarter.', pageW / 2, pageH - 4.5, { align: 'center' });

      doc.save(`wastewise_${reportType.replace(/ /g, '_').toLowerCase()}_${dateFrom}_to_${dateTo}.pdf`);
      showToast({ type: 'success', title: 'PDF exported!', message: 'Report saved to your device.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'PDF export failed', message: err.message });
    }
  };

  return (
    <div>
      {/* Configuration Card */}
      <div className="card animate-in" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Report Configuration</div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select className="form-control" value={reportType} onChange={e => { setReportType(e.target.value as ReportType); setGenerated(false); }}>
              {reportTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input type="date" className="form-control" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setGenerated(false); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Date To</label>
            <input type="date" className="form-control" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setGenerated(false); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Meal (optional)</label>
            <select className="form-control" value={mealFilter} onChange={e => setMealFilter(e.target.value)}>
              <option value="">All Meals</option>
              {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><FileBarChart2 size={15} /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {generated && (
        <div className="animate-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{reportType}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Period: {dateFrom} to {dateTo} · {filteredRecords.length} records · Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
                  <Download size={14} /> PDF
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleExportCSV}>
                  <FileText size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total Prepared', value: `${kpis.totalPrepared} kg`, color: '#2563eb' },
                { label: 'Total Consumed', value: `${kpis.totalConsumed} kg`, color: '#0d9488' },
                { label: 'Total Wasted', value: `${kpis.totalWasted} kg`, color: '#ea580c' },
                { label: 'Waste Rate', value: `${kpis.wasteRate}%`, color: '#dc2626' },
                { label: 'Cost Lost', value: formatCurrency(kpis.estimatedCostLost), color: '#9333ea' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 16, background: 'var(--bg-app)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Key Insights */}
            <div style={{ background: 'var(--bg-app)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Key Insights</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--color-danger)' }}>●</span>
                  Overall waste rate is {kpis.wasteRate}% — {kpis.wasteRate > 15 ? 'above' : 'near'} the 10% target
                </li>
                <li style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--color-orange)' }}>●</span>
                  Top waste item: <strong style={{ color: 'var(--text-primary)' }}>{topItems[0]?.name || '—'}</strong> ({topItems[0]?.value || 0} kg total)
                </li>
                <li style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--color-primary)' }}>●</span>
                  Estimated cost recovery if waste reduced to 8%: {formatCurrency(Math.round(kpis.estimatedCostLost * 0.3))}
                </li>
              </ul>
            </div>

            {/* Charts */}
            <div className="charts-grid" style={{ marginBottom: 24 }}>
              <div className="card chart-col-6" style={{ padding: 16 }}>
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <div className="card-title">Meal-wise Summary</div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={mealData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="meal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="prepared" name="Prepared" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="consumed" name="Consumed" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wasted" name="Wasted" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card chart-col-6" style={{ padding: 16 }}>
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <div className="card-title">Waste by Category</div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Records Table */}
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Top 5 Waste Items</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Food Item</th>
                      <th>Total Wasted (kg)</th>
                      <th>Est. Cost Lost</th>
                      <th>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item, i) => {
                      const totalWaste = topItems.reduce((s, x) => s + x.value, 0);
                      const share = totalWaste > 0 ? ((item.value / totalWaste) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>#{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.value} kg</td>
                          <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            {formatCurrency(item.value * (foodItems.find(f => f.name === item.name)?.costPerKg || 70))}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--bg-app)', borderRadius: 3 }}>
                                <div style={{ width: `${share}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 35 }}>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!generated && (
        <div className="empty-state">
          <div className="empty-state-icon"><FileBarChart2 size={28} /></div>
          <h3>No report generated yet</h3>
          <p>Configure your report options above and click "Generate Report".</p>
        </div>
      )}
    </div>
  );
}
