import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, MapPin, PackageCheck, Plus, RefreshCw, HandHeart, Utensils, Users, X } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { rescueService, type NewSurplusListing, type SurplusListing } from '../services/rescueService';
import '../styles/rescue.css';

function initialDeadline() {
  const date = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function FoodRescue() {
  const { user } = useAppState();
  const isPartner = user?.role === 'Food Rescue Partner';
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    food_name: '', quantity: '', unit: 'portions', pickup_location: '', available_until: initialDeadline(), notes: '',
  });

  const loadListings = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      setListings(await rescueService.getListings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load food listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
    const refreshTimer = window.setInterval(() => { void loadListings(true); }, 15_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadListings]);

  const available = useMemo(() => listings.filter(item => item.status === 'Available'), [listings]);
  const claimed = useMemo(() => listings.filter(item => item.status === 'Claimed'), [listings]);
  const collected = useMemo(() => listings.filter(item => item.status === 'Collected'), [listings]);

  const submitListing = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const input: NewSurplusListing = {
        ...form,
        quantity: Number(form.quantity),
        available_until: new Date(form.available_until).toISOString(),
      };
      await rescueService.createListing(input);
      setNotice('Your surplus is on the rescue board. Nearby partners can claim it now.');
      setForm({ food_name: '', quantity: '', unit: 'portions', pickup_location: '', available_until: initialDeadline(), notes: '' });
      setShowForm(false);
      await loadListings(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post this food.');
    }
  };

  const runAction = async (id: number, action: 'claim' | 'collected' | 'withdraw') => {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      if (action === 'claim') {
        await rescueService.claim(id);
        setNotice('Pickup reserved for your organization. Contact the canteen if plans change.');
      } else if (action === 'collected') {
        await rescueService.markCollected(id);
        setNotice('Collection recorded. Thanks for keeping this food in the community.');
      } else {
        await rescueService.withdraw(id);
        setNotice('Listing removed from the rescue board.');
      }
      await loadListings(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action could not be completed. Refresh and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const card = (item: SurplusListing) => (
    <article className="rescue-card" key={item.id}>
      <div className="rescue-card-top">
        <div className="rescue-food-icon"><Utensils size={19} /></div>
        <span className={`rescue-status ${item.status.toLowerCase()}`}>{item.status}</span>
      </div>
      <h3>{item.food_name}</h3>
      <p className="rescue-org">{item.organization_name}</p>
      <div className="rescue-quantity"><strong>{item.quantity}</strong><span>{item.unit} available</span></div>
      <div className="rescue-detail"><MapPin size={15} /><span>{item.pickup_location}</span></div>
      <div className="rescue-detail"><Clock3 size={15} /><span>Collect by {formatDeadline(item.available_until)}</span></div>
      {item.notes && <p className="rescue-notes">{item.notes}</p>}
      {item.status === 'Claimed' && item.claimed_by_name && <p className="rescue-claim-note">Pickup reserved by {item.claimed_by_name}</p>}
      <div className="rescue-card-actions">
        {isPartner && item.status === 'Available' && (
          <button className="btn btn-primary" disabled={busyId === item.id} onClick={() => runAction(item.id, 'claim')}>
            <HandHeart size={16} /> {busyId === item.id ? 'Reserving…' : 'Reserve pickup'}
          </button>
        )}
        {isPartner && item.status === 'Claimed' && item.claimed_by_id === Number(user?.id) && (
          <button className="btn btn-primary" disabled={busyId === item.id} onClick={() => runAction(item.id, 'collected')}>
            <PackageCheck size={16} /> Mark collected
          </button>
        )}
        {!isPartner && item.status === 'Available' && item.posted_by_id === Number(user?.id) && (
          <button className="rescue-text-button" disabled={busyId === item.id} onClick={() => runAction(item.id, 'withdraw')}>
            <X size={15} /> Remove listing
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className="rescue-page">
      <section className={`rescue-hero ${isPartner ? 'partner' : 'canteen'}`}>
        <div className="rescue-hero-copy">
          <span className="rescue-eyebrow"><HandHeart size={15} /> FOOD RESCUE NETWORK</span>
          <h2>{isPartner ? 'Good food, within reach.' : 'Share today’s surplus.'}</h2>
          <p>{isPartner
            ? 'Find fresh, safe surplus nearby. Reserve a pickup, collect it, and get it to the people who need it.'
            : 'Post safe, unserved food with a pickup deadline. Local rescue partners can reserve it before it goes to waste.'}</p>
        </div>
        <div className="rescue-hero-art" aria-hidden="true">
          <div className="rescue-art-orbit orbit-one" />
          <div className="rescue-art-orbit orbit-two" />
          <div className="rescue-art-center"><HandHeart size={46} strokeWidth={1.5} /></div>
          <span className="rescue-art-dot dot-one">✦</span><span className="rescue-art-dot dot-two">✦</span>
        </div>
      </section>

      <section className="rescue-stats">
        <div><span className="rescue-stat-icon mint"><Utensils size={18} /></span><strong>{available.length}</strong><span>available now</span></div>
        <div><span className="rescue-stat-icon amber"><Clock3 size={18} /></span><strong>{claimed.length}</strong><span>pickup reserved</span></div>
        <div><span className="rescue-stat-icon blue"><Users size={18} /></span><strong>{collected.length}</strong><span>rescued by your network</span></div>
      </section>

      <div className="rescue-board-heading">
        <div><h2>{isPartner ? 'Nearby food' : 'Shared rescue board'}</h2><p>{isPartner ? 'Fresh listings with a clear collection window.' : 'Open offers across the network and pickup status for your canteen.'}</p></div>
        <div className="rescue-heading-actions">
          <button className="rescue-refresh" onClick={() => loadListings()} aria-label="Refresh listings"><RefreshCw size={16} /> Refresh</button>
          {!isPartner && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Post surplus</button>}
        </div>
      </div>

      {notice && <div className="rescue-notice">{notice}</div>}
      {error && <div className="rescue-error">{error}</div>}

      {showForm && !isPartner && (
        <form className="rescue-form" onSubmit={submitListing}>
          <div className="rescue-form-heading"><div><h3>Offer food for pickup</h3><p>Only list food that has been kept safely and is still suitable to serve.</p></div><button type="button" className="rescue-close" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18} /></button></div>
          <div className="rescue-form-grid">
            <label>Food name<input required maxLength={120} value={form.food_name} onChange={e => setForm({ ...form, food_name: e.target.value })} placeholder="e.g. Vegetable pulao" /></label>
            <label>Quantity<div className="rescue-quantity-input"><input required type="number" min="0.1" step="0.1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="40" /><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option>portions</option><option>kg</option><option>packs</option><option>boxes</option></select></div></label>
            <label>Pickup location<input required maxLength={200} value={form.pickup_location} onChange={e => setForm({ ...form, pickup_location: e.target.value })} placeholder="Canteen, Main Block" /></label>
            <label>Collect by<input required type="datetime-local" value={form.available_until} onChange={e => setForm({ ...form, available_until: e.target.value })} /></label>
            <label className="rescue-form-wide">Pickup notes <span>(optional)</span><textarea maxLength={500} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Dietary details, packaging, or where to ask for the parcel." /></label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>Publish to rescue board</button>
        </form>
      )}

      {loading ? <div className="rescue-empty">Loading the rescue board…</div> : available.length ? (
        <div className="rescue-grid">{available.map(card)}</div>
      ) : (
        <div className="rescue-empty"><span>🥬</span><h3>No food listed right now</h3><p>{isPartner ? 'Check back soon. New surplus will appear here as canteens post it.' : 'When your canteen has safe surplus, post it here so a local partner can collect it.'}</p></div>
      )}

      {isPartner && claimed.length > 0 && <section className="rescue-history"><div className="rescue-board-heading"><div><h2>Your reserved pickups</h2><p>Confirm the collection once food is in your care.</p></div></div><div className="rescue-grid">{claimed.map(card)}</div></section>}
      {!isPartner && listings.some(item => item.status !== 'Available' && item.posted_by_id === Number(user?.id)) && (
        <section className="rescue-history"><div className="rescue-board-heading"><div><h2>Pickup activity</h2><p>Reserved, collected, or expired offers from your canteen.</p></div></div><div className="rescue-grid">{listings.filter(item => item.status !== 'Available' && item.posted_by_id === Number(user?.id)).map(card)}</div></section>
      )}
    </div>
  );
}
