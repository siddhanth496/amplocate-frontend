export default function Logo({ size = 32, showWordmark = true, wordmarkClass = '' }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--color-brand)" />
        <path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#ffffff" />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-[var(--color-text-primary)] ${wordmarkClass}`}>
          Amp<span className="text-[var(--color-brand)]">locate</span>
        </span>
      )}
    </div>
  );
}
