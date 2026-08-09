export function AmpMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ampg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b4cf0" />
          <stop offset="58%" stopColor="#3a6bff" />
          <stop offset="100%" stopColor="#6d92ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#ampg)" />
      <path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#ffffff" />
    </svg>
  );
}

export default function Logo({ size = 32, showWordmark = true, wordmarkClass = '', tagline = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <AmpMark size={size} />
      {showWordmark && (
        <div className="leading-none">
          <span
            className={`font-display font-bold ${wordmarkClass}`}
            style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.035em' }}
          >
            Amplocate
          </span>
          {tagline && (
            <div className="text-[11.5px] font-medium mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Chargers that actually work
            </div>
          )}
        </div>
      )}
    </div>
  );
}
