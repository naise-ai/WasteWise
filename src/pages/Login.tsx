// ============================================================
// WasteWise — Login Page (Connected to REST API)
// ============================================================
import { useState } from 'react';
import { Eye, EyeOff, Leaf, TrendingDown, BarChart2, Lightbulb, AlertCircle, Zap } from 'lucide-react';
import { useAppDispatch } from '../context/AppContext';
import { authService } from '../services/authService';
import '../styles/login.css';

const DEMO_EMAIL = 'naise.shekhar@vsit.edu.in';
const DEMO_PASSWORD = 'admin@123';

export default function Login() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true);

    try {
      const { user } = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
    setLoading(true);
    try {
      const { user } = await authService.login(DEMO_EMAIL, DEMO_PASSWORD);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err: any) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left Panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Leaf size={26} color="white" />
          </div>
          <span className="login-brand-name">WasteWise</span>
        </div>

        <div className="login-hero">
          <h1>
            Track Waste.<br />
            <span>Discover Insights.</span><br />
            Serve Smarter.
          </h1>
          <p>
            WasteWise helps canteen administrators monitor food waste,
            identify patterns, and receive smart recommendations to
            reduce waste and save costs.
          </p>
        </div>

        <div className="login-illustration">
          {[
            { icon: <TrendingDown size={16} color="#4ade80" />, bg: 'rgba(74,222,128,0.15)', label: 'Waste Trend', value: '↓12.8%' },
            { icon: <BarChart2 size={16} color="#2dd4bf" />, bg: 'rgba(45,212,191,0.15)', label: 'Analytics', value: 'Live API' },
            { icon: <Lightbulb size={16} color="#fbbf24" />, bg: 'rgba(251,191,36,0.15)', label: 'Recommendations', value: 'Rule Engine' },
            { icon: <Zap size={16} color="#a78bfa" />, bg: 'rgba(167,139,250,0.15)', label: 'Database', value: 'SQLite' },
          ].map((item, i) => (
            <div key={i} className="login-mini-card">
              <div className="login-mini-card-icon" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="login-stats">
          {[
            { value: '55+', label: 'DB Records' },
            { value: '15', label: 'Food Items' },
            { value: 'FastAPI', label: 'Backend' },
          ].map((s, i) => (
            <div key={i} className="login-stat">
              <div className="login-stat-value">{s.value}</div>
              <div className="login-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <h2>Welcome back</h2>
            <p>Sign in to your WasteWise account</p>
          </div>

          <form className="login-form" onSubmit={handleLogin} autoComplete="off">
            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder=""
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder=""
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="checkbox-label">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating with FastAPI…' : 'Sign In'}
            </button>

            <div className="login-divider">or</div>

            <button type="button" className="demo-btn" onClick={handleDemo} disabled={loading}>
              🚀 Use Demo Account
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
