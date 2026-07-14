// ─── Score Gauge — half-circle SVG arc ───────────────────────────────────────
export function ScoreGauge({ score = 96, size = 120, stroke = 10, label = 'reliable', showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = Math.PI * r;
  const dash = c * (score / 100);
  const color =
    score >= 85 ? 'var(--color-lime)' :
    score >= 65 ? 'var(--color-emerald)' :
    score >= 40 ? 'var(--color-amber)' : 'var(--color-rose)';
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 18 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M ${stroke/2} ${size/2} A ${r} ${r} 0 0 1 ${size-stroke/2} ${size/2}`}
          stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" strokeLinecap="round"
        />
        <path
          d={`M ${stroke/2} ${size/2} A ${r} ${r} 0 0 1 ${size-stroke/2} ${size/2}`}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div style={{ position: 'absolute', top: size / 2 - 38, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{
          fontSize: size * 0.32, fontWeight: 600, color, lineHeight: 1,
          letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        }}>
          {score}
        </div>
        {showLabel && (
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reliability Badge — pulsing dot + score ──────────────────────────────────
export function ReliabilityBadge({ score }) {
  const color =
    score >= 85 ? 'var(--color-lime)' :
    score >= 65 ? 'var(--color-emerald)' :
    score >= 40 ? 'var(--color-amber)' : 'var(--color-rose)';
  const bg =
    score >= 85 ? 'rgba(200,255,58,0.12)' :
    score >= 65 ? 'rgba(127,229,168,0.12)' :
    score >= 40 ? 'rgba(251,191,36,0.12)' : 'rgba(255,126,107,0.12)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${color}33`,
    }}>
      <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
        {score}
      </span>
    </div>
  );
}

// ─── Dots reliability viz ─────────────────────────────────────────────────────
export function DotsRel({ score, max = 8 }) {
  const filled = Math.round((score / 100) * max);
  const color =
    score >= 85 ? 'var(--color-lime)' :
    score >= 65 ? 'var(--color-emerald)' :
    score >= 40 ? 'var(--color-amber)' : 'var(--color-rose)';
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < filled ? color : 'rgba(255,255,255,0.08)',
        }} />
      ))}
    </div>
  );
}

// ─── Bar reliability viz ──────────────────────────────────────────────────────
export function BarRel({ score }) {
  const color =
    score >= 85 ? 'var(--color-lime)' :
    score >= 65 ? 'var(--color-emerald)' :
    score >= 40 ? 'var(--color-amber)' : 'var(--color-rose)';
  return (
    <div style={{ width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

// ─── VerifiedBy — avatar pile + label ────────────────────────────────────────
export function VerifiedBy({ n = 3, when = '8m ago' }) {
  const colors = ['#c8ff3a', '#7fe5a8', '#fbbf24', '#fb7185'];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex' }}>
        {colors.slice(0, Math.min(3, n)).map((c, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: c, border: '2px solid var(--color-bg)',
            marginLeft: i === 0 ? 0 : -6,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', letterSpacing: '-0.01em' }}>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{n} drivers</span> confirmed · {when}
      </span>
    </div>
  );
}

// ─── ReliabilityTicker — live activity strip ──────────────────────────────────
export function ReliabilityTicker() {
  const items = [
    'Phoenix Mall · verified 4m ago',
    'ITC Gardenia · 12 sessions today',
    'BTM Layout 2nd · queue clear',
    'Indiranagar 100ft · ICE blocked',
    'Whitefield Pavilion · 94% uptime',
    'Koramangala Forum · verified 1m ago',
  ];
  return (
    <div style={{ overflow: 'hidden', height: 24, borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'rgba(200,255,58,0.025)' }}>
      <div className="ticker-track" style={{ height: 24, alignItems: 'center', gap: 28, padding: '0 16px', display: 'inline-flex' }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-lime)', flexShrink: 0 }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Map Pin — charger marker ─────────────────────────────────────────────────
import { Zap } from 'lucide-react';

export function MapPin({ score, selected, onClick, x, y, label }) {
  const color =
    score >= 85 ? 'var(--color-lime)' :
    score >= 65 ? 'var(--color-emerald)' :
    score >= 40 ? 'var(--color-amber)' : 'var(--color-rose)';
  return (
    <div
      onClick={onClick}
      className="tap"
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        transform: `translate(-50%, -100%) ${selected ? 'scale(1.15)' : 'scale(1)'}`,
        zIndex: selected ? 10 : 2,
      }}
    >
      <div style={{
        background: selected ? color : 'var(--color-surface-alt)',
        color: selected ? '#0a0e0c' : color,
        border: `1.5px solid ${color}`,
        padding: '5px 10px 5px 6px',
        borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-mono)',
        fontSize: 11, fontWeight: 600,
        boxShadow: selected ? `0 8px 24px ${color}40` : '0 4px 12px rgba(0,0,0,0.4)',
      }}>
        <Zap size={12} />
        {label}
      </div>
      <div style={{
        width: 0, height: 0, marginLeft: '50%', transform: 'translateX(-50%)',
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: `6px solid ${selected ? color : 'var(--color-surface-alt)'}`,
      }} />
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, mono = false }) {
  return (
    <div className="px-5 pt-6 pb-4">
      {mono && (
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          {mono}
        </div>
      )}
      <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.025em', lineHeight: 1.12 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.45 }}>{subtitle}</p>}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>{title}</h3>
      {right}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', clickable = false, onClick, id, style }) {
  return (
    <div
      id={id}
      onClick={onClick}
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, ...style }}
      className={`${clickable ? 'tap cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Card2 — secondary surface card ──────────────────────────────────────────
export function Card2({ children, className = '', style }) {
  return (
    <div
      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 14, ...style }}
      className={className}
    >
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, valueClass = '' }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div style={{ marginBottom: 4, color: 'var(--color-text-tertiary)' }}>{icon}</div>
      <div>
        <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', display: 'block' }} className={valueClass}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', display: 'block', marginTop: 4 }}>{label}</span>
      </div>
    </Card>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, icon, className = '' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: 999 }} className={className}>
      {icon}{children}
    </span>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
export function Chip({ children, active = false, onClick, className = '', style }) {
  return (
    <span
      onClick={onClick}
      className={`tap ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 11px', borderRadius: 999,
        fontSize: 12.5, fontWeight: 500,
        background: active ? 'var(--color-lime)' : 'var(--color-surface-alt)',
        border: active ? '1px solid var(--color-lime)' : '1px solid var(--color-border)',
        color: active ? '#0a0e0c' : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  success: { bg: 'rgba(127,229,168,0.12)', color: 'var(--color-emerald)', border: 'rgba(127,229,168,0.25)' },
  danger:  { bg: 'rgba(255,126,107,0.12)', color: 'var(--color-rose)',    border: 'rgba(255,126,107,0.25)' },
  warning: { bg: 'rgba(251,191,36,0.12)',  color: 'var(--color-amber)',   border: 'rgba(251,191,36,0.25)' },
  info:    { bg: 'rgba(200,255,58,0.1)',   color: 'var(--color-lime)',    border: 'rgba(200,255,58,0.25)' },
  neutral: { bg: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  brand:   { bg: 'var(--color-lime)',      color: '#0a0e0c',              border: 'var(--color-lime)' },
};

export function Badge({ children, variant = 'neutral' }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '3px 8px', borderRadius: 999,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
    }}>
      {children}
    </span>
  );
}

// ─── StatusDot ───────────────────────────────────────────────────────────────
export function StatusDot({ status }) {
  const color =
    status === 'available' ? 'var(--color-lime)' :
    status === 'busy'      ? 'var(--color-amber)' : 'var(--color-rose)';
  return <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />;
}

// ─── FilterChips ─────────────────────────────────────────────────────────────
export function FilterChips({ options, active, onChange, renderIcon }) {
  return (
    <div style={{ padding: '0 16px 12px', overflowX: 'auto', display: 'flex', gap: 8 }} className="hide-scrollbar">
      {options.map((opt) => (
        <Chip key={opt} active={active === opt} onClick={() => onChange(opt)}>
          {renderIcon && renderIcon(opt)}
          {opt}
        </Chip>
      ))}
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 18, padding: '0 20px', borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="tap"
          style={{
            padding: '10px 0', background: 'transparent', border: 'none',
            color: active === t.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontSize: 14, fontWeight: 500,
            borderBottom: `2px solid ${active === t.id ? 'var(--color-lime)' : 'transparent'}`,
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }}>{icon}</div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── BottomSheet ─────────────────────────────────────────────────────────────
import { X } from 'lucide-react';

export function BottomSheet({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div
        className="sheet-in"
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-surface)',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '14px 20px 36px',
          maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-dark)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="tap" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── PrimaryButton — lime CTA ─────────────────────────────────────────────────
export function PrimaryButton({ children, onClick, disabled, id, className = '', style }) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`tap ${className}`}
      style={{
        width: '100%', height: 56, borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
        background: disabled ? 'var(--color-surface-alt)' : 'var(--color-lime)',
        color: disabled ? 'var(--color-text-tertiary)' : '#0a0e0c',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── GhostButton ─────────────────────────────────────────────────────────────
export function GhostButton({ children, onClick, className = '', style }) {
  return (
    <button
      onClick={onClick}
      className={`tap ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 18px', borderRadius: 14,
        fontSize: 13, fontWeight: 500,
        color: 'var(--color-text-primary)',
        background: 'rgba(15,20,17,0.85)',
        border: '1px solid var(--color-border-dark)',
        backdropFilter: 'blur(20px)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────
export function IconButton({ children, onClick, ariaLabel, id, className = '', style }) {
  return (
    <button
      id={id}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`tap ${className}`}
      style={{
        width: 40, height: 40, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,20,17,0.85)',
        border: '1px solid var(--color-border-dark)',
        backdropFilter: 'blur(20px)',
        color: 'var(--color-text-primary)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, width: '100%', background: 'var(--color-border)', margin: '16px 0' }} />;
}

// ─── InputField ───────────────────────────────────────────────────────────────
export function InputField({ label, ...props }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%', padding: '14px 16px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-dark)',
          borderRadius: 14,
          color: 'var(--color-text-primary)',
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
        }}
      />
    </div>
  );
}

// ─── TextAreaField ────────────────────────────────────────────────────────────
export function TextAreaField({ label, ...props }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-dark)',
          borderRadius: 14,
          color: 'var(--color-text-primary)',
          fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.4,
        }}
      />
    </div>
  );
}

// ─── ChipSelect ───────────────────────────────────────────────────────────────
export function ChipSelect({ options, selected, onChange, multi = false }) {
  const handleClick = (opt) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
    } else {
      onChange(opt);
    }
  };
  const isActive = (opt) => (multi ? selected.includes(opt) : selected === opt);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {options.map((opt) => (
        <Chip key={opt} active={isActive(opt)} onClick={() => handleClick(opt)}>{opt}</Chip>
      ))}
    </div>
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────
import { ChevronRight } from 'lucide-react';

export function MenuItem({ icon, label, desc, onClick, isLast = false }) {
  const IconComp = icon;
  return (
    <button
      onClick={onClick}
      className="tap"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
        textAlign: 'left', background: 'transparent', border: 'none',
        borderBottom: !isLast ? '1px solid var(--color-border)' : 'none',
      }}
    >
      {IconComp && <div style={{ color: 'var(--color-text-secondary)' }}><IconComp size={20} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: 'var(--color-text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {desc && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, display: 'block' }}>{desc}</span>}
      </div>
      <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
}
