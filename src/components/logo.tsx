export function Logo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="GeoFix logo"
    >
      <defs>
        <linearGradient id="gf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <path
        d="M32 4.5c-12 0-21.7 9.4-21.7 21 0 14.4 18 27.8 19.6 28.9a3 3 0 0 0 4.2 0c1.6-1.1 19.6-14.5 19.6-28.9 0-11.6-9.7-21-21.7-21Z"
        fill="url(#gf-g)"
      />
      <path
        d="M32 15.5a9.4 9.4 0 0 1 8.1 4.7 3.1 3.1 0 0 1-5.4 3.1 3.2 3.2 0 0 0-5.4 0 3.1 3.1 0 0 1-5.4-3.1A9.4 9.4 0 0 1 32 15.5Z"
        fill="var(--background)"
      />
    </svg>
  )
}

export function LogoFull({
  className = '',
  size = 32,
  textClassName = '',
}: {
  className?: string
  size?: number
  textClassName?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span
        className={`font-display text-xl font-semibold tracking-tight ${textClassName}`}
      >
        Geo<span className="text-primary">Fix</span>
      </span>
    </span>
  )
}