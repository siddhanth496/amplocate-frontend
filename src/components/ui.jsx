// ═══════════════════════════════════════════════════════════════════════════
// Amplocate UI primitives — "Signal" design system.
//
// Rules the whole set obeys:
//   1. Colour is information. Neutral chrome, saturated only for status and
//      the single primary action on a screen.
//   2. Labels are sentences, not uppercase mono codes.
//   3. Elevation is a hairline border first, a shadow second.
// ═══════════════════════════════════════════════════════════════════════════

import { Zap, X, ChevronRight } from 'lucide-react';

/**
 * Shared tier lookup so every component agrees on what a score means.
 * `color` is the vivid value for shapes; `text` is the darkened value that
 * stays legible as small type on a light surface.
 */
function tier(score01) {
  if (score01 >= 0.85) return { color: 'var(--color-rel-excellent)', text: 'var(--color-rel-excellent-text)', soft: 'var(--color-emerald-light)' };
  if (score01 >= 0.7)  return { color: 'var(--color-rel-good)',      text: 'var(--color-rel-good-text)',      soft: 'var(--color-emerald-light)' };
  if (score01 >= 0.5)  return { color: 'var(--color-rel-moderate)',  text: 'var(--color-rel-moderate-text)',  soft: 'var(--color-amber-light)' };
  return { color: 'var(--color-rel-poor)', text: 'var(--color-rel-poor-text)', soft: 'var(--color-rose-light)' };
}

// ─── ScoreGauge — half-circle arc, takes 0–100 ────────────────────────────────
export function ScoreGauge({ score = 96, size = 120, stroke = 10, label = 'reliable', showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = Math.PI * r;
  const dash = c * (score / 100);
  const { color } = tier(score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 18 }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          stroke="var(--color-surface-2)" strokeWidth={stroke} fill="none" strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div style={{ position: 'absolute', top: size / 2 - 38, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{
          fontSize: size * 0.32, fontWeight: 700, color, lineHeight: 1,
          letterSpacing: '-0.03em', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums',
        }}>
          {score}
        </div>
        {showLabel && (
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ReliabilityBadge — dot + score, 0–100 ───────────────────────────────────
export function ReliabilityBadge({ score }) {
  const { color, text, soft } = tier(score / 100);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999, background: soft,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: text, fontVariantNumeric: 'tabular-nums' }}>
        {score}
      </span>
    </div>
  );
}

// ─── DotsRel ─────────────────────────────────────────────────────────────────
export function DotsRel({ score, max = 8 }) {
  const filled = Math.round((score / 100) * max);
  const { color } = tier(score / 100);
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < filled ? color : 'var(--color-surface-2)',
        }} />
      ))}
    </div>
  );
}

// ─── BarRel ──────────────────────────────────────────────────────────────────
export function BarRel({ score }) {
  const { color } = tier(score / 100);
  return (
    <div style={{ width: 56, height: 4, borderRadius: 2, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

// ─── VerifiedBy ──────────────────────────────────────────────────────────────
export function VerifiedBy({ n = 3, when = '8m ago' }) {
  const swatch = ['#1b4cf0', '#0e9f6e', '#e8a317', '#e5484d'];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex' }}>
        {swatch.slice(0, Math.min(3, n)).map((c, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: '50%',
            background: c, border: '2px solid var(--color-surface)',
            marginLeft: i === 0 ? 0 : -6,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{n} drivers</span> confirmed · {when}
      </span>
    </div>
  );
}

// ─── ReliabilityTicker ───────────────────────────────────────────────────────
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
    <div style={{ overflow: 'hidden', height: 26, borderTop: '1px solid var(--color-border-light)', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
      <div className="ticker-track" style={{ height: 26, alignItems: 'center', gap: 28, padding: '0 16px', display: 'inline-flex' }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-rel-excellent)', flexShrink: 0 }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MapPin — absolute-positioned marker for mock maps ───────────────────────
export function MapPin({ score, selected, onClick, x, y, label }) {
  const { color } = tier(score / 100);
  return (
    <div
      onClick={onClick}
      className="tap"
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        transform: `translate(-50%, -100%) ${selected ? 'scale(1.12)' : 'scale(1)'}`,
        zIndex: selected ? 10 : 2,
      }}
    >
      <div style={{
        background: selected ? color : 'var(--color-surface)',
        color: selected ? '#fff' : color,
        border: `1.5px solid ${color}`,
        padding: '5px 10px 5px 6px',
        borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11.5, fontWeight: 700,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Zap size={12} />
        {label}
      </div>
      <div style={{
        width: 0, height: 0, marginLeft: '50%', transform: 'translateX(-50%)',
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: `6px solid ${selected ? color : 'var(--color-surface)'}`,
      }} />
    </div>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, mono = false }) {
  return (
    <div className="px-5 pt-6 pb-4">
      {mono && (
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
          {mono}
        </div>
      )}
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 14.5, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.45 }}>{subtitle}</p>}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '-0.01em' }}>{title}</h3>
      {right}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', clickable = false, onClick, id, style }) {
  return (
    <div
      id={id}
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        ...style,
      }}
      className={`${clickable ? 'tap cursor-pointer card-lift' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Card2 — inset / secondary surface ───────────────────────────────────────
export function Card2({ children, className = '', style }) {
  return (
    <div
      style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', ...style }}
      className={className}
    >
      {children}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, valueClass = '' }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div style={{ marginBottom: 2, color: 'var(--color-text-tertiary)' }}>{icon}</div>
      <div>
        <span
          className={`font-display ${valueClass}`}
          style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', display: 'block' }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', display: 'block', marginTop: 2 }}>{label}</span>
      </div>
    </Card>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export function Tag({ children, icon, className = '' }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500,
        color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)',
        padding: '4px 10px', borderRadius: 999,
      }}
      className={className}
    >
      {icon}{children}
    </span>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
export function Chip({ children, active = false, onClick, className = '', style }) {
  return (
    <span
      onClick={onClick}
      className={`tap ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999,
        fontSize: 13, fontWeight: 600,
        background: active ? 'var(--color-brand)' : 'var(--color-surface)',
        border: `1px solid ${active ? 'var(--color-brand)' : 'var(--color-border)'}`,
        color: active ? 'var(--color-on-brand)' : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  success: { bg: 'var(--color-emerald-light)', color: 'var(--color-emerald)' },
  danger:  { bg: 'var(--color-rose-light)',    color: 'var(--color-rose)' },
  warning: { bg: 'var(--color-amber-light)',   color: 'var(--color-amber)' },
  info:    { bg: 'var(--color-brand-light)',   color: 'var(--color-brand)' },
  neutral: { bg: 'var(--color-surface-alt)',   color: 'var(--color-text-secondary)' },
  brand:   { bg: 'var(--color-brand)',         color: 'var(--color-on-brand)' },
};

export function Badge({ children, variant = 'neutral' }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11.5, fontWeight: 600,
      padding: '3px 9px', borderRadius: 999,
      background: v.bg, color: v.color,
    }}>
      {children}
    </span>
  );
}

// ─── StatusDot ───────────────────────────────────────────────────────────────
export function StatusDot({ status }) {
  const color =
    status === 'available' ? 'var(--color-rel-excellent)' :
    status === 'busy'      ? 'var(--color-rel-moderate)' : 'var(--color-rel-poor)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />;
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

// ─── TabBar ──────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 20, padding: '0 20px', borderBottom: '1px solid var(--color-border)' }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="tap"
          style={{
            padding: '11px 0', background: 'transparent', border: 'none',
            color: active === t.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            fontSize: 14, fontWeight: 600,
            borderBottom: `2px solid ${active === t.id ? 'var(--color-brand)' : 'transparent'}`,
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', gap: 10, textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface-alt)', color: 'var(--color-text-tertiary)', marginBottom: 4,
      }}>
        {icon}
      </div>
      <div>
        <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginTop: 4, maxWidth: 300 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── BottomSheet ─────────────────────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,16,19,0.35)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        className="sheet-in"
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-surface)',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '14px 20px 36px',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-surface-2)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>{title}</h3>
          <button onClick={onClose} className="tap" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-alt)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
            <X size={16} />
          </button>
        </div>
        {subtitle && <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 20 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

// ─── PrimaryButton — the one blue thing on the screen ────────────────────────
export function PrimaryButton({ children, onClick, disabled, id, className = '', style }) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`tap ${className}`}
      style={{
        width: '100%', height: 52, borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
        background: disabled ? 'var(--color-surface-2)' : 'var(--color-brand)',
        color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-on-brand)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : 'var(--shadow-brand)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── SecondaryButton — neutral, for the non-committal path ───────────────────
export function SecondaryButton({ children, onClick, disabled, className = '', style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`tap ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 44, padding: '0 18px', borderRadius: 'var(--radius-md)',
        fontSize: 14, fontWeight: 600,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-dark)',
        color: 'var(--color-text-primary)',
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
      className={`tap glass ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 16px', borderRadius: 'var(--radius-md)',
        fontSize: 13.5, fontWeight: 600,
        color: 'var(--color-text-primary)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── IconButton ──────────────────────────────────────────────────────────────
export function IconButton({ children, onClick, ariaLabel, id, className = '', style }) {
  return (
    <button
      id={id}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`tap glass ${className}`}
      style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-primary)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, width: '100%', background: 'var(--color-border)', margin: '16px 0' }} />;
}

// ─── InputField ──────────────────────────────────────────────────────────────
export function InputField({ label, hint, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%', padding: '13px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-dark)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 15, fontFamily: 'inherit', outline: 'none',
        }}
      />
      {hint && <p style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

// ─── TextAreaField ───────────────────────────────────────────────────────────
export function TextAreaField({ label, hint, ...props }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-dark)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 14.5, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.45,
        }}
      />
      {hint && <p style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

// ─── ChipSelect ──────────────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {options.map((opt) => (
        <Chip key={opt} active={isActive(opt)} onClick={() => handleClick(opt)}>{opt}</Chip>
      ))}
    </div>
  );
}

// ─── MenuItem ────────────────────────────────────────────────────────────────
export function MenuItem({ icon, label, desc, onClick, isLast = false }) {
  const IconComp = icon;
  return (
    <button
      onClick={onClick}
      className="tap"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
        textAlign: 'left', background: 'transparent', border: 'none',
        borderBottom: !isLast ? '1px solid var(--color-border-light)' : 'none',
      }}
    >
      {IconComp && <div style={{ color: 'var(--color-text-secondary)' }}><IconComp size={19} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {desc && <span style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2, display: 'block' }}>{desc}</span>}
      </div>
      <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
}
