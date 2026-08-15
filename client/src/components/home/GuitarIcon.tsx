export function GuitarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M60 8c-4 0-7 3-7 7v18c0 2 1 4 3 5l-2 118c0 6 5 11 11 11h10c6 0 11-5 11-11L84 38c2-1 3-3 3-5V15c0-4-3-7-7-7H60z"
        fill="currentColor"
        opacity="0.15"
      />
      <rect x="48" y="6" width="24" height="10" rx="3" fill="currentColor" />
      <circle cx="60" cy="11" r="2.5" fill="var(--color-atlas-bg, #f4f5f7)" />
      <rect x="52" y="38" width="16" height="3" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="50" y="48" width="20" height="3" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="48" y="58" width="24" height="3" rx="1" fill="currentColor" opacity="0.5" />
      <ellipse cx="60" cy="148" rx="34" ry="40" fill="currentColor" opacity="0.2" />
      <ellipse cx="60" cy="148" rx="34" ry="40" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="148" r="10" fill="currentColor" opacity="0.35" />
      <path
        d="M26 148c0-18 15-32 34-32s34 14 34 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line x1="60" y1="61" x2="60" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="54" y1="61" x2="52" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="66" y1="61" x2="68" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="48" y1="61" x2="44" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="72" y1="61" x2="76" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="42" y1="61" x2="36" y2="108" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
    </svg>
  )
}
