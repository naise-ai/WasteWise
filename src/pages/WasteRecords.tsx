// ============================================================
// WasteWise — Waste Records Page (Connected to REST API)
// ============================================================
import { useState, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Upload, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { WasteRecord, MealType, WasteLevel } from '../types';
import Modal from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { formatCurrency } from '../utils/calculations';
import { wasteService } from '../services/wasteService';

const PAGE_SIZE = 10;

const levelBadge = (level: WasteLevel) => {
  const map = { Low: 'success', Moderate: 'warning', High: 'orange', Critical: 'danger' } as const;
  return <span className={`badge badge-${map[level]}`}>{level}</span>;
};

type SortKey = keyof WasteRecord;
type SortDir = 'asc' | 'desc';

export default function WasteRecords() {
  const { state, dispatch, refreshAllData } = useApp();
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | ''>('');
  const [levelFilter, setLevelFilter] = useState<WasteLevel | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<WasteRecord | null>(null);
  const [editRecord, setEditRecord] = useState<WasteRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const filtered = useMemo(() => {
    let r = state.wasteRecords;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.foodItem.toLowerCase().includes(q) || x.reason.toLowerCase().includes(q) || x.date.includes(q));
    }
    if (mealFilter) r = r.filter(x => x.meal === mealFilter);
    if (levelFilter) r = r.filter(x => x.level === levelFilter);
    if (dateFrom) r = r.filter(x => x.date >= dateFrom);
    if (dateTo) r = r.filter(x => x.date <= dateTo);
    r = [...r].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
    return r;
  }, [state.wasteRecords, search, mealFilter, levelFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} opacity={0.4} />;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await wasteService.deleteRecord(deleteId);
      dispatch({ type: 'DELETE_WASTE_RECORD_LOCAL', payload: deleteId });
      await refreshAllData();
      showToast({ type: 'success', title: 'Record deleted', message: 'Waste record removed from database.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdate = async () => {
    if (!editRecord) return;
    setUpdating(true);
    try {
      const updated = await wasteService.updateRecord(editRecord.id, {
        prepared: editRecord.prepared,
        consumed: editRecord.consumed,
        studentsServed: editRecord.studentsServed,
        reason: editRecord.reason,
        notes: editRecord.notes,
      });
      dispatch({ type: 'UPDATE_WASTE_RECORD_LOCAL', payload: updated });
      await refreshAllData();
      showToast({ type: 'success', title: 'Record updated in Database!' });
      setEditRecord(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search food item, reason, date…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={mealFilter} onChange={e => { setMealFilter(e.target.value as any); setPage(1); }}>
          <option value="">All Meals</option>
          {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="filter-select" value={levelFilter} onChange={e => { setLevelFilter(e.target.value as any); setPage(1); }}>
          <option value="">All Levels</option>
          {['Low', 'Moderate', 'High', 'Critical'].map(l => <option key={l}>{l}</option>)}
        </select>
        {/* Date range */}
        <div className="date-range-bar">
          <Calendar size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
          <span style={{ color: 'var(--text-tertiary)' }}>–</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} title="To date" />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {filtered.length} records
        </span>
        <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'import' })} title="Bulk Import CSV">
          <Upload size={14} /> Import
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('date')}>Date <SortIcon k="date" /></th>
                <th onClick={() => toggleSort('meal')}>Meal <SortIcon k="meal" /></th>
                <th onClick={() => toggleSort('foodItem')}>Food Item <SortIcon k="foodItem" /></th>
                <th onClick={() => toggleSort('prepared')}>Prepared <SortIcon k="prepared" /></th>
                <th onClick={() => toggleSort('consumed')}>Consumed <SortIcon k="consumed" /></th>
                <th onClick={() => toggleSort('wasted')}>Wasted <SortIcon k="wasted" /></th>
                <th onClick={() => toggleSort('wastePercentage')}>Waste % <SortIcon k="wastePercentage" /></th>
                <th onClick={() => toggleSort('reason')}>Reason <SortIcon k="reason" /></th>
                <th onClick={() => toggleSort('level')}>Status <SortIcon k="level" /></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Search size={24} /></div>
                      <h3>No records found</h3>
                      <p>Try adjusting your filters or record new waste data.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.date}</td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 500, padding: '2px 8px',
                        borderRadius: 6, background: 'var(--bg-app)', color: 'var(--text-secondary)'
                      }}>{r.meal}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.foodItem}</td>
                    <td>{r.prepared} kg</td>
                    <td>{r.consumed} kg</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{r.wasted} kg</td>
                    <td>
                      <span style={{ fontWeight: 700, color: r.wastePercentage >= 20 ? 'var(--color-danger)' : r.wastePercentage >= 10 ? 'var(--color-orange)' : 'var(--color-success)' }}>
                        {r.wastePercentage}%
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.reason}</td>
                    <td>{levelBadge(r.level)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" title="View" onClick={() => setViewRecord(r)}>
                          <Eye size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEditRecord(r)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Delete"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => setDeleteId(r.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ paddingBottom: 16 }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Waste Record Details">
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Date', viewRecord.date], ['Meal', viewRecord.meal],
                ['Food Item', viewRecord.foodItem], ['Students Served', viewRecord.studentsServed],
                ['Prepared', `${viewRecord.prepared} kg`], ['Consumed', `${viewRecord.consumed} kg`],
                ['Wasted', `${viewRecord.wasted} kg`], ['Waste %', `${viewRecord.wastePercentage}%`],
                ['Reason', viewRecord.reason], ['Cost Lost', formatCurrency(viewRecord.costLost)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Status:</span>
              {levelBadge(viewRecord.level)}
            </div>
            {viewRecord.notes && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: 8 }}>
                  {viewRecord.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editRecord}
        onClose={() => setEditRecord(null)}
        title="Edit Record"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
              {updating ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editRecord && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Quantity Prepared (kg)</label>
              <input type="number" className="form-control" value={editRecord.prepared}
                onChange={e => {
                  const prep = parseFloat(e.target.value) || 0;
                  const wasted = Math.max(0, prep - editRecord.consumed);
                  const pct = prep > 0 ? parseFloat(((wasted / prep) * 100).toFixed(1)) : 0;
                  setEditRecord(r => r ? { ...r, prepared: prep, wasted, wastePercentage: pct } : r);
                }} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Consumed (kg)</label>
              <input type="number" className="form-control" value={editRecord.consumed}
                onChange={e => {
                  const cons = parseFloat(e.target.value) || 0;
                  const wasted = Math.max(0, editRecord.prepared - cons);
                  const pct = editRecord.prepared > 0 ? parseFloat(((wasted / editRecord.prepared) * 100).toFixed(1)) : 0;
                  setEditRecord(r => r ? { ...r, consumed: cons, wasted, wastePercentage: pct } : r);
                }} />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-control" value={editRecord.reason}
                onChange={e => setEditRecord(r => r ? { ...r, reason: e.target.value as any } : r)}>
                {['Overproduction', 'Low demand', 'Poor quality', 'Spoilage', 'Plate waste', 'Other'].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input type="text" className="form-control" value={editRecord.notes || ''}
                onChange={e => setEditRecord(r => r ? { ...r, notes: e.target.value } : r)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Record"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Are you sure you want to delete this waste record from the SQLite database? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
