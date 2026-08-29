// ============================================================
// WasteWise — Settings / Profile Page (Enhanced)
// ============================================================
import React, { useState } from 'react';
import {
  User, Mail, Building2, Shield, Bell, Globe, Moon, Sun,
  Save, Camera, Target, Sliders, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { showToast } from '../components/ui/Toast';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { user, settings } = state;
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    canteenName: user?.canteenName || '',
  });
  const [targets, setTargets] = useState({
    wasteRateTarget: 10,
    dailyCostLimit: 2000,
    wasteReductionGoal: 15,
    dailyPrepLimit: 500,
  });
  const isDark = settings.theme === 'dark';

  const handleSaveProfile = () => {
    showToast({ type: 'success', title: 'Profile saved!', message: 'Your profile has been updated.' });
  };

  const handleSaveTargets = () => {
    showToast({ type: 'success', title: 'Targets saved!', message: 'Your waste reduction targets have been updated.' });
  };

  const toggleSetting = (key: keyof typeof settings, value: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Profile */}
      <div className="card animate-in">
        <div className="card-header">
          <div className="card-title">Profile</div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: 'white',
              boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
            }}>
              {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
            </div>
            <button style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-primary)', color: 'white',
              border: '2px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Camera size={13} />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.name || 'Admin User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{profile.role || 'Administrator'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{profile.canteenName || 'NIT Canteen'}</div>
          </div>
        </div>

        <div className="form-grid">
          {[
            { label: 'Full Name', key: 'name', icon: <User size={15} />, type: 'text', placeholder: 'e.g. Naise Shekhar' },
            { label: 'Email Address', key: 'email', icon: <Mail size={15} />, type: 'email', placeholder: 'naise.shekhar@vsit.edu.in' },
            { label: 'Role', key: 'role', icon: <Shield size={15} />, type: 'text', placeholder: 'e.g. Canteen Administrator' },
            { label: 'Canteen Name', key: 'canteenName', icon: <Building2 size={15} />, type: 'text', placeholder: 'e.g. VSIT Canteen — Main Block' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-control"
                placeholder={placeholder}
                value={profile[key as keyof typeof profile]}
                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            <Save size={15} /> Save Profile
          </button>
        </div>
      </div>

      {/* Waste Reduction Targets */}
      <div className="card animate-in animate-delay-1">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color="var(--color-primary)" /> Waste Reduction Targets
            </div>
            <div className="card-subtitle">Set performance goals to track on your dashboard</div>
          </div>
        </div>

        <div style={{
          padding: '12px 16px', background: 'var(--badge-info-bg)',
          borderRadius: 10, marginBottom: 20, display: 'flex', gap: 10,
          alignItems: 'flex-start', fontSize: 13,
          border: '1px solid rgba(2,132,199,0.2)'
        }}>
          <Info size={15} color="var(--color-info)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            These targets are displayed as progress bars on your dashboard and help track your waste reduction performance.
          </span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Waste Rate Target (%)
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                — keep below this %
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-control"
                min={1} max={50} step={1}
                value={targets.wasteRateTarget}
                onChange={e => setTargets(t => ({ ...t, wasteRateTarget: Number(e.target.value) }))}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13 }}>%</span>
            </div>
            <div style={{ marginTop: 8, height: 6, background: 'var(--bg-app)', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(targets.wasteRateTarget * 2, 100)}%`,
                background: 'var(--color-primary)', transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Industry standard: 8–12%</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Daily Cost Lost Limit (₹)
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                — alert if exceeded
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13 }}>₹</span>
              <input
                type="number"
                className="form-control"
                style={{ paddingLeft: 28 }}
                min={500} max={50000} step={500}
                value={targets.dailyCostLimit}
                onChange={e => setTargets(t => ({ ...t, dailyCostLimit: Number(e.target.value) }))}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Recommended: ₹1,500–₹3,000/day</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Waste Reduction Goal (%)
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                — vs. previous period
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-control"
                min={1} max={50} step={1}
                value={targets.wasteReductionGoal}
                onChange={e => setTargets(t => ({ ...t, wasteReductionGoal: Number(e.target.value) }))}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13 }}>%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Ambitious target: 15–25% reduction</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Daily Prep Limit (kg)
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                — max total daily prep
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-control"
                min={50} max={5000} step={50}
                value={targets.dailyPrepLimit}
                onChange={e => setTargets(t => ({ ...t, dailyPrepLimit: Number(e.target.value) }))}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13 }}>kg</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Set based on your daily student count</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleSaveTargets}>
            <Sliders size={15} /> Save Targets
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card animate-in animate-delay-2">
        <div className="card-header">
          <div className="card-title">Preferences</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Theme */}
          <SettingRow
            icon={isDark ? <Moon size={18} /> : <Sun size={18} />}
            title="Dark Mode"
            description="Switch between light and dark interface"
          >
            <Toggle checked={isDark} onToggle={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: isDark ? 'light' : 'dark' } })} />
          </SettingRow>

          {/* Notifications */}
          <SettingRow
            icon={<Bell size={18} />}
            title="Push Notifications"
            description="Receive in-app notifications about waste alerts"
          >
            <Toggle checked={settings.notifications} onToggle={() => toggleSetting('notifications', !settings.notifications)} />
          </SettingRow>

          {/* Email Alerts */}
          <SettingRow
            icon={<Mail size={18} />}
            title="Email Alerts"
            description="Receive critical waste alerts via email"
          >
            <Toggle checked={settings.emailAlerts} onToggle={() => toggleSetting('emailAlerts', !settings.emailAlerts)} />
          </SettingRow>

          {/* Weekly Report */}
          <SettingRow
            icon={<Globe size={18} />}
            title="Weekly Report"
            description="Receive weekly waste summary report"
            isLast
          >
            <Toggle checked={settings.weeklyReport} onToggle={() => toggleSetting('weeklyReport', !settings.weeklyReport)} />
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone / Account */}
      <div className="card animate-in animate-delay-3" style={{ borderColor: '#fca5a5' }}>
        <div className="card-header">
          <div className="card-title" style={{ color: 'var(--color-danger)' }}>Account Actions</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              dispatch({ type: 'LOGOUT' });
              showToast({ type: 'info', title: 'Logged out', message: 'You have been logged out successfully.' });
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Component ─────────────────────────────────────
function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--color-primary)' : 'var(--border-color)',
        position: 'relative', transition: 'background 0.2s',
        padding: 0, border: 'none', cursor: 'pointer', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </button>
  );
}

// ─── Setting Row ──────────────────────────────────────────
function SettingRow({ icon, title, description, children, isLast }: {
  icon: React.ReactNode; title: string; description: string;
  children: React.ReactNode; isLast?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-color)'
    }}>
      <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{description}</div>
      </div>
      {children}
    </div>
  );
}
