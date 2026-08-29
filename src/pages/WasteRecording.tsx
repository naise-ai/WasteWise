// ============================================================
// WasteWise — Waste Recording Page (Connected to REST API)
// ============================================================
import { useState } from 'react';
import { Save, RotateCcw, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWasteLevel } from '../utils/calculations';
import { wasteService } from '../services/wasteService';
import { showToast } from '../components/ui/Toast';
import { format } from 'date-fns';

interface FormState {
  date: string;
  meal: string;
  foodItem: string;
  foodItemId: string;
  prepared: string;
  consumed: string;
  studentsServed: string;
  reason: string;
  notes: string;
}

const emptyForm: FormState = {
  date: format(new Date(), 'yyyy-MM-dd'),
  meal: '',
  foodItem: '',
  foodItemId: '',
  prepared: '',
  consumed: '',
  studentsServed: '',
  reason: '',
  notes: '',
};

export default function WasteRecording() {
  const { state, dispatch, refreshAllData } = useApp();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  // Live calculations
  const prep = parseFloat(form.prepared) || 0;
  const cons = parseFloat(form.consumed) || 0;
  const wasted = Math.max(0, parseFloat((prep - cons).toFixed(2)));
  const wastePct = prep > 0 ? parseFloat(((wasted / prep) * 100).toFixed(1)) : 0;
  const level = getWasteLevel(wastePct);

  const levelColors = {
    Low: '#16a34a', Moderate: '#ca8a04', High: '#ea580c', Critical: '#dc2626'
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(e2 => ({ ...e2, [field]: undefined }));
  };

  const setFoodItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const fi = state.foodItems.find(f => f.id === id);
    if (fi) {
      setForm(f => ({ ...f, foodItem: fi.name, foodItemId: fi.id }));
    } else {
      setForm(f => ({ ...f, foodItem: '', foodItemId: '' }));
    }
    setErrors(e2 => ({ ...e2, foodItem: undefined }));
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.meal) errs.meal = 'Meal type is required';
    if (!form.foodItemId) errs.foodItem = 'Food item is required';
    if (!form.prepared || prep <= 0) errs.prepared = 'Quantity must be > 0';
    if (!form.consumed || cons < 0) errs.consumed = 'Cannot be negative';
    if (cons > prep) errs.consumed = 'Consumed cannot exceed prepared';
    if (!form.studentsServed || parseInt(form.studentsServed) <= 0) errs.studentsServed = 'Enter students served';
    if (!form.reason) errs.reason = 'Select a reason';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const newRecord = await wasteService.createRecord({
        date: form.date,
        meal: form.meal,
        foodItemId: form.foodItemId,
        foodItemName: form.foodItem,
        prepared: prep,
        consumed: cons,
        studentsServed: parseInt(form.studentsServed),
        reason: form.reason,
        notes: form.notes || undefined,
      });

      dispatch({ type: 'ADD_WASTE_RECORD_LOCAL', payload: newRecord });
      await refreshAllData(); // refresh dashboard KPIs & recommendations triggered by engine
      showToast({ type: 'success', title: 'Record saved to Database!', message: `Waste record for ${form.foodItem} created successfully.` });
      setForm(emptyForm);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to save record', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="card animate-in">
        <div className="card-header">
          <div>
            <div className="card-title">Record Food Waste</div>
            <div className="card-subtitle">Log today's food preparation and waste data to SQLite database</div>
          </div>
        </div>

        <div className="form-grid">
          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className={`form-control ${errors.date ? 'error' : ''}`}
              value={form.date} onChange={set('date')} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          {/* Meal */}
          <div className="form-group">
            <label className="form-label">Meal *</label>
            <select className={`form-control ${errors.meal ? 'error' : ''}`}
              value={form.meal} onChange={set('meal')}>
              <option value="">Select meal</option>
              {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.meal && <span className="form-error">{errors.meal}</span>}
          </div>

          {/* Food Item */}
          <div className="form-group">
            <label className="form-label">Food Item *</label>
            <select className={`form-control ${errors.foodItem ? 'error' : ''}`}
              value={form.foodItemId} onChange={setFoodItem}>
              <option value="">Select food item</option>
              {state.foodItems.filter(f => f.isActive).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.foodItem && <span className="form-error">{errors.foodItem}</span>}
          </div>

          {/* Students Served */}
          <div className="form-group">
            <label className="form-label">Students Served *</label>
            <input type="number" min="0" className={`form-control ${errors.studentsServed ? 'error' : ''}`}
              placeholder="e.g. 350" value={form.studentsServed} onChange={set('studentsServed')} />
            {errors.studentsServed && <span className="form-error">{errors.studentsServed}</span>}
          </div>

          {/* Prepared */}
          <div className="form-group">
            <label className="form-label">Quantity Prepared (kg) *</label>
            <input type="number" min="0" step="0.1" className={`form-control ${errors.prepared ? 'error' : ''}`}
              placeholder="e.g. 60" value={form.prepared} onChange={set('prepared')} />
            {errors.prepared && <span className="form-error">{errors.prepared}</span>}
          </div>

          {/* Consumed */}
          <div className="form-group">
            <label className="form-label">Quantity Consumed (kg) *</label>
            <input type="number" min="0" step="0.1" className={`form-control ${errors.consumed ? 'error' : ''}`}
              placeholder="e.g. 48" value={form.consumed} onChange={set('consumed')} />
            {errors.consumed && <span className="form-error">{errors.consumed}</span>}
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">Reason for Waste *</label>
            <select className={`form-control ${errors.reason ? 'error' : ''}`}
              value={form.reason} onChange={set('reason')}>
              <option value="">Select reason</option>
              {['Overproduction', 'Low demand', 'Poor quality', 'Spoilage', 'Plate waste', 'Other'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.reason && <span className="form-error">{errors.reason}</span>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input type="text" className="form-control"
              placeholder="Any additional observations" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {/* Live Calculation */}
        {(prep > 0 || cons > 0) && (
          <div style={{
            marginTop: 20, padding: '16px 20px',
            background: 'var(--bg-app)', borderRadius: 10,
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calculator size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Calculation</span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Prepared', value: `${prep} kg`, color: '#2563eb' },
                { label: 'Consumed', value: `${cons} kg`, color: '#0d9488' },
                { label: 'Wasted', value: `${wasted} kg`, color: '#ea580c' },
                { label: 'Waste %', value: `${wastePct}%`, color: levelColors[level] },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            {prep > 0 && (
              <div className={`waste-indicator ${level.toLowerCase()}`} style={{ marginTop: 12 }}>
                {level === 'Low' && <CheckCircle2 size={15} />}
                {level !== 'Low' && <AlertCircle size={15} />}
                <span>
                  <strong>{level} Waste Level</strong> — {wastePct}% waste rate
                  {level === 'Low' && ' — Excellent! Well within target.'}
                  {level === 'Moderate' && ' — Monitor closely. Target is below 10%.'}
                  {level === 'High' && ' — Action recommended. Consider reducing preparation.'}
                  {level === 'Critical' && ' — Immediate action required!'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setForm(emptyForm)}>
            <RotateCcw size={15} /> Clear
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 6 }}>⏳</span>Saving to DB…</>
            ) : (
              <><Save size={15} /> Save Record</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
