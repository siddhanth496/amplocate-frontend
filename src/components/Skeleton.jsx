export function Skeleton({ w, h = 14, r = 12, className = '', style }) {
  return <div className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function ChargerCardSkeleton() {
  return (
    <div className="p-4 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-3.5">
        <Skeleton w={44} h={44} r={22} />
        <div className="flex-1 space-y-2">
          <Skeleton w="65%" h={14} />
          <Skeleton w="45%" h={11} />
        </div>
      </div>
      <div className="flex gap-1.5 mt-3 pl-[58px]">
        <Skeleton w={72} h={22} r={8} />
        <Skeleton w={64} h={22} r={8} />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <Skeleton w={36} h={36} r={12} />
      <Skeleton w="55%" h={20} className="mt-2.5" />
      <Skeleton w="75%" h={10} className="mt-1.5" />
    </div>
  );
}

export function HeroSkeleton({ h = 190 }) {
  return <Skeleton w="100%" h={h} r={24} />;
}
