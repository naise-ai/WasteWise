import { useState } from 'react';
import { Eye, EyeOff, Leaf, TrendingDown, BarChart2, Lightbulb, AlertCircle, HandHeart, Utensils, PackageCheck } from 'lucide-react';
import { useAppDispatch } from '../context/AppContext';
import { authService } from '../services/authService';
import '../styles/login.css';

type AccountKind = 'canteen' | 'partner';

const DEMO_ACCOUNTS = {
  canteen: { email: 'naise.shekhar@vsit.edu.in', password: 'admin@123' },
  partner: { email: 'rescue@wastewise.org', password: 'rescue@123' },
};

export default function Login() {
  const dispatch = useAppDispatch();
  const [accountKind, setAccountKind] = useState<AccountKind>('canteen');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const partnerMode = accountKind === 'partner';

  const chooseKind = (kind: AccountKind) => {
    setAccountKind(kind);
    setIsRegistering(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !password) { setError('Enter your email and password to continue.'); return; }
    setLoading(true);
    try {
      const { user } = await authService.login(email, password);
      const expectedRole = partnerMode ? 'Food Rescue Partner' : 'Canteen Administrator';
      if (user.role !== expectedRole) {
        authService.logout();
        setError(partnerMode
          ? 'That is a canteen account. Choose “Canteen team” to sign in.'
          : 'That is a rescue partner account. Choose “Rescue partner” to sign in.');
        return;
      }
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !organization.trim() || !email || password.length < 8) {
      setError('Add your name, organization, email, and a password of at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authService.registerRescuePartner({
        name: name.trim(), organization_name: organization.trim(), email: email.trim(), password,
      });
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    const demo = DEMO_ACCOUNTS[accountKind];
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
    setLoading(true);
    try {
      const { user } = await authService.login(demo.email, demo.password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (err) {
      setError(`Demo sign-in failed: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = isRegistering ? handleRegister : handleLogin;

  return (
    <div className={`login-page ${partnerMode ? 'rescue-mode' : 'canteen-mode'}`}>
      <section className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">{partnerMode ? <HandHeart size={25} color="white" /> : <Leaf size={26} color="white" />}</div>
          <span className="login-brand-name">WasteWise</span>
          <span className="login-brand-chip">{partnerMode ? 'RESCUE NETWORK' : 'CANTEEN IMPACT'}</span>
        </div>

        <div className="login-hero">
          <span className="login-kicker">{partnerMode ? 'GOOD FOOD HAS A NEXT STOP' : 'WASTE LESS. SERVE SMARTER.'}</span>
          <h1>{partnerMode ? <>From the kitchen<br /><span>to the community.</span></> : <>Know what’s left.<br /><span>Make every meal count.</span></>}</h1>
          <p>{partnerMode
            ? 'Rescue safe surplus from nearby canteens. Reserve a pickup, collect with confidence, and connect good food to people who need it.'
            : 'Track daily food waste, learn what drives it, and share safe surplus with trusted community food rescue partners.'}</p>
        </div>

        <div className="login-impact-card">
          <div className="impact-card-icon"><HandHeart size={21} /></div>
          <div className="impact-card-copy"><span>ONE SHARED PURPOSE</span><strong>Food saved is care delivered.</strong></div>
          <div className="impact-route"><span><Utensils size={15} /></span><i /><span><PackageCheck size={15} /></span></div>
        </div>

        <div className="login-illustration">
          {(partnerMode ? [
            { icon: <HandHeart size={17} />, label: 'Local offers', value: 'Ready to rescue' },
            { icon: <PackageCheck size={17} />, label: 'Pickup', value: 'Reserved by you' },
          ] : [
            { icon: <TrendingDown size={17} />, label: 'Waste trends', value: 'Clear patterns' },
            { icon: <BarChart2 size={17} />, label: 'Analytics', value: 'Live insight' },
            { icon: <Lightbulb size={17} />, label: 'Recommendations', value: 'Useful next steps' },
          ]).map((item, index) => (
            <div key={index} className="login-mini-card">
              <div className="login-mini-card-icon">{item.icon}</div>
              <div><span>{item.label}</span><strong>{item.value}</strong></div>
            </div>
          ))}
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <span className={`login-role-icon ${partnerMode ? 'partner' : ''}`}>{partnerMode ? <HandHeart size={21} /> : <Leaf size={21} />}</span>
            <h2>{isRegistering ? 'Join the rescue network' : partnerMode ? 'Welcome, food rescuer' : 'Welcome back'}</h2>
            <p>{isRegistering ? 'Create your organization’s partner account.' : partnerMode ? 'Find and reserve surplus food near you.' : 'Sign in to manage your canteen and its impact.'}</p>
          </div>

          <div className="login-persona-switch" role="tablist" aria-label="Choose account type">
            <button type="button" role="tab" aria-selected={!partnerMode} className={!partnerMode ? 'selected' : ''} onClick={() => chooseKind('canteen')}>
              <Utensils size={16} /><span>Canteen team</span>
            </button>
            <button type="button" role="tab" aria-selected={partnerMode} className={partnerMode ? 'selected partner-selected' : ''} onClick={() => chooseKind('partner')}>
              <HandHeart size={16} /><span>Rescue partner</span>
            </button>
          </div>

          <form className="login-form" onSubmit={submitHandler} autoComplete="on">
            {error && <div className="login-error"><AlertCircle size={16} />{error}</div>}

            {isRegistering && <>
              <div className="form-group"><label className="form-label" htmlFor="partner-name">Your name</label><input id="partner-name" className="form-control" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Full name" /></div>
              <div className="form-group"><label className="form-label" htmlFor="organization">Organization name</label><input id="organization" className="form-control" autoComplete="organization" value={organization} onChange={event => setOrganization(event.target.value)} placeholder="NGO or community group" /></div>
            </>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className="form-control" placeholder="you@organization.org" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input id="password" type={showPass ? 'text' : 'password'} className="form-control" placeholder={isRegistering ? 'At least 8 characters' : ''} value={password} onChange={event => setPassword(event.target.value)} autoComplete={isRegistering ? 'new-password' : 'current-password'} style={{ paddingRight: 44 }} />
                <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Please wait…' : isRegistering ? 'Create partner account' : partnerMode ? 'Sign in to rescue board' : 'Sign in to canteen'}
            </button>

            {partnerMode && <button type="button" className="login-switch-link" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
              {isRegistering ? 'Already registered? Sign in' : 'New organization? Create a partner account'}
            </button>}

            {!isRegistering && <>
              <div className="login-divider"><span>or explore with a demo</span></div>
              <button type="button" className="demo-btn" onClick={handleDemo} disabled={loading}>
                {partnerMode ? '🌱 Open the rescue partner demo' : '📊 Open the canteen demo'}
              </button>
            </>}
          </form>
          <p className="login-footer-note">A shared network for less waste and more good meals.</p>
        </div>
      </section>
    </div>
  );
}
