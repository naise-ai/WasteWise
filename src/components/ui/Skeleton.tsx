// ============================================================
// WasteWise — Skeleton Loading Components
// ============================================================
import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={40} height={40} borderRadius={10} />
        <Skeleton width={50} height={20} borderRadius={6} />
      </div>
      <Skeleton width={80} height={32} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={14} borderRadius={4} />
    </div>
  );
}

export function ChartCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Skeleton width={160} height={18} borderRadius={5} style={{ marginBottom: 8 }} />
          <Skeleton width={120} height={13} borderRadius={4} />
        </div>
        <Skeleton width={120} height={32} borderRadius={8} />
      </div>
      <Skeleton width="100%" height={height} borderRadius={10} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton width={240} height={36} borderRadius={8} />
          <Skeleton width={140} height={36} borderRadius={8} />
          <Skeleton width={140} height={36} borderRadius={8} />
        </div>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16, padding: '12px 0',
            borderBottom: i < rows - 1 ? '1px solid var(--border-color)' : 'none'
          }}>
            <Skeleton width={80} height={14} borderRadius={4} />
            <Skeleton width={70} height={14} borderRadius={4} />
            <Skeleton width={120} height={14} borderRadius={4} style={{ flex: 1 }} />
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={50} height={14} borderRadius={4} />
            <Skeleton width={80} height={14} borderRadius={4} />
            <Skeleton width={60} height={22} borderRadius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* KPI Grid */}
      <div className="kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-col-8">
          <ChartCardSkeleton height={240} />
        </div>
        <div className="chart-col-4">
          <ChartCardSkeleton height={240} />
        </div>
      </div>
    </div>
  );
}
