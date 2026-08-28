export function BrandMark({ className = "" }: {className?: string}) {
  return (
    <svg className={`brand-mark-svg ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M10 20.5c8.8 0 16 3.8 22 11.5 6-7.7 13.2-11.5 22-11.5v24c-8.2 0-15.2 3.1-22 9.5-6.8-6.4-13.8-9.5-22-9.5z"
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M32 18v28" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="32" cy="27" r="2.3" fill="var(--gold)"/>
      <path d="M32 10v7M24 18l4.3 4.3M40 18l-4.3 4.3" stroke="var(--gold)" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}
