export function AmpMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ampg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#65a30d" />
          <stop offset="60%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#d4f76a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#ampg)" />
      <path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#10150a" />
    </svg>
  );
}

export default function Logo({ size = 32, showWordmark = true, wordmarkClass = '', tagline = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <AmpMark size={size} />
      {showWordmark && (
        <div className="leading-none">
          <span className={`font-display font-bold text-[var(--color-text-primary)] ${wordmarkClass}`}>
            Amp<span className="amp-gradient-text">locate</span>
          </span>
          {tagline && (
            <div className="text-[10px] font-semibold tracking-wide mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              CHARGE WITH CONFIDENCE
            </div>
          )}
        </div>
      )}
    </div>
  );
}
