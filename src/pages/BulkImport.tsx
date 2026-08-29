// ============================================================
// WasteWise — Bulk CSV Import Page
// ============================================================
import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Download, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Trash2, RefreshCw, Info
} from 'lucide-react';
import Papa from 'papaparse';
import { useApp } from '../context/AppContext';
import { wasteService } from '../services/wasteService';
import { showToast } from '../components/ui/Toast';

interface ParsedRow {
  date: string;
  meal: string;
  foodItem: string;
  prepared: string;
  consumed: string;
  studentsServed: string;
  reason: string;
  notes?: string;
  // validation
  _valid: boolean;
  _errors: string[];
}

const VALID_MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
const VALID_REASONS = ['Overproduction', 'Low demand', 'Poor quality', 'Spoilage', 'Plate waste', 'Other'];
const TEMPLATE_HEADERS = ['date', 'meal', 'foodItem', 'prepared', 'consumed', 'studentsServed', 'reason', 'notes'];

function validateRow(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  // date
  if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push('Invalid date (use YYYY-MM-DD)');
  // meal
  if (!VALID_MEALS.includes(row.meal)) errors.push(`Meal must be one of: ${VALID_MEALS.join(', ')}`);
  // food item
  if (!row.foodItem?.trim()) errors.push('Food item is required');
  // prepared
  const prep = parseFloat(row.prepared);
  if (isNaN(prep) || prep <= 0) errors.push('Prepared must be > 0');
  // consumed
  const cons = parseFloat(row.consumed);
  if (isNaN(cons) || cons < 0) errors.push('Consumed must be ≥ 0');
  if (!isNaN(prep) && !isNaN(cons) && cons > prep) errors.push('Consumed cannot exceed prepared');
  // students
  const students = parseInt(row.studentsServed);
  if (isNaN(students) || students < 0) errors.push('Students served must be ≥ 0');
  // reason
  if (!VALID_REASONS.includes(row.reason)) errors.push(`Reason must be one of: ${VALID_REASONS.join(', ')}`);

  return { valid: errors.length === 0, errors };
}

function downloadTemplate() {
  const sampleRows = [
    ['2026-08-01', 'Lunch', 'Dal Tadka', '50', '42', '320', 'Low demand', 'Fewer students on Friday'],
    ['2026-08-01', 'Dinner', 'Chapati', '30', '25', '200', 'Overproduction', ''],
    ['2026-08-02', 'Breakfast', 'Poha', '20', '18', '300', 'Plate waste', ''],
  ];
  const csv = [TEMPLATE_HEADERS, ...sampleRows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wastewise_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImport() {
  const { state, dispatch, refreshAllData } = useApp();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: ParsedRow[] = (result.data as any[]).map((raw) => {
          // Normalize keys (case-insensitive)
          const r: any = {};
          for (const k of Object.keys(raw)) {
            r[k.trim().toLowerCase().replace(/\s+/g, '')] = String(raw[k] || '').trim();
          }
          // Map common variations
          const row = {
            date: r.date || r['date(yyyy-mm-dd)'] || '',
            meal: r.meal || '',
            foodItem: r.fooditem || r['food_item'] || r['fooditem'] || '',
            prepared: r.prepared || r['prepared(kg)'] || '',
            consumed: r.consumed || r['consumed(kg)'] || '',
            studentsServed: r.studentsserved || r['students_served'] || r['studentsserved'] || '',
            reason: r.reason || '',
            notes: r.notes || '',
          };
          const { valid, errors } = validateRow(row);
          return { ...row, _valid: valid, _errors: errors };
        });
        setRows(parsed);
        setStep('preview');
      },
      error: (err) => {
        showToast({ type: 'error', title: 'Parse error', message: err.message });
      }
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) parseFile(file);
    else showToast({ type: 'error', title: 'Invalid file', message: 'Please upload a .csv file.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const validRows = rows.filter(r => r._valid);
  const invalidRows = rows.filter(r => !r._valid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let count = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        // Find food item by name
        const fi = state.foodItems.find(f => f.name.toLowerCase() === row.foodItem.toLowerCase());
        if (!fi) {
          errors.push(`Food item "${row.foodItem}" not found in database.`);
          continue;
        }
        const created = await wasteService.createRecord({
          date: row.date,
          meal: row.meal,
          foodItemId: fi.id,
          foodItemName: fi.name,
          prepared: parseFloat(row.prepared),
          consumed: parseFloat(row.consumed),
          studentsServed: parseInt(row.studentsServed),
          reason: row.reason,
          notes: row.notes || undefined,
        });
        dispatch({ type: 'ADD_WASTE_RECORD_LOCAL', payload: created });
        count++;
      } catch (err: any) {
        errors.push(`Row (${row.date}/${row.foodItem}): ${err.message}`);
      }
    }

    await refreshAllData();
    setImportedCount(count);
    setStep('done');
    setImporting(false);

    if (errors.length > 0) {
      showToast({
        type: 'warning', title: `${count} records imported`,
        message: `${errors.length} row(s) failed: ${errors[0]}`
      });
    } else {
      showToast({ type: 'success', title: `${count} records imported successfully!`, message: 'Database updated.' });
    }
  };

  const reset = () => { setRows([]); setStep('upload'); setImportedCount(0); };

  return (
    <div>
      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', padding: '6px 8px', width: 'fit-content' }}>
        {(['upload', 'preview', 'done'] as const).map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: step === s ? 'var(--color-primary)' : 'transparent',
              color: step === s ? 'white' : step > s ? 'var(--color-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>
              {step > s || step === 'done' ? <CheckCircle2 size={14} /> : <span style={{ fontWeight: 700 }}>{i + 1}</span>}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
            {i < 2 && <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <ArrowRight size={14} />
            </div>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Instructions */}
          <div className="card animate-in">
            <div className="card-header">
              <div className="card-title">Import Instructions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { num: '1', text: 'Download the CSV template below' },
                { num: '2', text: 'Fill in your waste records — one row per meal-food combination per day' },
                { num: '3', text: 'Make sure food item names match exactly what\'s in your Food Items database' },
                { num: '4', text: 'Upload the file and review the preview before importing' },
              ].map(step => (
                <div key={step.num} className="import-step">
                  <div className="import-step-num">{step.num}</div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{step.text}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-app)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Valid Values
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><strong>Meals:</strong> {VALID_MEALS.join(', ')}</div>
                <div><strong>Reasons:</strong> {VALID_REASONS.join(', ')}</div>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 16, width: 'fit-content' }} onClick={downloadTemplate}>
              <Download size={15} /> Download Template CSV
            </button>
          </div>

          {/* Dropzone */}
          <div
            className={`import-dropzone animate-in animate-delay-1 ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--color-primary-pale), var(--color-teal-pale))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Upload size={26} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Drop your CSV file here
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                or <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>click to browse</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Accepts .csv files only</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary bar */}
          <div className="card animate-in">
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{rows.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total rows</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>{validRows.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Valid</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: invalidRows.length > 0 ? 'var(--color-danger)' : 'var(--text-tertiary)' }}>{invalidRows.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Errors</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={reset}>
                  <Trash2 size={14} /> Start Over
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                >
                  {importing
                    ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing…</>
                    : <><Upload size={14} /> Import {validRows.length} Records</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Preview table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Data Preview</div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Only valid rows will be imported</span>
            </div>
            <div className="table-container import-preview-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Food Item</th>
                    <th>Prepared</th>
                    <th>Consumed</th>
                    <th>Students</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ background: row._valid ? 'transparent' : 'rgba(220,38,38,0.04)' }}>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{i + 1}</td>
                      <td>{row.date}</td>
                      <td>{row.meal}</td>
                      <td style={{ fontWeight: 500 }}>{row.foodItem}</td>
                      <td>{row.prepared} kg</td>
                      <td>{row.consumed} kg</td>
                      <td>{row.studentsServed}</td>
                      <td style={{ fontSize: 12 }}>{row.reason}</td>
                      <td>
                        {row._valid ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: 12, fontWeight: 500 }}>
                            <CheckCircle2 size={13} /> Valid
                          </span>
                        ) : (
                          <div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-danger)', fontSize: 12, fontWeight: 500 }}>
                              <XCircle size={13} /> Error
                            </span>
                            {row._errors.map((e, ei) => (
                              <div key={ei} style={{ fontSize: 10, color: 'var(--color-danger)', marginTop: 2, lineHeight: 1.3 }}>{e}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invalidRows.length > 0 && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(220,38,38,0.06)', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)', fontSize: 13 }}>
              <AlertTriangle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{invalidRows.length} row(s) have errors</strong> and will be skipped.
                Fix them in your CSV and re-upload to import all records.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && (
        <div className="card animate-in" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--color-primary-pale), var(--color-teal-pale))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={36} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Import Complete!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Successfully imported <strong style={{ color: 'var(--text-primary)' }}>{importedCount} waste records</strong> into the database.
            The dashboard and analytics have been updated.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={reset}>
              <Upload size={15} /> Import More
            </button>
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'records' })}>
              <FileText size={15} /> View Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
