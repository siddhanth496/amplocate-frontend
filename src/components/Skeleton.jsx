export function Skeleton({ w, h = 14, r = 8, className = '', style }) {
  return <div className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

const shell = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
};

export function ChargerCardSkeleton() {
  return (
    <div className="p-4" style={shell}>
      <div className="flex items-center gap-2">
        <Skeleton w={8} h={8} r={4} />
        <Skeleton w={104} h={12} />
      </div>
      <Skeleton w="70%" h={16} className="mt-2.5" />
      <Skeleton w="45%" h={12} className="mt-2" />
      <div className="flex gap-1.5 mt-3">
        <Skeleton w={82} h={24} r={8} />
        <Skeleton w={64} h={24} r={8} />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4" style={shell}>
      <Skeleton w={28} h={28} r={8} />
      <Skeleton w="55%" h={22} className="mt-3" />
      <Skeleton w="75%" h={12} className="mt-2" />
    </div>
  );
}

export function HeroSkeleton({ h = 190 }) {
  return <Skeleton w="100%" h={h} r={16} />;
}
