// ============================================================
// WasteWise — Food Items Page (Connected to REST API)
// ============================================================
import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { FoodItem, FoodCategory, WasteLevel } from '../types';
import Modal from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { foodItemService } from '../services/foodItemService';

const levelBadge = (level: WasteLevel) => {
  const map = { Low: 'success', Moderate: 'warning', High: 'orange', Critical: 'danger' } as const;
  return <span className={`badge badge-${map[level]}`}>{level}</span>;
};

const categories: FoodCategory[] = ['Rice & Grains', 'Breads', 'Dal & Lentils', 'Vegetables', 'Curry', 'Snacks', 'Beverages', 'Desserts', 'Other'];

const emptyForm = {
  name: '', category: 'Rice & Grains' as FoodCategory,
  costPerKg: '',
};

export default function FoodItems() {
  const { state, dispatch, refreshAllData } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let items = state.foodItems;
    if (search) items = items.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) items = items.filter(f => f.category === catFilter);
    return items;
  }, [state.foodItems, search, catFilter]);

  const validate = (f: typeof form) => {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = 'Name is required';
    if (!f.costPerKg || parseFloat(f.costPerKg) <= 0) errs.costPerKg = 'Must be > 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validate(form)) return;
    setSubmitting(true);
    try {
      const created = await foodItemService.createFoodItem({
        name: form.name,
        category: form.category,
        costPerKg: parseFloat(form.costPerKg),
      });

      dispatch({ type: 'ADD_FOOD_ITEM_LOCAL', payload: created });
      showToast({ type: 'success', title: 'Food item added!', message: `${created.name} added to SQLite database.` });
      setForm(emptyForm);
      setAddOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add item', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSubmitting(true);
    try {
      const updated = await foodItemService.updateFoodItem(editItem.id, {
        name: editItem.name,
        category: editItem.category,
        costPerKg: editItem.costPerKg,
      });

      dispatch({ type: 'UPDATE_FOOD_ITEM_LOCAL', payload: updated });
      await refreshAllData();
      showToast({ type: 'success', title: 'Food item updated!' });
      setEditItem(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await foodItemService.deleteFoodItem(deleteId);
      dispatch({ type: 'DELETE_FOOD_ITEM_LOCAL', payload: deleteId });
      showToast({ type: 'success', title: 'Food item deleted.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input type="text" className="search-input" placeholder="Search food items…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} DB items</span>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map((item, i) => (
          <div key={item.id} className="card animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{item.name}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 6 }}>
                  {item.category}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-icon" onClick={() => setEditItem({ ...item })}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteId(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Avg. Prepared', value: `${item.avgPrepared} kg` },
                { label: 'Avg. Consumed', value: `${item.avgConsumed} kg` },
                { label: 'Avg. Wasted', value: `${item.avgWasted} kg` },
                { label: 'Cost/kg', value: `₹${item.costPerKg}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {levelBadge(item.level)}
              <span style={{
                fontSize: 16, fontWeight: 800,
                color: item.avgWastePercentage >= 20 ? 'var(--color-danger)' : item.avgWastePercentage >= 10 ? 'var(--color-orange)' : 'var(--color-success)'
              }}>
                {item.avgWastePercentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10, background: 'var(--bg-app)', borderRadius: 4, height: 6 }}>
              <div style={{
                width: `${Math.min(item.avgWastePercentage * 2, 100)}%`, height: '100%',
                background: item.avgWastePercentage >= 20 ? 'var(--color-danger)' : item.avgWastePercentage >= 10 ? 'var(--color-orange)' : 'var(--color-success)',
                borderRadius: 4, transition: 'width 1s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={24} /></div>
          <h3>No food items found</h3>
          <p>Try adjusting your search or add a new food item.</p>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}><Plus size={15} /> Add Item</button>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setForm(emptyForm); setErrors({}); }}
        title="Add Food Item"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Item'}
          </button>
        </>}>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Food Name *</label>
            <input type="text" className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Chole Bhature" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FoodCategory }))}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cost per kg (₹) *</label>
            <input type="number" className={`form-control ${errors.costPerKg ? 'error' : ''}`}
              placeholder="e.g. 80" value={form.costPerKg} onChange={e => setForm(f => ({ ...f, costPerKg: e.target.value }))} />
            {errors.costPerKg && <span className="form-error">{errors.costPerKg}</span>}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)}
        title="Edit Food Item"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </>}>
        {editItem && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Food Name</label>
              <input type="text" className="form-control" value={editItem.name}
                onChange={e => setEditItem(f => f ? { ...f, name: e.target.value } : f)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={editItem.category}
                onChange={e => setEditItem(f => f ? { ...f, category: e.target.value as any } : f)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost per kg (₹)</label>
              <input type="number" className="form-control" value={editItem.costPerKg}
                onChange={e => setEditItem(f => f ? { ...f, costPerKg: parseFloat(e.target.value) || 0 } : f)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Food Item" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </>}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Are you sure you want to delete this food item? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
